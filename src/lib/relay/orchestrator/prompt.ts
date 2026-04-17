import 'server-only';

// ── Orchestrator prompt builder ───────────────────────────────────────
//
// Takes the signal bundle + the policy decision and produces the
// system prompt Gemini sees. Structure is a series of `---`-separated
// sections so the LLM can anchor on them:
//   Business persona → Flow stage guidance → Session state → RAG
//   knowledge → Block catalog (already filtered to policy) → Response
//   contract.
//
// All block-catalog generation goes through `buildBlockCatalogPrompt`
// (the existing function that produces a consistent "`blockId` — desc"
// line per block) so the LLM sees one prompt style across surfaces.

import {
  getAllowedBlocksForFunction,
  buildBlockCatalogPrompt,
} from '@/lib/relay/admin-block-registry';
import type { PolicyDecision, SignalBundle } from './types';

function buildPersonaSection(signals: SignalBundle): string | null {
  const persona = signals.partner.partnerData?.businessPersona as
    | {
        identity?: {
          name?: string;
          tagline?: string;
          industry?: { name?: string };
        };
      }
    | undefined;
  if (!persona?.identity) return null;
  const { name, tagline, industry } = persona.identity;
  const lines = [];
  if (name) lines.push(`BUSINESS: ${name}`);
  if (tagline) lines.push(`TAGLINE: ${tagline}`);
  if (industry?.name) lines.push(`INDUSTRY: ${industry.name}`);
  return lines.length > 0 ? lines.join('\n') : null;
}

function buildFlowSection(signals: SignalBundle): string | null {
  const { flow } = signals;
  if (!flow.currentStageLabel) return null;
  const lines = [
    `CURRENT STAGE: ${flow.currentStageLabel}`,
    `DETECTED INTENT: ${flow.intent ?? 'unknown'}`,
  ];
  if (flow.flowDecision?.suggestedStageType) {
    lines.push(`NEXT STAGE HINT: ${flow.flowDecision.suggestedStageType}`);
  }
  return lines.join('\n');
}

function buildSessionSection(signals: SignalBundle): string | null {
  const { session } = signals;
  if (!session.hasCart && !session.hasBookingHold && session.recentOrders.length === 0) {
    return null;
  }
  const lines = ['SESSION STATE:'];
  if (session.hasCart) {
    lines.push(
      `- Cart has ${session.cartItemCount} item(s), total ${session.cartTotal}`,
    );
  }
  if (session.hasBookingHold) {
    lines.push('- Active booking hold in progress');
  }
  if (session.recentOrders.length > 0) {
    const ids = session.recentOrders.map((o) => o.orderId).join(', ');
    lines.push(`- Recent orders: ${ids}`);
  }
  return lines.join('\n');
}

function buildRagSection(signals: SignalBundle): string | null {
  const { rag } = signals;
  if (!rag.used || rag.chunks.length === 0) return null;
  const body = rag.chunks
    .map((c, i) => {
      const src = c.source ? ` (source: ${c.source})` : '';
      return `[${i + 1}] ${c.text}${src}`;
    })
    .join('\n\n');
  return `RELEVANT KNOWLEDGE — cite with [1], [2], … when used:\n${body}`;
}

function buildCatalogSection(
  signals: SignalBundle,
  policy: PolicyDecision,
): string | null {
  if (policy.allowedBlockIds.length === 0) return null;

  // Resolve the full ServerBlockData entries for the allowed ids so we
  // get the same label + description + intent-hint lines the other
  // prompt builders produce.
  const catalog = getAllowedBlocksForFunction(signals.partner.functionId);
  const byId = new Map(catalog.map((b) => [b.id, b]));
  const allowedBlocks = policy.allowedBlockIds
    .map((id) => byId.get(id))
    .filter((b): b is NonNullable<typeof b> => !!b);

  const catalogText = buildBlockCatalogPrompt(allowedBlocks);
  const boostHint =
    policy.boostedBlockIds.length > 0
      ? `\n\nPREFER THESE BLOCKS FIRST given the current session: ${policy.boostedBlockIds.join(', ')}`
      : '';
  return `AVAILABLE BLOCKS:\n${catalogText}${boostHint}`;
}

function buildContract(): string {
  return [
    'RESPONSE CONTRACT — reply with ONLY valid JSON, no prose, no backticks:',
    '{',
    '  "blockId": "<id from AVAILABLE BLOCKS above, or omitted>",',
    '  "text": "1-3 short sentences — reference [1], [2] … if citing RELEVANT KNOWLEDGE",',
    '  "suggestions": ["up to 4 short follow-up prompts"]',
    '}',
    'Rules:',
    '- `blockId` must be one of AVAILABLE BLOCKS or omitted.',
    '- `text` is plain prose, never JSON.',
    '- If SESSION STATE mentions a cart, booking or order, prefer those blocks.',
    '- Match the visitor\u2019s language and tone.',
  ].join('\n');
}

export function buildSystemPrompt(
  signals: SignalBundle,
  policy: PolicyDecision,
): string {
  const sections = [
    buildPersonaSection(signals),
    buildFlowSection(signals),
    buildSessionSection(signals),
    buildRagSection(signals),
    buildCatalogSection(signals, policy),
    buildContract(),
  ].filter((s): s is string => !!s);
  return sections.join('\n\n---\n\n');
}
