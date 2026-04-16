// ── Orchestrator policy ───────────────────────────────────────────────
//
// Pure composition of the six signals into the block-allow-list +
// commerce bias ordering + composition-path decision. No I/O, no
// awaits — easy to trace and easy to test.

import type { IntentSignal } from '@/lib/types-flow-engine';
import type {
  CompositionPath,
  PolicyDecision,
  RejectedBlock,
  SignalBundle,
} from './types';

// Boost lists — keyed by a session "mode" we observe. The ordered
// block ids get lifted to the front of the allow-list so the prompt
// catalog presents them first.
const CART_BOOSTS = ['cart', 'ecom_cart', 'checkout', 'ecom_checkout'];
const BOOKING_BOOSTS = ['booking_confirm', 'booking'];
const ORDER_BOOSTS = [
  'ecom_order_tracker',
  'order_tracker',
  'ecom_order_confirmation',
];

// IntentSignal values that should get a transactional block path
// (i.e. render a block rather than a RAG-only text answer).
const TRANSACTIONAL_INTENTS = new Set<IntentSignal>([
  'browsing',
  'comparing',
  'pricing',
  'booking',
  'schedule',
  'promo',
]);

/**
 * Intersection rule:
 *   allowed = flow.suggestedBlockIds
 *           ∩ (partner visible — only when the partner has prefs)
 *           ∩ (NOT datamap.darkBlockIds — only when datamap has state)
 *
 * When a filter source is empty we treat it as permissive so
 * pre-onboarding partners still get useful responses.
 */
export function resolveAllowedBlocks(signals: SignalBundle): {
  allowed: string[];
  rejected: RejectedBlock[];
} {
  const rejected: RejectedBlock[] = [];
  const { flow, blocks, datamap } = signals;

  // Base list: flow suggestions, or partner-visible blocks when no flow,
  // or an empty list (meaning "caller uses function catalog fallback").
  const base = flow.suggestedBlockIds.length
    ? flow.suggestedBlockIds
    : blocks.hasPrefs
      ? blocks.visibleBlockIds
      : [];

  const allowed: string[] = [];
  for (const blockId of base) {
    if (blocks.hasPrefs && !blocks.visibleBlockIds.includes(blockId)) {
      rejected.push({
        blockId,
        reason: 'Partner has this block hidden (/partner/relay/blocks)',
      });
      continue;
    }
    if (
      datamap.hasState &&
      datamap.darkBlockIds.includes(blockId) &&
      !datamap.readyBlockIds.includes(blockId)
    ) {
      rejected.push({
        blockId,
        reason: 'Datamap reports no data for this block',
      });
      continue;
    }
    allowed.push(blockId);
  }

  return { allowed, rejected };
}

/**
 * Keep all allowed blocks, but reorder so session-relevant ids come
 * first. Gemini reads the catalog top-to-bottom and gives more weight
 * to earlier entries, so this is our nudge without needing explicit
 * instructions.
 */
export function applyCommerceBias(
  allowed: string[],
  signals: SignalBundle,
): { ordered: string[]; boosted: string[] } {
  const { session } = signals;
  const boosts: string[] = [];
  if (session.hasCart) boosts.push(...CART_BOOSTS);
  if (session.hasBookingHold) boosts.push(...BOOKING_BOOSTS);
  if (session.recentOrders.length > 0) boosts.push(...ORDER_BOOSTS);

  const allowedSet = new Set(allowed);
  const seen = new Set<string>();
  const ordered: string[] = [];
  const boosted: string[] = [];

  for (const id of boosts) {
    if (allowedSet.has(id) && !seen.has(id)) {
      seen.add(id);
      ordered.push(id);
      boosted.push(id);
    }
  }
  for (const id of allowed) {
    if (!seen.has(id)) {
      seen.add(id);
      ordered.push(id);
    }
  }
  return { ordered, boosted };
}

function isTransactional(intent: IntentSignal | null): boolean {
  return !!intent && TRANSACTIONAL_INTENTS.has(intent);
}

export function decidePath(
  signals: SignalBundle,
  allowed: string[],
): CompositionPath {
  const { rag, flow, session } = signals;
  if (isTransactional(flow.intent) && allowed.length > 0) return 'block_only';
  if (rag.used && rag.chunks.length > 0) {
    return allowed.length > 0 ? 'block_with_rag' : 'rag_only';
  }
  if (session.hasCart && allowed.length > 0) return 'block_only';
  if (allowed.length > 0) return 'block_only';
  return 'fallback';
}

export function buildPolicyDecision(signals: SignalBundle): PolicyDecision {
  const { allowed, rejected } = resolveAllowedBlocks(signals);
  const { ordered, boosted } = applyCommerceBias(allowed, signals);
  const compositionPath = decidePath(signals, ordered);
  return {
    allowedBlockIds: ordered,
    rejectedBlocks: rejected,
    boostedBlockIds: boosted,
    compositionPath,
  };
}
