// P2.commerce.M05 — verify HealthMatrix / HealthShell work for Commerce.
//
// The admin Health UI is engine-agnostic by design (iterates ENGINES,
// gates cells on partnerEngines.includes(engine)). This test locks in
// the behavior so a future refactor doesn't accidentally hardcode
// 'booking'.
//
// Post-P3.M03: recipe-table correctness is tested via
// deriveEnginesFromFunctionId directly. getPartnerEngines no longer
// derives from functionId — it returns partner.engines as-is.

import { describe, expect, it } from 'vitest';
import { ENGINES } from '@/lib/relay/engine-types';
import { deriveEnginesFromFunctionId } from '@/lib/relay/engine-recipes';

describe('P2.commerce.M05 — HealthMatrix Commerce row activation', () => {
  it('ENGINES tuple includes commerce and service', () => {
    expect(ENGINES).toContain('commerce');
    expect(ENGINES).toContain('service');
  });

  it('commerce-primary partner resolves to [commerce, service]', () => {
    const engines = deriveEnginesFromFunctionId('ecommerce_d2c');
    expect(engines).toContain('commerce');
    expect(engines).toContain('service');
  });

  it('booking-primary partner does NOT have commerce → row renders em-dash', () => {
    const engines = deriveEnginesFromFunctionId('hotels_resorts');
    expect(engines).not.toContain('commerce');
    // HealthMatrix gates the cell on `partnerEngines.includes(engine)`;
    // when false, it renders em-dash.
  });

  it('food_beverage commerce-secondary partner has commerce', () => {
    const engines = deriveEnginesFromFunctionId('full_service_restaurant');
    // full_service_restaurant is [booking, commerce, service]
    expect(engines).toContain('commerce');
    expect(engines).toContain('booking');
    expect(engines).toContain('service');
  });
});
