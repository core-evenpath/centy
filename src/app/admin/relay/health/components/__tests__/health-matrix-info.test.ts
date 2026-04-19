// P2.info.M05 — verify HealthMatrix / HealthShell work for Info.
//
// Zero production-code changes (HealthMatrix iterates ENGINES and
// gates cells on partnerEngines.includes(engine)). This test locks in
// the expected behavior for info-primary and info-secondary partners.
//
// Post-P3.M03: recipe-table correctness is tested via
// deriveEnginesFromFunctionId directly.

import { describe, expect, it } from 'vitest';
import { ENGINES } from '@/lib/relay/engine-types';
import { deriveEnginesFromFunctionId } from '@/lib/relay/engine-recipes';

describe('P2.info.M05 — HealthMatrix Info row activation', () => {
  it('ENGINES tuple includes info', () => {
    expect(ENGINES).toContain('info');
  });

  it('info-primary partner resolves to [info, service|engagement]', () => {
    const engines = deriveEnginesFromFunctionId('public_transport');
    expect(engines).toContain('info');
    expect(engines).toContain('service');
  });

  it('government has info + engagement (town halls / consultations)', () => {
    const engines = deriveEnginesFromFunctionId('government');
    expect(engines).toContain('info');
    expect(engines).toContain('engagement');
  });

  it('info-secondary partners have info in their engine set', () => {
    const samples = ['k12_education', 'hospitals', 'physical_retail', 'cultural_institutions'];
    for (const fn of samples) {
      const engines = deriveEnginesFromFunctionId(fn);
      expect(engines, fn).toContain('info');
    }
  });

  it('pure-booking partner does NOT have info (em-dash in matrix)', () => {
    const engines = deriveEnginesFromFunctionId('hotels_resorts');
    expect(engines).not.toContain('info');
  });
});
