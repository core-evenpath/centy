// Info lexicon stress test (P2.info.M08.5 — first-class milestone,
// Q16 rule applied).
//
// Initial probe: 3 failures in 1 thematic category:
//   Category 1 — "info-discovery phrasings": 'timetable',
//     'upcoming community events', 'is there a delay today'
// Under Q16 ceiling (≤ 2 categories) → fixes shipped inline.
//
// Lexicon additions:
//   - info.strong: 'timetable', 'upcoming events', 'community events',
//     'any delays', 'delay today'
//
// Documented acceptable ambiguities:
//   - "where is the nearest station" → service (via "where is");
//     service.strong pattern fits better for "where is my X" queries;
//     for info-only partners, scope filter falls back to info.
//   - "schedule for saturday" → booking/weak (via "schedule"); sticky
//     rule corrects on next turn for info partners.
//   - "how do I apply for a permit" → lead/strong (permit application
//     IS a lead-cultivation pattern; correct routing).

import { describe, expect, it } from 'vitest';
import { classifyEngineHint } from '@/lib/relay/engine-keywords';
import { selectActiveEngine } from '@/lib/relay/engine-selection';
import type { Engine } from '@/lib/relay/engine-types';

interface Turn {
  phrase: string;
  expectedActive: Engine | null;
}

function runAgainstPartner(
  turns: Turn[],
  partnerEngines: readonly Engine[],
): Array<{
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

describe('Info lexicon stress — info-vs-service ambiguity', () => {
  const partnerEngines = ['info', 'service'] as const;

  it('"office hours" routes to info', () => {
    const [r] = runAgainstPartner(
      [{ phrase: 'office hours', expectedActive: 'info' }],
      partnerEngines,
    );
    expect(r.hint.engineHint).toBe('info');
    expect(r.active).toBe('info');
  });

  it('"contact info" routes to info', () => {
    const [r] = runAgainstPartner(
      [{ phrase: 'contact info', expectedActive: 'info' }],
      partnerEngines,
    );
    expect(r.hint.engineHint).toBe('info');
    expect(r.active).toBe('info');
  });

  it('"whats your address" routes to info', () => {
    const [r] = runAgainstPartner(
      [{ phrase: 'whats your address', expectedActive: 'info' }],
      partnerEngines,
    );
    expect(r.hint.engineHint).toBe('info');
    expect(r.active).toBe('info');
  });

  it('"whats the status of my complaint" routes to service', () => {
    const [r] = runAgainstPartner(
      [{ phrase: 'whats the status of my complaint', expectedActive: 'service' }],
      partnerEngines,
    );
    expect(r.hint.engineHint).toBe('service');
    expect(r.active).toBe('service');
  });

  it('"current outage status" routes to service (tracking)', () => {
    const [r] = runAgainstPartner(
      [{ phrase: 'current outage status', expectedActive: 'service' }],
      partnerEngines,
    );
    expect(r.hint.engineHint).toBe('service');
    expect(r.active).toBe('service');
  });
});

describe('Info lexicon stress — info-discovery phrasings (FIXED)', () => {
  const partnerEngines = ['info', 'service'] as const;

  it('"whats the timetable" routes to info (FIXED)', () => {
    const [r] = runAgainstPartner(
      [{ phrase: 'whats the timetable', expectedActive: 'info' }],
      partnerEngines,
    );
    expect(r.hint.engineHint).toBe('info');
    expect(r.active).toBe('info');
  });

  it('"is there a delay today" routes to info (FIXED)', () => {
    const [r] = runAgainstPartner(
      [{ phrase: 'is there a delay today', expectedActive: 'info' }],
      partnerEngines,
    );
    expect(r.hint.engineHint).toBe('info');
    expect(r.active).toBe('info');
  });

  it('"upcoming community events" routes to info (FIXED)', () => {
    const [r] = runAgainstPartner(
      [{ phrase: 'upcoming community events', expectedActive: 'info' }],
      partnerEngines,
    );
    expect(r.hint.engineHint).toBe('info');
    expect(r.active).toBe('info');
  });
});

describe('Info lexicon stress — info-vs-booking ambiguity', () => {
  it('"when does the next bus depart" routes to info (weak)', () => {
    const [r] = runAgainstPartner(
      [{ phrase: 'when does the next bus depart', expectedActive: 'info' }],
      ['info', 'service'],
    );
    expect(r.hint.engineHint).toBe('info');
    expect(r.active).toBe('info');
  });

  it('"schedule for saturday" → booking weak hint; info-only partner falls back', () => {
    // "schedule" is booking.weak. For info-only partner, rule 2 rejects
    // the weak switch (booking not in partnerEngines), falls through
    // to fallback-first (info).
    const [r] = runAgainstPartner(
      [{ phrase: 'schedule for saturday', expectedActive: 'info' }],
      ['info', 'service'],
    );
    expect(r.hint.engineHint).toBe('booking');
    expect(r.active).toBe('info');
  });
});

describe('Info lexicon stress — info-vs-lead ambiguity (permits + applications)', () => {
  it('"how do I apply for a permit" routes to lead (permit application is lead cultivation)', () => {
    const [r] = runAgainstPartner(
      [{ phrase: 'how do I apply for a permit', expectedActive: 'lead' }],
      ['info', 'lead', 'service'],
    );
    expect(r.hint.engineHint).toBe('lead');
    expect(r.active).toBe('lead');
  });
});

describe('Info lexicon stress — info-vs-engagement ambiguity (government)', () => {
  it('"when is the town hall meeting" routes to info (weak)', () => {
    const [r] = runAgainstPartner(
      [{ phrase: 'when is the town hall meeting', expectedActive: 'info' }],
      ['info', 'engagement'],
    );
    expect(r.hint.engineHint).toBe('info');
    expect(r.active).toBe('info');
  });
});

describe('Info lexicon stress — partner-scope dependence', () => {
  it('"status of my complaint" on info-only partner falls back', () => {
    // Service hint rejected by scope filter; falls to info fallback-first.
    const [r] = runAgainstPartner(
      [{ phrase: 'whats the status of my complaint', expectedActive: 'info' }],
      ['info'],
    );
    expect(r.hint.engineHint).toBe('service');
    expect(r.active).toBe('info');
  });
});
