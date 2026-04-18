// Commerce lexicon stress test (gate session, 2026-04-18).
//
// Pattern established here: probe ambiguous phrasing against the
// classifier + selectActiveEngine and assert the intended engine
// hint + activeEngine. Session 1 retrospective confirmed Commerce
// lexicon "by absence of failure" — this file replaces that with
// explicit stress cases.
//
// Every future engine session (Lead, Engagement, Info) must ship an
// equivalent lexicon-stress-<engine>.test.ts before C3 smoke.
//
// ── Commerce-vs-Lead cases (TODO) ─────────────────────────────────────
//
// Lead is scheduled for Phase 2 Session 2. The following ambiguous
// phrases should be covered by Lead's lexicon-stress test at that
// point; each expected engine is the more specific intent:
//
//   "get a quote"          → lead    (quote = lead capture intent)
//   "schedule a demo"      → lead    (demo-booking is a lead step)
//   "I'm interested"       → lead    (weak — low-commitment)
//   "learn more"           → info    (content browse; may be lead in gated contexts)
//   "tell me your pricing" → commerce (direct purchase intent) OR lead (info-gathering)
//
// DO NOT add these to this Commerce file. They belong in the Lead
// session's stress test, against a lead-primary partner context. This
// block documents the expectation so Lead inherits it.

import { describe, expect, it } from 'vitest';
import { classifyEngineHint } from '@/lib/relay/engine-keywords';
import { selectActiveEngine } from '@/lib/relay/engine-selection';
import type { Engine } from '@/lib/relay/engine-types';

interface Turn {
  phrase: string;
  expectedHint?: Engine;
  expectedActive: Engine | null;
  note?: string;
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

describe('Commerce lexicon stress — commerce-vs-service ambiguity', () => {
  const partnerEngines = ['commerce', 'service'] as const;

  it('"I want to order" routes to commerce (new order intent)', () => {
    const [result] = runAgainstPartner(
      [{ phrase: 'I want to order', expectedHint: 'commerce', expectedActive: 'commerce' }],
      partnerEngines,
    );
    expect(result.hint.engineHint, 'hint').toBe('commerce');
    expect(result.active, 'activeEngine').toBe('commerce');
  });

  it('"whats my order status" routes to service', () => {
    const [result] = runAgainstPartner(
      [{ phrase: 'whats my order status', expectedHint: 'service', expectedActive: 'service' }],
      partnerEngines,
    );
    expect(result.hint.engineHint).toBe('service');
    expect(result.active).toBe('service');
  });

  it('bare "cancel" defaults to service (context-less — service is the safer default)', () => {
    // Design limitation: the classifier has no cart-context input.
    // A bare "cancel" is ambiguous between "cancel my cart" (commerce)
    // and "cancel my order" (service). We default to service here
    // because it's the less-reversible path (service ≅ already-placed
    // order). Cart-abandon UX is handled orchestrator-side via the
    // composition layer, not the classifier.
    const [result] = runAgainstPartner(
      [{ phrase: 'cancel', expectedHint: 'service', expectedActive: 'service' }],
      partnerEngines,
    );
    expect(result.hint.engineHint).toBe('service');
    expect(result.active).toBe('service');
  });

  it('"order updates" routes to service', () => {
    const [result] = runAgainstPartner(
      [{ phrase: 'order updates', expectedHint: 'service', expectedActive: 'service' }],
      partnerEngines,
    );
    expect(result.hint.engineHint).toBe('service');
    expect(result.active).toBe('service');
  });

  it('"place an order" routes to commerce', () => {
    const [result] = runAgainstPartner(
      [{ phrase: 'place an order', expectedHint: 'commerce', expectedActive: 'commerce' }],
      partnerEngines,
    );
    expect(result.hint.engineHint).toBe('commerce');
    expect(result.active).toBe('commerce');
  });

  it('"track my stuff" routes to service', () => {
    const [result] = runAgainstPartner(
      [{ phrase: 'track my stuff', expectedHint: 'service', expectedActive: 'service' }],
      partnerEngines,
    );
    expect(result.hint.engineHint).toBe('service');
    expect(result.active).toBe('service');
  });
});

describe('Commerce lexicon stress — commerce-vs-booking ambiguity (multi-engine)', () => {
  const multiEngine = ['booking', 'commerce', 'service'] as const;

  it('"reserve" routes to booking when partner has booking', () => {
    const [result] = runAgainstPartner(
      [{ phrase: 'reserve', expectedHint: 'booking', expectedActive: 'booking' }],
      multiEngine,
    );
    expect(result.hint.engineHint).toBe('booking');
    expect(result.active).toBe('booking');
  });

  it('"book it" routes to booking', () => {
    const [result] = runAgainstPartner(
      [{ phrase: 'book it', expectedHint: 'booking', expectedActive: 'booking' }],
      multiEngine,
    );
    expect(result.hint.engineHint).toBe('booking');
    expect(result.active).toBe('booking');
  });

  it('"grab it" — not currently a strong signal; acceptable gap documented', () => {
    // "grab it" is a colloquial purchase intent. Adding it as a
    // commerce-strong keyword is risky (ambiguous with "grab a coffee"
    // meeting-speak, etc.). Documented gap — if observation data shows
    // users routinely use "grab" phrasing at checkout moments, revisit.
    const [result] = runAgainstPartner(
      [{ phrase: 'grab it', expectedActive: 'commerce' /* via fallback-first */ }],
      ['commerce', 'service'],
    );
    // No hint expected; activeEngine falls back to the first partner
    // engine (commerce). Still correct routing even without a hint.
    expect(result.hint.engineHint).toBeUndefined();
    expect(result.active).toBe('commerce');
  });
});

describe('Commerce lexicon stress — partner-scope dependence', () => {
  it('"reserve" on a commerce-only partner (no booking) falls back to commerce', () => {
    // Partner without booking: "reserve" still gets classified as
    // booking/strong by the classifier, but selectActiveEngine only
    // switches to engines in partnerEngines. Result: activeEngine stays
    // at whatever commerce partner's fallback is.
    const [result] = runAgainstPartner(
      [{ phrase: 'reserve', expectedActive: 'commerce' }],
      ['commerce', 'service'],
    );
    expect(result.hint.engineHint).toBe('booking');
    // Classifier still reports booking, but scope filter prevents switch.
    expect(result.active).toBe('commerce');
  });
});
