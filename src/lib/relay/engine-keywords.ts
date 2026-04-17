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
    strong: [
      'add to cart', 'checkout', 'buy', 'purchase', 'order now',
      'shopping', 'product', 'place order', 'proceed to pay',
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
    strong: [
      'consultation', 'quote', 'proposal', 'discovery call',
      'fee structure', 'retainer', 'get a quote', 'request a proposal',
    ],
    weak: [
      'inquiry', 'interested in', 'more info', 'pricing for',
    ],
  },
  engagement: {
    strong: [
      'donate', 'donation', 'rsvp', 'volunteer', 'sign up', 'subscribe',
      'pledge', 'membership',
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
    strong: [
      'track', 'tracking', 'status', 'cancel', 'modify', 'where is',
      'when will', 'reschedule', 'change my', 'update my', 'my order',
      'my booking', 'my reservation',
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

  if (strongHits.length > 0) {
    return { engineHint: strongHits[0], engineConfidence: 'strong' };
  }
  if (weakHits.length > 0) {
    return { engineHint: weakHits[0], engineConfidence: 'weak' };
  }
  return { engineConfidence: null };
}
