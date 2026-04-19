// X03 — Multi-engine refinement stress tests.
//
// Session 2 retro flagged that sticky-engine rules (M11) had not been
// stressed against partners with 3+ engines. X03 exercises the
// classifier + selectActiveEngine pipeline on every multi-engine
// partner shape shipped across Phase 2:
//
//   - booking + commerce + service  (full_service_restaurant)
//   - lead + booking + service       (real_estate, consulting_advisory)
//   - engagement + booking + info    (cultural_institutions)
//   - commerce + service + info      (physical_retail)
//   - lead + commerce + service      (wholesale_distribution)
//
// Four stress patterns per partner shape:
//   1. Rapid topic flip — consecutive turns target different engines
//   2. Sticky drift — ambiguous follow-ups after a strong hit
//   3. Strong-hint cascade — multiple strong hits in different
//      directions
//   4. Service-overlay break — track/cancel/modify mid-flow
//
// Assertions focus on: (a) engine routing lands where it should,
// (b) sticky preserves continuity across ambiguous turns, (c) service
// overlay breaks correctly when engine+service co-occur.

import { describe, expect, it } from 'vitest';
import { classifyEngineHint } from '@/lib/relay/engine-keywords';
import { selectActiveEngine } from '@/lib/relay/engine-selection';
import type { Engine } from '@/lib/relay/engine-types';

interface Turn {
  phrase: string;
  expectedActive: Engine | null;
  note?: string;
}

function runMultiTurn(turns: Turn[], partnerEngines: readonly Engine[]): Array<{
  turn: Turn;
  hint: ReturnType<typeof classifyEngineHint>;
  active: Engine | null;
}> {
  let currentActive: Engine | null = null;
  return turns.map((t) => {
    const hint = classifyEngineHint(t.phrase);
    const result = selectActiveEngine({
      currentActive,
      engineHint: hint.engineHint,
      engineConfidence: hint.engineConfidence,
      partnerEngines,
    });
    currentActive = result.engine;
    return { turn: t, hint, active: result.engine };
  });
}

describe('X03 — full_service_restaurant [booking, commerce, service] stress', () => {
  const partnerEngines = ['booking', 'commerce', 'service'] as const;

  it('rapid topic flip: reservation → menu → cart → tracking', () => {
    // Note: "my order" is service.strong. For commerce-centric phrasing
    // we use "add to cart" which is unambiguous commerce.strong.
    const results = runMultiTurn([
      { phrase: 'I want to reserve a table', expectedActive: 'booking' },
      { phrase: 'show me your menu', expectedActive: 'booking' },
      { phrase: 'add to cart', expectedActive: 'commerce' },
      { phrase: 'track my order', expectedActive: 'service' },
    ], partnerEngines);
    expect(results.map((r) => r.active)).toEqual(['booking', 'booking', 'commerce', 'service']);
  });

  it('sticky drift: strong booking then ambiguous follow-ups stay on booking', () => {
    const results = runMultiTurn([
      { phrase: 'book a table for tonight', expectedActive: 'booking' },
      { phrase: 'for 4 people', expectedActive: 'booking' },
      { phrase: 'around 8pm', expectedActive: 'booking' },
      { phrase: 'thanks', expectedActive: 'booking' },
    ], partnerEngines);
    // All turns land booking — first via strong, rest via sticky.
    expect(results.every((r) => r.active === 'booking')).toBe(true);
  });

  it('service-overlay break at turn 3, stays on service through turn 5', () => {
    const results = runMultiTurn([
      { phrase: 'hi', expectedActive: 'booking' },
      { phrase: 'place an order for delivery', expectedActive: 'commerce' },
      { phrase: 'track my order', expectedActive: 'service' },
      { phrase: 'whats the eta', expectedActive: 'service' },
      { phrase: 'cancel my order', expectedActive: 'service' },
    ], partnerEngines);
    expect(results[2].active).toBe('service');
    expect(results[3].active).toBe('service'); // sticky
    expect(results[4].active).toBe('service'); // strong service, sticky preserved
  });
});

describe('X03 — real_estate [booking, lead, service] stress', () => {
  const partnerEngines = ['booking', 'lead', 'service'] as const;

  it('lead cultivation → service-overlay break progression', () => {
    // Note: with partnerEngines=[booking, lead, service], fallback-first
    // is BOOKING (first in array), not lead. This test drives lead
    // routing via strong phrases rather than fallback.
    const results = runMultiTurn([
      { phrase: 'I want to apply for a 5-year lease', expectedActive: 'lead' },
      { phrase: "I'd like to hire you as my agent", expectedActive: 'lead' },
      { phrase: 'whats the status of my application', expectedActive: 'service' },
    ], partnerEngines);
    expect(results[0].active).toBe('lead');
    expect(results[1].active).toBe('lead'); // sticky or switch-strong
    expect(results[2].active).toBe('service');
  });

  it('strong lead with "hire you" phrase works in multi-engine context', () => {
    const results = runMultiTurn([
      { phrase: "I'd like to hire you as my agent", expectedActive: 'lead' },
    ], partnerEngines);
    expect(results[0].hint.engineHint).toBe('lead');
    expect(results[0].active).toBe('lead');
  });
});

describe('X03 — cultural_institutions [engagement, booking, info] stress', () => {
  const partnerEngines = ['engagement', 'booking', 'info'] as const;

  it('info discovery → booking → engagement', () => {
    const results = runMultiTurn([
      { phrase: 'what are the museum hours', expectedActive: 'info' },
      { phrase: 'book 2 tickets for saturday', expectedActive: 'booking' },
      { phrase: 'I want to donate to support the museum', expectedActive: 'engagement' },
    ], partnerEngines);
    expect(results[0].active).toBe('info');
    expect(results[1].active).toBe('booking');
    expect(results[2].active).toBe('engagement');
  });

  it('timetable query routes to info (not booking)', () => {
    const results = runMultiTurn([
      { phrase: 'whats the timetable', expectedActive: 'info' },
    ], partnerEngines);
    expect(results[0].hint.engineHint).toBe('info');
    expect(results[0].active).toBe('info');
  });
});

describe('X03 — physical_retail [commerce, service, info] stress', () => {
  const partnerEngines = ['commerce', 'service', 'info'] as const;

  it('info → commerce → service typical retail inquiry', () => {
    const results = runMultiTurn([
      { phrase: 'what are your store hours', expectedActive: 'info' },
      { phrase: 'add to cart', expectedActive: 'commerce' },
      { phrase: 'track my order', expectedActive: 'service' },
    ], partnerEngines);
    expect(results[0].active).toBe('info');
    expect(results[1].active).toBe('commerce');
    expect(results[2].active).toBe('service');
  });

  it('office hours query routes to info even after commerce stickiness', () => {
    const results = runMultiTurn([
      { phrase: 'buy me a shirt', expectedActive: 'commerce' },
      { phrase: 'actually whats the store location', expectedActive: 'commerce' },
      { phrase: 'office hours', expectedActive: 'info' },
    ], partnerEngines);
    expect(results[0].active).toBe('commerce');
    // "actually whats the store location" — "location" is info.strong.
    // Strong hint switches even from a sticky commerce context.
    expect(results[1].active).toBe('info');
    expect(results[2].active).toBe('info');
  });
});

describe('X03 — wholesale_distribution [commerce, lead, service] stress', () => {
  const partnerEngines = ['commerce', 'lead', 'service'] as const;

  it('commerce browse then lead-cultivation then service-overlay', () => {
    const results = runMultiTurn([
      { phrase: 'show me your bulk catalog', expectedActive: 'commerce' },
      { phrase: 'I want to hire you for long-term supply', expectedActive: 'lead' },
      { phrase: 'whats the status of my application', expectedActive: 'service' },
    ], partnerEngines);
    expect(results[0].active).toBe('commerce'); // fallback-first commerce
    expect(results[1].active).toBe('lead'); // strong hire hint
    expect(results[2].active).toBe('service'); // strong service via 'my application'
  });
});

describe('X03 — sticky across service-exception partners (Adjustment 3)', () => {
  it('ngo_nonprofit [engagement, info] — no service overlay; service hints ignored', () => {
    const partnerEngines = ['engagement', 'info'] as const;
    const results = runMultiTurn([
      { phrase: 'I want to donate', expectedActive: 'engagement' },
      { phrase: 'cancel my monthly donation', expectedActive: 'engagement' },
    ], partnerEngines);
    // Turn 2: service hint, but service not in partner engines.
    // Rule 2 rejects switch; falls through to rule 3 (sticky engagement).
    expect(results[0].active).toBe('engagement');
    expect(results[1].hint.engineHint).toBe('service');
    expect(results[1].active).toBe('engagement'); // sticky
  });
});

describe('X03 — strong-hint cascade resilience', () => {
  const partnerEngines = ['booking', 'commerce', 'lead', 'service'] as const;

  it('4 consecutive strong hits in 4 different directions — each switches cleanly', () => {
    const results = runMultiTurn([
      { phrase: 'book a table', expectedActive: 'booking' },
      { phrase: 'add to cart', expectedActive: 'commerce' },
      { phrase: 'schedule a consultation', expectedActive: 'lead' },
      { phrase: 'track my order', expectedActive: 'service' },
    ], partnerEngines);
    expect(results.map((r) => r.active)).toEqual(['booking', 'commerce', 'lead', 'service']);
  });

  it('strong hint for engine NOT in partner set does not switch', () => {
    const partnerEngines = ['commerce', 'service'] as const;
    const results = runMultiTurn([
      { phrase: 'add to cart', expectedActive: 'commerce' },
      { phrase: 'book a table', expectedActive: 'commerce' }, // booking not in partner set
    ], partnerEngines);
    expect(results[0].active).toBe('commerce');
    expect(results[1].hint.engineHint).toBe('booking');
    expect(results[1].active).toBe('commerce'); // sticky — booking rejected by scope
  });
});
