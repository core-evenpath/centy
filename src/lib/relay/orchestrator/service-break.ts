// P3.M05.2: Q10 service-break contact-fallback rule.
//
// Pure decision helper. Pulled out of orchestrator/index.ts so the rule
// can be exercised by unit tests without standing up the full
// orchestrator signal stack. The orchestrator imports `isServiceBreakFallback`
// and short-circuits its Gemini call + block pick when the helper
// returns true.
//
// Rule (tuning.md §4.4 + q10-service-audit.md §Action):
//   activeEngine === 'service' AND
//   degradedPolicy.allowedBlockIds.length === 0 AND
//   intent ∈ { returning, complaint, contact, urgent }
// → render the shared 'contact' block with error context
//
// Why this intent set: IntentSignal is semantic not engine-specific,
// so the Q10 audit's track-reservation / cancel-booking / track-order
// taxonomies reach the orchestrator classified as one of the four
// semantic intents above. See detectIntent in flow-engine.ts.

import type { Engine } from '@/lib/relay/engine-types';
import type { IntentSignal } from '@/lib/types-flow-engine';

export const CONTACT_BLOCK_ID = 'contact';

export const SERVICE_BREAK_INTENTS: ReadonlySet<IntentSignal> = new Set<IntentSignal>([
  'returning',
  'complaint',
  'contact',
  'urgent',
]);

export interface ServiceBreakInput {
  activeEngine: Engine | null;
  allowedCount: number;
  intent: IntentSignal | null;
}

export function isServiceBreakFallback(input: ServiceBreakInput): boolean {
  if (input.activeEngine !== 'service') return false;
  if (input.allowedCount !== 0) return false;
  if (input.intent === null) return false;
  return SERVICE_BREAK_INTENTS.has(input.intent);
}
