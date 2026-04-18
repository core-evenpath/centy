import { describe, expect, it } from 'vitest';
import { FUNCTION_TO_ENGINES, deriveEnginesFromFunctionId, getPartnerEngines } from '../engine-recipes';
import type { Engine } from '../engine-types';

// P2.engagement.M01 — verify Engagement recipe coverage.
//
// Engagement is structurally distinct from the three engines shipped
// so far:
// - Conversion happens in-chat (donation/RSVP/volunteer commitment).
// - There is no transactional state to hold between turns.
// - Many Engagement-primary functions don't have a Service overlay
//   because one-time donations, anonymous RSVPs, and newsletters have
//   no post-commitment state to track (Adjustment 3: allowance of up
//   to 5 service-exception functions).
//
// The 4 Engagement-primary functions in the current recipe are
// ngo_nonprofit, religious, cultural_institutions, community_association
// — all engagement-first. None carry service by design: nonprofits and
// community orgs that need status-check will add it at the partner
// level; the default recipe stays service-less.

const ENGAGEMENT_PRIMARY_EXPECTED = [
  'ngo_nonprofit',
  'religious',
  'cultural_institutions',
  'community_association',
] as const;

describe('P2.engagement.M01 — Engagement recipe verification', () => {
  it('every expected engagement-primary functionId has engagement as the first engine', () => {
    for (const fn of ENGAGEMENT_PRIMARY_EXPECTED) {
      const engines = FUNCTION_TO_ENGINES[fn];
      expect(engines, `missing recipe row: ${fn}`).toBeDefined();
      expect(engines![0], `${fn} primary engine`).toBe('engagement');
    }
  });

  it('cultural_institutions has booking co-included (ticketed events)', () => {
    // Museums + cultural institutions often sell tickets AND take
    // donations — genuine multi-engine partner.
    expect(FUNCTION_TO_ENGINES['cultural_institutions']).toEqual([
      'engagement', 'booking', 'info',
    ]);
  });

  it('service-exception class: ≤ 5 engagement-primary functions lack service', () => {
    // Adjustment 3 hard cap. 4 current exceptions listed below. If a
    // future row pushes us to 6+ without service, the Service
    // auto-enable rule itself needs revision (Q21).
    const noService = ENGAGEMENT_PRIMARY_EXPECTED.filter(
      (fn) => !FUNCTION_TO_ENGINES[fn]!.includes('service'),
    );
    expect(noService.length).toBeLessThanOrEqual(5);
    // All 4 current engagement-primary rows are service-exceptions.
    expect(noService.length).toBe(4);
  });

  it('engagement-secondary rows (community_savings) preserved', () => {
    // community_savings is lead-primary with engagement-secondary —
    // savings circles route donations through the engagement overlay.
    expect(FUNCTION_TO_ENGINES['community_savings']).toEqual([
      'lead', 'engagement',
    ]);
  });

  it('info + engagement crossover (government) preserved', () => {
    // government is info-primary with engagement-secondary — public
    // consultations, town halls route through engagement.
    expect(FUNCTION_TO_ENGINES['government']).toEqual(['info', 'engagement']);
  });

  it('engagement-primary partner derivation', () => {
    const partner = {
      businessPersona: {
        identity: { businessCategories: [{ functionId: 'ngo_nonprofit' }] },
      },
    };
    const engines = getPartnerEngines(partner as Parameters<typeof getPartnerEngines>[0]);
    expect(engines).toContain('engagement');
    expect(engines).toContain('info');
    // No service by design (service-exception class).
    expect(engines).not.toContain('service');
  });

  it('booking-primary rows unchanged (backward compat)', () => {
    const samples: Array<[string, Engine[]]> = [
      ['hotels_resorts', ['booking', 'service']],
      ['dental_care', ['booking', 'service']],
    ];
    for (const [fn, expected] of samples) {
      expect(deriveEnginesFromFunctionId(fn)).toEqual(expected);
    }
  });

  it('commerce-primary rows unchanged (backward compat)', () => {
    expect(deriveEnginesFromFunctionId('ecommerce_d2c')).toEqual(['commerce', 'service']);
  });

  it('lead-primary rows unchanged (Session 2 contract)', () => {
    expect(deriveEnginesFromFunctionId('wealth_management')).toEqual(['lead', 'service']);
    expect(deriveEnginesFromFunctionId('real_estate')).toEqual(['booking', 'lead', 'service']);
  });
});
