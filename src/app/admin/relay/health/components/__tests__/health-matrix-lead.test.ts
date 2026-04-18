// P2.lead.M05 — verify HealthMatrix / HealthShell work for Lead.
//
// The admin Health UI is engine-agnostic (iterates ENGINES, gates
// cells on partnerEngines.includes(engine)). Lead rows activate
// automatically for any partner whose getPartnerEngines() returns a
// set containing 'lead'. This test locks in that behavior so a future
// refactor doesn't accidentally hardcode booking+commerce.

import { describe, expect, it } from 'vitest';
import { ENGINES } from '@/lib/relay/engine-types';
import { getPartnerEngines } from '@/lib/relay/engine-recipes';

describe('P2.lead.M05 — HealthMatrix Lead row activation', () => {
  it('ENGINES tuple includes lead', () => {
    expect(ENGINES).toContain('lead');
  });

  it('lead-primary partner resolves to [lead, service]', () => {
    const partner = {
      businessPersona: {
        identity: { businessCategories: [{ functionId: 'wealth_management' }] },
      },
    };
    const engines = getPartnerEngines(partner as Parameters<typeof getPartnerEngines>[0]);
    expect(engines).toContain('lead');
    expect(engines).toContain('service');
  });

  it('multi-engine lead partner (real_estate: booking + lead + service)', () => {
    const partner = {
      businessPersona: {
        identity: { businessCategories: [{ functionId: 'real_estate' }] },
      },
    };
    const engines = getPartnerEngines(partner as Parameters<typeof getPartnerEngines>[0]);
    expect(engines).toContain('lead');
    expect(engines).toContain('booking');
    expect(engines).toContain('service');
  });

  it('commerce-primary partner does NOT have lead → row renders em-dash', () => {
    const partner = {
      businessPersona: {
        identity: { businessCategories: [{ functionId: 'ecommerce_d2c' }] },
      },
    };
    const engines = getPartnerEngines(partner as Parameters<typeof getPartnerEngines>[0]);
    expect(engines).not.toContain('lead');
  });

  it('education partner (k12) has lead + info — no service', () => {
    const partner = {
      businessPersona: {
        identity: { businessCategories: [{ functionId: 'k12_education' }] },
      },
    };
    const engines = getPartnerEngines(partner as Parameters<typeof getPartnerEngines>[0]);
    expect(engines).toContain('lead');
    expect(engines).toContain('info');
    expect(engines).not.toContain('service');
  });
});
