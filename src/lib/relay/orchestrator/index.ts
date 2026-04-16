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

const MODEL = 'gemini-2.5-flash';

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
  // 1. Partner signal first — downstream loaders need `functionId`.
  const partner = await loadPartnerSignal(ctx.partnerId);

  // 2. Load the four signal sources that don't depend on intent.
  const [flow, blocks, datamap, session] = await Promise.all([
    loadFlowSignal(ctx, partner.functionId),
    loadBlocksSignal(ctx.partnerId),
    loadDatamapSignal(ctx.partnerId),
    loadSessionSignal(ctx),
  ]);

  // 3. RAG depends on flow-detected intent.
  const rag = await loadRagSignal(ctx, flow.intent);

  const signals: SignalBundle = {
    partner,
    flow,
    blocks,
    datamap,
    session,
    rag,
  };

  const policy = buildPolicyDecision(signals);
  const systemPrompt = buildSystemPrompt(signals, policy);
  const parsed = await callGemini(systemPrompt, ctx);

  // 4. Validate Gemini's block choice against the allow-list.
  const rawBlockId =
    typeof parsed.blockId === 'string' ? parsed.blockId : undefined;
  const blockId =
    rawBlockId && policy.allowedBlockIds.includes(rawBlockId)
      ? rawBlockId
      : undefined;

  const text =
    parsed.text?.trim() ||
    (rag.used && rag.chunks.length > 0
      ? rag.chunks[0].text.slice(0, 240)
      : "I'm here to help — what would you like to know?");

  const suggestions = Array.isArray(parsed.suggestions)
    ? parsed.suggestions
        .filter((s): s is string => typeof s === 'string')
        .slice(0, 4)
    : [];

  const blockData = blockId
    ? buildBlockData({
        blockId,
        partnerData: partner.partnerData as Record<string, unknown> | null,
        modules: partner.modules,
      })
    : undefined;

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
      allowedBlocks: policy.allowedBlockIds,
      rejectedBlocks: policy.rejectedBlocks,
      compositionPath: policy.compositionPath,
    },
    updatedFlowState: flow.flowState,
  };
}

export type { OrchestratorContext, OrchestratorResponse } from './types';
