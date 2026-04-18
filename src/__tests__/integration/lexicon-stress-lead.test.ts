// Lead lexicon stress test (P2.lead.M08.5 — first-class milestone).
//
// Pattern established by Commerce lexicon-stress during the gate
// session (see lexicon-stress-commerce.test.ts + retro-session-1).
// Probe ambiguous phrasing against the classifier + selectActiveEngine
// and assert the intended engine hint + activeEngine. Lead's domain
// language (application / advisor / proposal / retainer) introduces
// new ambiguity vectors beyond Commerce.
//
// Lexicon fixes shipped in the same commit per the Session 1 C2.2
// discipline:
//   - lead.strong += 'apply for', 'want to apply',
//     'start an application', 'hire you', 'to hire'
//   - service.strong += 'withdraw', 'did you receive',
//     'my advisor', 'my application'
//
// Remaining documented gap:
//   - "upload more documents" stays unclassified. Rationale: without
//     a cart/application context in the classifier input, the phrase
//     is genuinely ambiguous between "amend existing application"
//     (service) and "start over with fresh documents" (lead). Partner-
//     engines + M11 sticky handle the fallback — we test that below.

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

describe('Lead lexicon stress — lead-vs-service ambiguity', () => {
  const partnerEngines = ['lead', 'service'] as const;

  it('"whats the status of my application" routes to service', () => {
    const [result] = runAgainstPartner(
      [{ phrase: 'whats the status of my application', expectedActive: 'service' }],
      partnerEngines,
    );
    expect(result.hint.engineHint).toBe('service');
    expect(result.active).toBe('service');
  });

  it('"did you receive my documents" routes to service', () => {
    const [result] = runAgainstPartner(
      [{ phrase: 'did you receive my documents', expectedActive: 'service' }],
      partnerEngines,
    );
    expect(result.hint.engineHint).toBe('service');
    expect(result.active).toBe('service');
  });

  it('"I want to apply" routes to lead', () => {
    const [result] = runAgainstPartner(
      [{ phrase: 'I want to apply', expectedActive: 'lead' }],
      partnerEngines,
    );
    expect(result.hint.engineHint).toBe('lead');
    expect(result.active).toBe('lead');
  });

  it('"start an application" routes to lead', () => {
    const [result] = runAgainstPartner(
      [{ phrase: 'start an application', expectedActive: 'lead' }],
      partnerEngines,
    );
    expect(result.hint.engineHint).toBe('lead');
    expect(result.active).toBe('lead');
  });

  it('"withdraw my application" routes to service', () => {
    const [result] = runAgainstPartner(
      [{ phrase: 'withdraw my application', expectedActive: 'service' }],
      partnerEngines,
    );
    expect(result.hint.engineHint).toBe('service');
    expect(result.active).toBe('service');
  });

  it('"cancel my application" routes to service', () => {
    const [result] = runAgainstPartner(
      [{ phrase: 'cancel my application', expectedActive: 'service' }],
      partnerEngines,
    );
    expect(result.hint.engineHint).toBe('service');
    expect(result.active).toBe('service');
  });

  it('"where is my advisor" routes to service', () => {
    const [result] = runAgainstPartner(
      [{ phrase: 'where is my advisor', expectedActive: 'service' }],
      partnerEngines,
    );
    expect(result.hint.engineHint).toBe('service');
    expect(result.active).toBe('service');
  });

  it('"who is my advisor" routes to service (existing-client reading)', () => {
    // Bare "who is my advisor" in a partner-with-service context reads
    // as asking about the CURRENT advisor (a service-overlay lookup)
    // rather than browsing a catalog of advisors (a lead-discovery
    // action). The 'my advisor' strong phrase delivers this.
    const [result] = runAgainstPartner(
      [{ phrase: 'who is my advisor', expectedActive: 'service' }],
      partnerEngines,
    );
    expect(result.hint.engineHint).toBe('service');
    expect(result.active).toBe('service');
  });

  it('"upload more documents" documented-gap: stays unclassified; partner-engines fallback decides', () => {
    // Design limitation documented in the file header. Without a
    // conversation-state input ("is the partner's application
    // submitted?"), the classifier returns no hint; selectActiveEngine
    // keeps the sticky engine or falls back to the first partner
    // engine. Test both fallback behaviors explicitly.
    const leadFirst = runAgainstPartner(
      [{ phrase: 'upload more documents', expectedActive: 'lead' }],
      ['lead', 'service'],
    )[0];
    expect(leadFirst.hint.engineHint).toBeUndefined();
    expect(leadFirst.active).toBe('lead');

    const serviceFirst = runAgainstPartner(
      [{ phrase: 'upload more documents', expectedActive: 'service' }],
      ['service'],
    )[0];
    expect(serviceFirst.active).toBe('service');
  });
});

describe('Lead lexicon stress — lead-vs-booking ambiguity (multi-engine)', () => {
  const multiEngine = ['lead', 'booking', 'service'] as const;

  it('"schedule a consultation" routes to lead (consultation is a lead handoff)', () => {
    const [result] = runAgainstPartner(
      [{ phrase: 'schedule a consultation', expectedActive: 'lead' }],
      multiEngine,
    );
    expect(result.hint.engineHint).toBe('lead');
    expect(result.active).toBe('lead');
  });

  it('"book a meeting with an advisor" — booking wins via "book" token (documented)', () => {
    // When both engines could serve the intent, the classifier follows
    // the first strong keyword hit. "book" is a booking.strong term;
    // the phrase lands on booking. This is arguably surprising for a
    // consulting partner but the sticky rule means subsequent turns
    // correct it if the flow requires lead. Documented as an
    // acceptable ambiguity resolution.
    const [result] = runAgainstPartner(
      [{ phrase: 'book a meeting with an advisor', expectedActive: 'booking' }],
      multiEngine,
    );
    expect(result.hint.engineHint).toBe('booking');
    expect(result.active).toBe('booking');
  });

  it('"reserve a time to talk" — booking wins via "reserve" (documented)', () => {
    const [result] = runAgainstPartner(
      [{ phrase: 'reserve a time to talk', expectedActive: 'booking' }],
      multiEngine,
    );
    expect(result.hint.engineHint).toBe('booking');
    expect(result.active).toBe('booking');
  });
});

describe('Lead lexicon stress — lead-vs-commerce ambiguity (uncommon multi-engine)', () => {
  const leadAndCommerce = ['lead', 'commerce', 'service'] as const;

  it('"buy a consultation package" routes to commerce (direct purchase)', () => {
    const [result] = runAgainstPartner(
      [{ phrase: 'buy a consultation package', expectedActive: 'commerce' }],
      leadAndCommerce,
    );
    expect(result.hint.engineHint).toBe('commerce');
    expect(result.active).toBe('commerce');
  });

  it('"subscribe to an advisor" — engagement strong-hit (documented)', () => {
    // "subscribe" is engagement.strong. For a partner without
    // engagement, engagement hint + partnerEngines=[lead,commerce,service]
    // → hint rejected by selectActiveEngine (engagement not in partner
    // set) → fall back to sticky or first-engine. We assert the
    // fallback behavior: rule 4 fallback-first picks partnerEngines[0]
    // which is 'lead' as passed into this test.
    const [result] = runAgainstPartner(
      [{ phrase: 'subscribe to an advisor', expectedActive: 'lead' }],
      leadAndCommerce,
    );
    expect(result.hint.engineHint).toBe('engagement');
    // partnerEngines[0] is 'lead' → fallback-first lands on lead. A
    // commerce-primary partner with ['commerce', 'lead', 'service']
    // would fall back to commerce. Documented as "subscribe" being
    // genuinely ambiguous between lead-upsell and commerce-subscription;
    // tuned per-engine when engagement ships.
    expect(result.active).toBe('lead');
  });

  it('"I\'d like to hire you" routes to lead', () => {
    const [result] = runAgainstPartner(
      [{ phrase: "I'd like to hire you", expectedActive: 'lead' }],
      leadAndCommerce,
    );
    expect(result.hint.engineHint).toBe('lead');
    expect(result.active).toBe('lead');
  });
});

describe('Lead lexicon stress — partner-scope dependence', () => {
  it('"schedule a consultation" on booking-only partner falls back to booking (not lead)', () => {
    // Classifier returns lead/strong but partner doesn't have lead.
    // selectActiveEngine rule 2 gates switch on partnerEngines.includes
    // — falls through to rule 4 fallback-first.
    const [result] = runAgainstPartner(
      [{ phrase: 'schedule a consultation', expectedActive: 'booking' }],
      ['booking', 'service'],
    );
    expect(result.hint.engineHint).toBe('lead');
    expect(result.active).toBe('booking');
  });
});
