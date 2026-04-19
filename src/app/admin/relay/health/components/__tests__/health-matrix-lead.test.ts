// P2.lead.M05 — verify HealthMatrix / HealthShell work for Lead.
//
// The admin Health UI is engine-agnostic (iterates ENGINES, gates
// cells on partnerEngines.includes(engine)). Lead rows activate
// automatically for any partner whose engine set contains 'lead'.
// This test locks in that behavior so a future refactor doesn't
// accidentally hardcode booking+commerce.
//
// Post-P3.M03: recipe-table correctness is tested via
// deriveEnginesFromFunctionId directly.

import { describe, expect, it } from 'vitest';
import { ENGINES } from '@/lib/relay/engine-types';
import { deriveEnginesFromFunctionId } from '@/lib/relay/engine-recipes';

describe('P2.lead.M05 — HealthMatrix Lead row activation', () => {
  it('ENGINES tuple includes lead', () => {
    expect(ENGINES).toContain('lead');
  });

  it('lead-primary partner resolves to [lead, service]', () => {
    const engines = deriveEnginesFromFunctionId('wealth_management');
    expect(engines).toContain('lead');
    expect(engines).toContain('service');
  });

  it('multi-engine lead partner (real_estate: booking + lead + service)', () => {
    const engines = deriveEnginesFromFunctionId('real_estate');
    expect(engines).toContain('lead');
    expect(engines).toContain('booking');
    expect(engines).toContain('service');
  });

  it('commerce-primary partner does NOT have lead → row renders em-dash', () => {
    const engines = deriveEnginesFromFunctionId('ecommerce_d2c');
    expect(engines).not.toContain('lead');
  });

  it('education partner (k12) has lead + info — no service', () => {
    const engines = deriveEnginesFromFunctionId('k12_education');
    expect(engines).toContain('lead');
    expect(engines).toContain('info');
    expect(engines).not.toContain('service');
  });
});
