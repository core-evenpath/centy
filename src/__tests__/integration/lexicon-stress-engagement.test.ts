// Engagement lexicon stress test (P2.engagement.M08.5 — first-class
// milestone, Q16 rule applied).
//
// Pattern established by Commerce (gate session) + Lead (Session 2).
// Probe ambiguous phrasing against classifier + selectActiveEngine;
// assert intended engine hint + activeEngine.
//
// Q16 rule (Adjustment 2): escalate on thematic-category count, NOT
// failure count.
//   - ≤ 2 categories → fix inline, proceed
//   - ≥ 3 categories → STOP, log Q24
//
// Initial run: 3 failures across 2 categories:
//   Category 1 — "engagement-giving phrasings": 'one-time gift',
//     'monthly contribution' (donations without "donate" verb)
//   Category 2 — "lead-cultivation phrasings": 'development officer'
//     (major-donor / planned-giving pipeline distinct from volunteer/
//     donation engagement)
// Under the 2-category ceiling → fixes shipped in this commit.
//
// Lexicon additions:
//   - engagement.strong: 'one-time gift', 'monthly contribution'
//   - lead.strong: 'development officer', 'major giving'
//
// Documented ambiguities (no-fix — sticky rule handles):
//   - "buy a membership" → commerce/strong (acceptable; genuine
//     transaction if partner sells memberships as product)
//   - "sign up for Saturday's volunteer slot" → booking/strong
//     (acceptable; "slot" is a strong booking token — sticky rule
//     corrects on next turn for engagement-primary partners)
//   - "purchase a ticket for the fundraiser" → commerce/strong
//     (acceptable; ticket purchase IS commerce; engagement partners
//     who want different routing should adjust recipe)

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

describe('Engagement lexicon stress — engagement-vs-commerce ambiguity', () => {
  const partnerEngines = ['engagement', 'info'] as const;

  it('"I want to donate $50" routes to engagement', () => {
    const [r] = runAgainstPartner(
      [{ phrase: 'I want to donate $50', expectedActive: 'engagement' }],
      partnerEngines,
    );
    expect(r.hint.engineHint).toBe('engagement');
    expect(r.active).toBe('engagement');
  });

  it('"one-time gift" routes to engagement (FIXED — engagement-giving phrasing)', () => {
    const [r] = runAgainstPartner(
      [{ phrase: 'one-time gift', expectedActive: 'engagement' }],
      partnerEngines,
    );
    expect(r.hint.engineHint).toBe('engagement');
    expect(r.active).toBe('engagement');
  });

  it('"monthly contribution" routes to engagement (FIXED — engagement-giving phrasing)', () => {
    const [r] = runAgainstPartner(
      [{ phrase: 'monthly contribution', expectedActive: 'engagement' }],
      partnerEngines,
    );
    expect(r.hint.engineHint).toBe('engagement');
    expect(r.active).toBe('engagement');
  });

  it('"subscribe" routes to engagement', () => {
    const [r] = runAgainstPartner(
      [{ phrase: 'subscribe', expectedActive: 'engagement' }],
      partnerEngines,
    );
    expect(r.hint.engineHint).toBe('engagement');
    expect(r.active).toBe('engagement');
  });

  it('"buy a membership" routes to commerce (documented — genuine transaction phrasing)', () => {
    // Partner has both engagement and commerce? Classifier follows
    // the strong-hit order. Here partner = [engagement, info] only,
    // so commerce hint is rejected by rule 2, falls back to engagement.
    const multiEngine = ['commerce', 'engagement', 'info'] as const;
    const [r] = runAgainstPartner(
      [{ phrase: 'buy a membership', expectedActive: 'commerce' }],
      multiEngine,
    );
    expect(r.hint.engineHint).toBe('commerce');
    expect(r.active).toBe('commerce');
  });

  it('"purchase a ticket for the fundraiser" routes to commerce (documented)', () => {
    const multiEngine = ['commerce', 'engagement', 'info'] as const;
    const [r] = runAgainstPartner(
      [{ phrase: 'purchase a ticket for the fundraiser', expectedActive: 'commerce' }],
      multiEngine,
    );
    expect(r.hint.engineHint).toBe('commerce');
    expect(r.active).toBe('commerce');
  });
});

describe('Engagement lexicon stress — engagement-vs-booking ambiguity', () => {
  it('"RSVP to the gala" routes to engagement', () => {
    const [r] = runAgainstPartner(
      [{ phrase: 'RSVP to the gala', expectedActive: 'engagement' }],
      ['engagement', 'info'],
    );
    expect(r.hint.engineHint).toBe('engagement');
    expect(r.active).toBe('engagement');
  });

  it('"reserve seats for the fundraising dinner" routes to booking (documented)', () => {
    // "reserve" is booking.strong. For partners with booking, this
    // lands on booking. For engagement-primary without booking, falls
    // back to engagement via partner-engine filter.
    const multiEngine = ['booking', 'engagement', 'info'] as const;
    const [r] = runAgainstPartner(
      [{ phrase: 'reserve seats for the fundraising dinner', expectedActive: 'booking' }],
      multiEngine,
    );
    expect(r.hint.engineHint).toBe('booking');
    expect(r.active).toBe('booking');
  });

  it('"sign up for saturdays volunteer slot" — booking token wins (documented)', () => {
    // "slot" is booking.strong. Per M11 sticky rule, subsequent turns
    // correct to engagement if the conversation goes that way.
    const [r] = runAgainstPartner(
      [{ phrase: "sign up for saturdays volunteer slot", expectedActive: 'engagement' }],
      ['engagement', 'info'],
    );
    // Partner has no booking → booking hint rejected, fall back to
    // engagement (partnerEngines[0]).
    expect(r.hint.engineHint).toBe('booking');
    expect(r.active).toBe('engagement');
  });
});

describe('Engagement lexicon stress — engagement-vs-lead ambiguity', () => {
  it('"I would like to volunteer with your organization" routes to engagement', () => {
    const [r] = runAgainstPartner(
      [{ phrase: 'I would like to volunteer with your organization', expectedActive: 'engagement' }],
      ['engagement', 'lead', 'info'],
    );
    expect(r.hint.engineHint).toBe('engagement');
    expect(r.active).toBe('engagement');
  });

  it('"connect me with your development officer" routes to lead (FIXED — lead-cultivation phrasing)', () => {
    const [r] = runAgainstPartner(
      [{ phrase: 'connect me with your development officer', expectedActive: 'lead' }],
      ['engagement', 'lead', 'info'],
    );
    expect(r.hint.engineHint).toBe('lead');
    expect(r.active).toBe('lead');
  });

  it('"tell me about major giving" routes to lead (FIXED — lead-cultivation phrasing)', () => {
    const [r] = runAgainstPartner(
      [{ phrase: 'tell me about major giving', expectedActive: 'lead' }],
      ['engagement', 'lead', 'info'],
    );
    expect(r.hint.engineHint).toBe('lead');
    expect(r.active).toBe('lead');
  });
});

describe('Engagement lexicon stress — service-overlay routing', () => {
  const withService = ['engagement', 'service'] as const;

  it('"cancel my monthly donation" routes to service', () => {
    const [r] = runAgainstPartner(
      [{ phrase: 'cancel my monthly donation', expectedActive: 'service' }],
      withService,
    );
    expect(r.hint.engineHint).toBe('service');
    expect(r.active).toBe('service');
  });

  it('"update my RSVP" routes to service', () => {
    const [r] = runAgainstPartner(
      [{ phrase: 'update my RSVP', expectedActive: 'service' }],
      withService,
    );
    expect(r.hint.engineHint).toBe('service');
    expect(r.active).toBe('service');
  });

  it('"I want to volunteer again" routes to engagement (new commitment, NOT service)', () => {
    const [r] = runAgainstPartner(
      [{ phrase: 'I want to volunteer again', expectedActive: 'engagement' }],
      withService,
    );
    expect(r.hint.engineHint).toBe('engagement');
    expect(r.active).toBe('engagement');
  });
});

describe('Engagement lexicon stress — partner-scope dependence', () => {
  it('service-exception partner: cancel phrase still routes even when partner lacks service', () => {
    // Service-exception (Adjustment 3): ngo_nonprofit has no service.
    // "cancel my monthly donation" classifies as service/strong but
    // selectActiveEngine rejects the switch since service not in
    // partnerEngines. Falls through to fallback-first (engagement).
    const [r] = runAgainstPartner(
      [{ phrase: 'cancel my monthly donation', expectedActive: 'engagement' }],
      ['engagement', 'info'],
    );
    expect(r.hint.engineHint).toBe('service');
    expect(r.active).toBe('engagement');
  });
});
