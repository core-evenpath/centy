// Engine keyword lexicon + classifier (M10).
//
// Pure deterministic lookup: given a visitor message, return an engine
// hint and confidence. No AI, no embeddings, no stemming. Word-boundary
// regex only — `"book"` matches "book a room" but not "facebook" or
// "abooking".
//
// Strong matches always win over weak. Multi-engine ties broken by
// lexical order in `ENGINES` (commerce < booking < lead < engagement <
// info < service).

import type { Engine } from './engine-types';
import { ENGINES } from './engine-types';

export type EngineConfidence = 'strong' | 'weak' | null;

// ── Lexicon ───────────────────────────────────────────────────────────

export const ENGINE_KEYWORDS: Record<Engine, { strong: string[]; weak: string[] }> = {
  commerce: {
    // Strong-phrase additions (gate-session lexicon stress, 2026-04-18):
    // 'place an order', 'want to order' — cover the natural-language
    // purchase-intent phrases the bare-verb strong list missed.
    // See docs/engine-rollout-phase2/c5-interpretation-commerce.md for
    // the pattern Lead + Engagement + Info must inherit.
    strong: [
      'add to cart', 'checkout', 'buy', 'purchase', 'order now',
      'shopping', 'product', 'place order', 'place an order',
      'want to order', 'proceed to pay',
    ],
    weak: [
      'price', 'cost', 'how much', 'shop', 'browse', 'catalog',
    ],
  },
  booking: {
    strong: [
      'book', 'reserve', 'reservation', 'appointment', 'slot',
      'availability', 'check in', 'check out', 'book a room',
      'book a table', 'schedule an appointment',
    ],
    weak: [
      'schedule', 'when can i', 'free time', 'open', 'time slot',
    ],
  },
  lead: {
    // Strong-phrase additions (P2.lead.M08.5 lexicon stress, 2026-04-18):
    // 'apply for', 'want to apply', 'start an application', 'hire you',
    // 'to hire' — natural inquiry-intent phrases. Bare 'apply' avoided
    // because it collides with "apply this filter" / "apply a coupon".
    //
    // P2.engagement.M08.5 additions (2026-04-18): 'development officer',
    // 'major giving' — lead-cultivation phrasings distinct from
    // volunteer/donation engagement (planned giving, donor-development
    // pipeline).
    strong: [
      'consultation', 'quote', 'proposal', 'discovery call',
      'fee structure', 'retainer', 'get a quote', 'request a proposal',
      'apply for', 'want to apply', 'start an application',
      'hire you', 'to hire',
      'development officer', 'major giving',
    ],
    weak: [
      'inquiry', 'interested in', 'more info', 'pricing for',
    ],
  },
  engagement: {
    // Strong-phrase additions (P2.engagement.M08.5 lexicon stress,
    // 2026-04-18): 'one-time gift', 'monthly contribution' —
    // engagement-giving phrasings distinct from the bare 'donate' verb.
    // Both are specific donation patterns that users describe without
    // explicit donation verbs.
    strong: [
      'donate', 'donation', 'rsvp', 'volunteer', 'sign up', 'subscribe',
      'pledge', 'membership',
      'one-time gift', 'monthly contribution',
    ],
    weak: [
      'support', 'contribute', 'join', 'participate',
    ],
  },
  info: {
    strong: [
      'hours', 'opening hours', 'directions', 'address', 'location',
      'phone number', 'find us', 'where are you', 'contact info',
    ],
    weak: [
      'info', 'information', 'about', 'where', 'when',
    ],
  },
  service: {
    // Strong-phrase additions (gate-session lexicon stress, 2026-04-18):
    // 'order update', 'order updates' — "updates" has a word-char
    // boundary after 'e', so the plural doesn't match the singular
    // phrase under \b regex. Both forms listed explicitly.
    //
    // Lead.M08.5 additions (2026-04-18): 'withdraw', 'did you receive',
    // 'my advisor', 'my application' — Lead-flow service-overlay
    // triggers. 'withdraw' is the lead-specific equivalent of 'cancel';
    // 'did you receive' is a status-check phrasing.
    strong: [
      'track', 'tracking', 'status', 'cancel', 'modify', 'where is',
      'when will', 'reschedule', 'change my', 'update my', 'my order',
      'my booking', 'my reservation', 'order update', 'order updates',
      'withdraw', 'did you receive', 'my advisor', 'my application',
    ],
    weak: [
      'order status', 'delivery status', 'eta',
    ],
  },
};

// ── Word-boundary matcher ─────────────────────────────────────────────

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Build one regex per keyword; a keyword is matched iff there's a
// word-boundary on each side of the entire phrase. This distinguishes
// "book a room" (boundary before 'b', after 'k') from "facebook"
// (no boundary inside "facebook" where "book" starts).
function matchesKeyword(message: string, keyword: string): boolean {
  // Lowercase both sides — the lexicon is already lowercase.
  const escaped = escapeRegex(keyword.toLowerCase());
  const regex = new RegExp(`\\b${escaped}\\b`, 'i');
  return regex.test(message);
}

// ── Classifier ────────────────────────────────────────────────────────

export interface EngineHintResult {
  engineHint?: Engine;
  engineConfidence: EngineConfidence;
}

/**
 * Pure classifier. Returns the engine hint that best matches the message
 * along with a confidence tier ('strong' > 'weak' > null).
 *
 * Matching rules:
 * - Word-boundary (\b) regex, not raw substring.
 * - Strong matches always beat weak.
 * - Multi-engine ties broken by lexical order in the `ENGINES` tuple.
 */
export function classifyEngineHint(message: string): EngineHintResult {
  if (!message || message.trim().length === 0) {
    return { engineConfidence: null };
  }

  const lower = message.toLowerCase();

  const strongHits: Engine[] = [];
  const weakHits: Engine[] = [];

  for (const engine of ENGINES) {
    const lex = ENGINE_KEYWORDS[engine];

    // Strong pass first — if any keyword hits, record and move on.
    let matched = false;
    for (const kw of lex.strong) {
      if (matchesKeyword(lower, kw)) {
        strongHits.push(engine);
        matched = true;
        break;
      }
    }
    if (matched) continue;

    for (const kw of lex.weak) {
      if (matchesKeyword(lower, kw)) {
        weakHits.push(engine);
        break;
      }
    }
  }

  // Tiebreaker: when a service-overlay intent (cancel / track / modify /
  // reschedule) co-occurs with a primary-engine keyword, prefer service.
  // Rationale: a message like "cancel my reservation" hits both
  // booking.strong ("reservation") and service.strong ("cancel",
  // "my reservation") — the user intent is the SERVICE overlay (modify
  // an existing booking), not a new booking. Without this guard the
  // simple ENGINES-tuple tiebreaker picks booking (earlier index), which
  // misroutes. Applied only when service is among the strong hits AND
  // at least one other engine is also present.
  if (strongHits.length > 0) {
    if (strongHits.includes('service') && strongHits.length > 1) {
      return { engineHint: 'service', engineConfidence: 'strong' };
    }
    return { engineHint: strongHits[0], engineConfidence: 'strong' };
  }
  if (weakHits.length > 0) {
    return { engineHint: weakHits[0], engineConfidence: 'weak' };
  }
  return { engineConfidence: null };
}
