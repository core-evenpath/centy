// P2.info.M05 — verify HealthMatrix / HealthShell work for Info.
//
// Zero production-code changes (HealthMatrix iterates ENGINES and
// gates cells on partnerEngines.includes(engine)). This test locks in
// the expected behavior for info-primary and info-secondary partners.

import { describe, expect, it } from 'vitest';
import { ENGINES } from '@/lib/relay/engine-types';
import { getPartnerEngines } from '@/lib/relay/engine-recipes';

describe('P2.info.M05 — HealthMatrix Info row activation', () => {
  it('ENGINES tuple includes info', () => {
    expect(ENGINES).toContain('info');
  });

  it('info-primary partner resolves to [info, service|engagement]', () => {
    const partner = {
      businessPersona: {
        identity: { businessCategories: [{ functionId: 'public_transport' }] },
      },
    };
    const engines = getPartnerEngines(partner as Parameters<typeof getPartnerEngines>[0]);
    expect(engines).toContain('info');
    expect(engines).toContain('service');
  });

  it('government has info + engagement (town halls / consultations)', () => {
    const partner = {
      businessPersona: {
        identity: { businessCategories: [{ functionId: 'government' }] },
      },
    };
    const engines = getPartnerEngines(partner as Parameters<typeof getPartnerEngines>[0]);
    expect(engines).toContain('info');
    expect(engines).toContain('engagement');
  });

  it('info-secondary partners have info in their engine set', () => {
    const samples = ['k12_education', 'hospitals', 'physical_retail', 'cultural_institutions'];
    for (const fn of samples) {
      const partner = {
        businessPersona: {
          identity: { businessCategories: [{ functionId: fn }] },
        },
      };
      const engines = getPartnerEngines(partner as Parameters<typeof getPartnerEngines>[0]);
      expect(engines, fn).toContain('info');
    }
  });

  it('pure-booking partner does NOT have info (em-dash in matrix)', () => {
    const partner = {
      businessPersona: {
        identity: { businessCategories: [{ functionId: 'hotels_resorts' }] },
      },
    };
    const engines = getPartnerEngines(partner as Parameters<typeof getPartnerEngines>[0]);
    expect(engines).not.toContain('info');
  });
});
