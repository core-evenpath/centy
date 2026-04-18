// P2.engagement.M05 — verify HealthMatrix / HealthShell work for Engagement.
//
// Engagement is the first engine where most primary partners lack
// a Service overlay by design (Adjustment 3 / service-exception class).
// This test locks in two behaviors:
//   1. HealthMatrix iterates ENGINES and gates cells on
//      partnerEngines.includes(engine) — so engagement rows render
//      correctly for engagement-primary partners.
//   2. Service column for service-exception partners (ngo_nonprofit,
//      religious, community_association) shows em-dash because service
//      IS NOT in the partner's engine set — NOT because the partner
//      hasn't configured it. Operators need to see this distinction.

import { describe, expect, it } from 'vitest';
import { ENGINES } from '@/lib/relay/engine-types';
import { getPartnerEngines } from '@/lib/relay/engine-recipes';

describe('P2.engagement.M05 — HealthMatrix Engagement row activation', () => {
  it('ENGINES tuple includes engagement', () => {
    expect(ENGINES).toContain('engagement');
  });

  it('engagement-primary partner resolves to [engagement, info] (no service)', () => {
    const partner = {
      businessPersona: {
        identity: { businessCategories: [{ functionId: 'ngo_nonprofit' }] },
      },
    };
    const engines = getPartnerEngines(partner as Parameters<typeof getPartnerEngines>[0]);
    expect(engines).toContain('engagement');
    expect(engines).toContain('info');
    // Service-exception: Service column renders em-dash BECAUSE
    // service is absent from partner.engines, not because it's
    // unconfigured.
    expect(engines).not.toContain('service');
  });

  it('multi-engine engagement partner (cultural_institutions: engagement + booking + info)', () => {
    const partner = {
      businessPersona: {
        identity: { businessCategories: [{ functionId: 'cultural_institutions' }] },
      },
    };
    const engines = getPartnerEngines(partner as Parameters<typeof getPartnerEngines>[0]);
    expect(engines).toContain('engagement');
    expect(engines).toContain('booking');
    expect(engines).toContain('info');
  });

  it('engagement-secondary partner (community_savings: lead-primary)', () => {
    const partner = {
      businessPersona: {
        identity: { businessCategories: [{ functionId: 'community_savings' }] },
      },
    };
    const engines = getPartnerEngines(partner as Parameters<typeof getPartnerEngines>[0]);
    expect(engines).toContain('lead');
    expect(engines).toContain('engagement');
  });

  it('booking-primary partner does NOT have engagement → row renders em-dash', () => {
    const partner = {
      businessPersona: {
        identity: { businessCategories: [{ functionId: 'hotels_resorts' }] },
      },
    };
    const engines = getPartnerEngines(partner as Parameters<typeof getPartnerEngines>[0]);
    expect(engines).not.toContain('engagement');
  });

  it('commerce-primary partner does NOT have engagement', () => {
    const partner = {
      businessPersona: {
        identity: { businessCategories: [{ functionId: 'ecommerce_d2c' }] },
      },
    };
    const engines = getPartnerEngines(partner as Parameters<typeof getPartnerEngines>[0]);
    expect(engines).not.toContain('engagement');
  });
});
