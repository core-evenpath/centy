import 'server-only';

// ── Orchestrator entry point ──────────────────────────────────────────
//
// Loads the six signals (partner, flow, blocks, datamap, session, RAG)
// in parallel where possible, resolves the policy decision, asks
// Gemini with a tight allow-list, validates the response, and builds
// the blockData payload.
//
// The surrounding chat route becomes a thin HTTP adapter around
// `orchestrate()`.

import { GoogleGenAI } from '@google/genai';
import { buildBlockData } from '@/lib/relay/admin-block-data';
import { buildPolicyDecision } from './policy';
import { buildSystemPrompt } from './prompt';
import {
  loadBlocksSignal,
  loadDatamapSignal,
  loadFlowSignal,
  loadPartnerSignal,
  loadRagSignal,
  loadSessionSignal,
} from './signals';
import type {
  OrchestratorContext,
  OrchestratorResponse,
  SignalBundle,
} from './types';
import { classifyEngineHint } from '@/lib/relay/engine-keywords';
import { selectActiveEngine } from '@/lib/relay/engine-selection';
import { getPartnerEngines } from '@/lib/relay/engine-recipes';
import { setActiveEngine } from '@/lib/relay/session-store';
import { getEngineHealth } from '@/actions/relay-health-actions';
import type { Engine } from '@/lib/relay/engine-types';

import { isServiceBreakFallback, CONTACT_BLOCK_ID } from './service-break';
import {
  ORDER_TRACKER_BLOCK_IDS,
  loadOrderTrackerData,
} from '@/lib/relay/commerce/order-tracker-data';
import {
  BOOKING_CONFIRMATION_BLOCK_IDS,
  loadBookingConfirmationData,
} from '@/lib/relay/booking/booking-confirmation-data';
import {
  SPACE_CONFIRMATION_BLOCK_IDS,
  loadSpaceConfirmationData,
} from '@/lib/relay/space/space-confirmation-data';

const MODEL = 'gemini-2.5-flash';

// Shared-tagged block ids — used by M12 degraded mode to narrow the
// catalog when Health is red. Resolved once at module load.
import { ALL_BLOCKS_DATA } from '@/app/admin/relay/blocks/previews/_registry-data';
import type { BlockTag } from '@/lib/relay/engine-types';

const SHARED_BLOCK_IDS = new Set<string>(
  ALL_BLOCKS_DATA
    .filter(
      (b) => ((b as typeof b & { engines?: BlockTag[] }).engines ?? [])
        .includes('shared'),
    )
    .map((b) => b.id),
);

interface GeminiPayload {
  blockId?: string;
  text?: string;
  suggestions?: string[];
}

function safeJsonParse(raw: string): GeminiPayload | null {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function extractFirstJsonObject(raw: string): string | null {
  const start = raw.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < raw.length; i++) {
    const c = raw[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (c === '\\') {
      escape = true;
      continue;
    }
    if (c === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return raw.slice(start, i + 1);
    }
  }
  return null;
}

/** Tolerant parser — strips fences, grabs the first `{...}` object. */
function parseGeminiJson(raw: string): GeminiPayload {
  const trimmed = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
  if (!trimmed) return {};
  const direct = safeJsonParse(trimmed);
  if (direct) return direct;
  const extracted = extractFirstJsonObject(trimmed);
  if (extracted) {
    const parsed = safeJsonParse(extracted);
    if (parsed) return parsed;
  }
  return {};
}

async function callGemini(
  systemPrompt: string,
  ctx: OrchestratorContext,
): Promise<GeminiPayload> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[orchestrator] GEMINI_API_KEY is not set');
    return {};
  }
  const genAI = new GoogleGenAI({ apiKey });
  const history = ctx.messages.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));
  try {
    const response = await genAI.models.generateContent({
      model: MODEL,
      contents: history,
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 2048,
        temperature: 0.3,
      },
    });
    return parseGeminiJson(response.text?.trim() ?? '');
  } catch (err) {
    console.error('[orchestrator] Gemini call failed:', err);
    return {};
  }
}

export async function orchestrate(
  ctx: OrchestratorContext,
): Promise<OrchestratorResponse> {
  // 1. Partner + session first — partner signal carries `functionId` and
  //    partnerData (the source of `partner.engines` / `functionId` for the
  //    engine recipe); session signal carries the previous turn's
  //    `activeEngine` for stickiness.
  const [partner, session] = await Promise.all([
    loadPartnerSignal(ctx.partnerId),
    loadSessionSignal(ctx),
  ]);

  // 2. Engine selection (M12 — pure, cheap). Run per turn.
  const lastMsg = ctx.messages[ctx.messages.length - 1]?.content ?? '';
  const engineHint = classifyEngineHint(lastMsg);
  // Post-P3.M03: getPartnerEngines returns partner.engines only. If the
  // Firestore doc lacks engines (pre-Phase-2 partner or testing shape),
  // this returns []; downstream selectActiveEngine's rule 5 yields
  // engine=null and the orchestrator falls into the Phase 1 legacy
  // engine-agnostic path.
  const partnerEngines = getPartnerEngines(
    (partner.partnerData ?? {}) as Parameters<typeof getPartnerEngines>[0],
  );
  const previousActive: Engine | null =
    (session.session?.activeEngine as Engine | null | undefined) ?? null;
  const selection = selectActiveEngine({
    currentActive: previousActive,
    engineHint: engineHint.engineHint,
    engineConfidence: engineHint.engineConfidence,
    partnerEngines,
  });
  const activeEngine: Engine | null = selection.engine;

  // 3. Persist engine change (fire-and-forget; any write failure is logged
  //    and swallowed by the session store, never blocking the turn).
  //    Preview mode suppresses this write so sandbox runs don't mutate
  //    production session state.
  if (activeEngine !== previousActive && !ctx.preview) {
    try {
      await setActiveEngine(ctx.partnerId, ctx.conversationId, activeEngine);
    } catch (err) {
      console.error('[orchestrator] setActiveEngine failed', err);
    }
  }

  // 4. Load the remaining signals with the active engine applied.
  //    Flow + blocks scope by activeEngine; datamap is engine-agnostic.
  const [flow, blocks, datamap] = await Promise.all([
    loadFlowSignal(ctx, partner.functionId, activeEngine),
    loadBlocksSignal(ctx.partnerId, activeEngine),
    loadDatamapSignal(ctx.partnerId),
  ]);

  // 5. RAG depends on flow-detected intent.
  const rag = await loadRagSignal(ctx, flow.intent);

  // 6. Health (shadow mode — never throws, never blocks). Degraded mode
  //    kicks in only when activeEngine is set AND Health reads red.
  let healthStatus: 'green' | 'amber' | 'red' | 'none' = 'none';
  if (activeEngine) {
    const h = await getEngineHealth(ctx.partnerId, activeEngine);
    if (h) healthStatus = h.status;
  }
  const degraded = healthStatus === 'red';

  const signals: SignalBundle = {
    partner,
    flow,
    blocks,
    datamap,
    session,
    rag,
  };

  const policy = buildPolicyDecision(signals);

  // 7. Degraded mode: narrow the catalog to shared blocks only so the
  //    prompt doesn't ask Gemini to pick from a potentially-broken list.
  //    Partner-visible behavior degrades gracefully — never throws.
  const effectiveAllowed = degraded
    ? policy.allowedBlockIds.filter((id) => SHARED_BLOCK_IDS.has(id))
    : policy.allowedBlockIds;
  const degradedPolicy = degraded
    ? { ...policy, allowedBlockIds: effectiveAllowed }
    : policy;

  // 7b. P3.M05.2: Q10 service-break contact-fallback. When the active
  //     engine is 'service', the catalog is empty, AND the detected
  //     intent signals a service break (returning/complaint/contact/
  //     urgent), render the shared 'contact' block rather than falling
  //     through to a text-only reply. Skip Gemini for this path — the
  //     block carries the contact info, no narrative needed.
  const isServiceBreak = isServiceBreakFallback({
    activeEngine,
    allowedCount: degradedPolicy.allowedBlockIds.length,
    intent: flow.intent,
  });

  const systemPrompt = buildSystemPrompt(signals, degradedPolicy);
  const parsed = degraded || isServiceBreak
    ? {} // skip Gemini on red Health or service-break contact rule
    : await callGemini(systemPrompt, ctx);

  // 8. Validate Gemini's block choice against the (possibly degraded)
  //    allow-list. For the service-break contact-fallback path, force
  //    blockId to the shared 'contact' block (it bypasses the allow-list
  //    because the whole point of this rule is that the allow-list is
  //    empty).
  const rawBlockId =
    typeof parsed.blockId === 'string' ? parsed.blockId : undefined;
  const blockId = isServiceBreak
    ? CONTACT_BLOCK_ID
    : rawBlockId && degradedPolicy.allowedBlockIds.includes(rawBlockId)
      ? rawBlockId
      : undefined;

  const degradedText =
    "Thanks for your message — we're going to follow up with you directly.";
  const serviceBreakText =
    "Let's get you to the right person — here's how to reach the team.";
  const text = degraded
    ? degradedText
    : isServiceBreak
      ? serviceBreakText
      : (parsed.text?.trim() ||
          (rag.used && rag.chunks.length > 0
            ? rag.chunks[0].text.slice(0, 240)
            : "I'm here to help — what would you like to know?"));

  const suggestions = degraded || isServiceBreak
    ? []
    : Array.isArray(parsed.suggestions)
      ? parsed.suggestions
          .filter((s): s is string => typeof s === 'string')
          .slice(0, 4)
      : [];

  let blockData: Record<string, unknown> | undefined = blockId
    ? buildBlockData({
        blockId,
        partnerData: partner.partnerData as Record<string, unknown> | null,
        modules: partner.modules,
      })
    : undefined;

  // P2.M03: order_tracker reads from partners/{pid}/orders, scoped to
  // the resolved contactId. Kept separate from buildBlockData so its
  // async Firestore read doesn't leak into the pure sync dispatch.
  //
  // M03 follow-up adds the same shape for booking_confirmation
  // (partners/{pid}/relayBookings) and space_confirmation
  // (partners/{pid}/relayReservations). Three parallel branches per
  // Phase 4 retro §abstraction-decision — generic block-data registry
  // extraction deferred (3 loaders is not enough pressure; revisit at
  // ≥5 or when a 4th surfaces a variation worth abstracting around).
  if (blockId) {
    const contactId = session.session?.identity?.contactId ?? null;
    if (ORDER_TRACKER_BLOCK_IDS.has(blockId)) {
      blockData = (await loadOrderTrackerData(
        ctx.partnerId,
        contactId,
      )) as unknown as Record<string, unknown>;
    } else if (BOOKING_CONFIRMATION_BLOCK_IDS.has(blockId)) {
      blockData = (await loadBookingConfirmationData(
        ctx.partnerId,
        contactId,
      )) as unknown as Record<string, unknown>;
    } else if (SPACE_CONFIRMATION_BLOCK_IDS.has(blockId)) {
      blockData = (await loadSpaceConfirmationData(
        ctx.partnerId,
        contactId,
      )) as unknown as Record<string, unknown>;
    }
  }

  // 9. Telemetry — mandatory structured per-turn log for Phase C C5.
  try {
    console.log('[relay][turn]', JSON.stringify({
      partnerId: ctx.partnerId,
      conversationId: ctx.conversationId,
      activeEngine,
      switchedFrom: previousActive,
      selectionReason: selection.reason,
      catalogSize: degradedPolicy.allowedBlockIds.length,
      catalogSizeBeforeEngineFilter: policy.allowedBlockIds.length,
      healthStatus,
      degraded,
      serviceBreak: isServiceBreak,
      partnerEnginesCount: partnerEngines.length,
      engineHint: engineHint.engineHint ?? null,
      engineConfidence: engineHint.engineConfidence,
    }));
  } catch {
    /* never break on telemetry */
  }

  return {
    blockId,
    blockData,
    text,
    suggestions,
    flowMeta: {
      stageId: flow.currentStageId,
      stageLabel: flow.currentStageLabel,
      stageType: flow.flowDecision?.suggestedStageType,
      leadTemperature: flow.flowDecision?.leadTemperature,
      interactionCount: flow.flowDecision?.updatedState.interactionCount,
      suggestedBlockTypes: flow.suggestedBlockIds,
    },
    signals: {
      intent: flow.intent,
      ragUsed: rag.used,
      ragReason: rag.reason,
      ragSources: rag.chunks.length,
      cartItems: session.cartItemCount,
      hasOrders: session.recentOrders.length > 0,
      allowedBlocks: degradedPolicy.allowedBlockIds,
      rejectedBlocks: policy.rejectedBlocks,
      compositionPath: policy.compositionPath,
    },
    updatedFlowState: flow.flowState,
  };
}

export type { OrchestratorContext, OrchestratorResponse } from './types';
