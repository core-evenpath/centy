// P2.commerce.M01 — recipe audit assertions.
//
// Phase 1 M03 shipped FUNCTION_TO_ENGINES with 142 entries. M01's
// job is to verify every commerce-primary and commerce-secondary
// functionId has `service` co-included (the overlay rule) and that
// the commerce engine coverage matches the expected set.
//
// No code changes here — just assertions that pin the audit finding.

import { describe, expect, it } from 'vitest';
import { FUNCTION_TO_ENGINES, deriveEnginesFromFunctionId } from '../engine-recipes';

describe('P2.commerce.M01 — recipe audit', () => {
  it('service is auto-included for every commerce functionId', () => {
    const commerceFunctions = Object.entries(FUNCTION_TO_ENGINES)
      .filter(([, engines]) => engines.includes('commerce'))
      .map(([fn]) => fn);
    expect(commerceFunctions.length).toBeGreaterThan(0);
    for (const fn of commerceFunctions) {
      expect(FUNCTION_TO_ENGINES[fn], fn).toContain('service');
    }
  });

  it('retail + ecommerce core functionIds are commerce-primary', () => {
    const expectCommercePrimary = [
      'ecommerce_d2c', 'physical_retail', 'fashion_apparel',
      'electronics_gadgets', 'jewelry_luxury', 'furniture_home',
      'grocery_convenience', 'sports_outdoor', 'baby_kids', 'pet_supplies',
    ];
    for (const fn of expectCommercePrimary) {
      const engines = FUNCTION_TO_ENGINES[fn];
      expect(engines, fn).toBeDefined();
      expect(engines[0], `${fn} primary`).toBe('commerce');
    }
  });

  it('food_beverage functionIds have commerce coverage (primary or secondary)', () => {
    const expectCommerce = [
      'full_service_restaurant', 'casual_dining', 'qsr',
      'beverage_cafe', 'bakery_desserts', 'cloud_kitchen',
      'street_food', 'bars_pubs',
    ];
    for (const fn of expectCommerce) {
      const engines = FUNCTION_TO_ENGINES[fn];
      expect(engines, fn).toBeDefined();
      expect(engines, fn).toContain('commerce');
    }
  });

  it('food_supply functionIds are commerce-primary', () => {
    const expectPrimary = [
      'fresh_produce', 'meat_fish', 'dairy_beverage', 'packaged_specialty',
      'grocery_delivery', 'food_wholesale', 'farm_agricultural', 'organic_health_foods',
    ];
    for (const fn of expectPrimary) {
      const engines = FUNCTION_TO_ENGINES[fn];
      expect(engines, fn).toBeDefined();
      expect(engines[0], `${fn} primary`).toBe('commerce');
    }
  });

  it('booking-primary functionIds unchanged (backward-compat guard)', () => {
    const bookingPrimary = [
      'hotels_resorts', 'budget_accommodation', 'boutique_bnb',
      'dental_care', 'hair_beauty', 'spa_wellness',
      'ticketing_booking', 'airport_transfer',
    ];
    for (const fn of bookingPrimary) {
      const engines = FUNCTION_TO_ENGINES[fn];
      expect(engines[0], `${fn} should still be booking-primary`).toBe('booking');
    }
  });

  it('deriveEnginesFromFunctionId for a sample commerce functionId returns engines with service', () => {
    const engines = deriveEnginesFromFunctionId('ecommerce_d2c');
    expect(engines).toContain('commerce');
    expect(engines).toContain('service');
  });
});
