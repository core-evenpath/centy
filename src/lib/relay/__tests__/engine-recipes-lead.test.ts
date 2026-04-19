import { describe, expect, it } from 'vitest';
import { FUNCTION_TO_ENGINES, deriveEnginesFromFunctionId, getPartnerEngines } from '../engine-recipes';
import type { Engine } from '../engine-types';

// P2.lead.M01 — verify Lead recipe coverage.
//
// Lead is offline-closed: conversion is a qualified handoff, not a
// transaction. Every Lead-primary functionId must co-include Service
// (status-check / amend-application routing), and Booking/Commerce-
// primary rows must stay untouched.
//
// Lead-primary functionIds are enumerated below from the recipe row
// order. Changes to this list indicate a recipe drift that M01 catches
// before downstream milestones compound on a bad baseline.

const LEAD_PRIMARY_EXPECTED = [
  // financial services
  'retail_banking', 'alternative_lending', 'consumer_lending',
  'commercial_lending', 'payments_processing', 'wealth_management',
  'insurance_brokerage', 'accounting_tax', 'investment_trading',
  'credit_debt', 'fintech', 'community_savings',
  // education
  'early_childhood', 'k12_education', 'higher_education',
  'test_preparation', 'language_learning', 'skill_vocational',
  'corporate_training', 'academic_counseling', 'creative_arts',
  // business / professional
  'real_estate', 'construction_dev', 'legal_services',
  'architecture_design', 'hr_recruitment', 'marketing_advertising',
  'software_it', 'consulting_advisory', 'pr_communications',
  // food & beverage
  'catering_events',
  // automotive
  'vehicle_sales_new', 'vehicle_sales_used', 'fleet_services',
  'motorcycle_sales', 'auto_insurance',
  // travel / logistics
  'moving_relocation', 'visa_immigration',
  // events / entertainment
  'event_planning', 'wedding_private', 'corporate_events',
  'photography_video', 'hosts_anchors', 'av_production',
  // home / property
  'painting_renovation', 'landscaping_gardening', 'home_automation',
  'carpentry_furniture', 'solar_renewable', 'security_surveillance',
] as const;

describe('P2.lead.M01 — Lead recipe verification', () => {
  it('every expected lead-primary functionId has lead as the first engine', () => {
    for (const fn of LEAD_PRIMARY_EXPECTED) {
      const engines = FUNCTION_TO_ENGINES[fn];
      expect(engines, `missing recipe row: ${fn}`).toBeDefined();
      expect(engines![0], `${fn} primary engine`).toBe('lead');
    }
  });

  it('every lead-primary functionId auto-includes service (with documented exceptions)', () => {
    // Documented exceptions: 3 rows where domain legitimately doesn't
    // need a service overlay.
    // - community_savings: savings circles → engagement (donations/RSVPs)
    // - k12_education / higher_education: public education → info (schedules/locations)
    // These are allowed; guard against the gap spreading to other
    // lead-primary rows.
    const KNOWN_NO_SERVICE = new Set(['community_savings', 'k12_education', 'higher_education']);
    for (const fn of LEAD_PRIMARY_EXPECTED) {
      const engines = FUNCTION_TO_ENGINES[fn];
      if (KNOWN_NO_SERVICE.has(fn)) continue;
      expect(engines!.includes('service'), `${fn} missing service`).toBe(true);
    }
    // Count of no-service rows must not exceed the documented 3.
    const actual = LEAD_PRIMARY_EXPECTED.filter(
      (fn) => !FUNCTION_TO_ENGINES[fn]!.includes('service'),
    );
    expect(actual.length, `new service-less rows beyond the 3 known exceptions: ${actual.join(',')}`).toBeLessThanOrEqual(3);
  });

  it('recipe coverage ≥ 48 lead-primary functionIds', () => {
    // Coverage budget: if we dip below 48, the recipe regressed. If we
    // exceed significantly, a new functionId was added without updating
    // this test.
    const all = Object.entries(FUNCTION_TO_ENGINES).filter(
      ([, engs]) => engs[0] === 'lead',
    );
    expect(all.length).toBeGreaterThanOrEqual(48);
    expect(all.length).toBeLessThanOrEqual(55);
  });

  it('lead partner derivation returns lead + service for canonical samples', () => {
    const samples = [
      'wealth_management',
      'legal_services',
      'real_estate',
      'photography_video',
    ];
    for (const fn of samples) {
      // Post-P3.M03: recipe-table correctness tested via
      // deriveEnginesFromFunctionId (still exported for onboarding use).
      const engines = deriveEnginesFromFunctionId(fn);
      expect(engines, fn).toContain('lead');
      expect(engines, fn).toContain('service');
    }
  });

  it('booking-primary samples unchanged (backward compat)', () => {
    const bookingPrimary: Array<[string, Engine[]]> = [
      ['hotels_resorts', ['booking', 'service']],
      ['dental_care', ['booking', 'service']],
      ['hair_beauty', ['booking', 'service']],
    ];
    for (const [fn, expected] of bookingPrimary) {
      expect(deriveEnginesFromFunctionId(fn)).toEqual(expected);
    }
  });

  it('commerce-primary samples unchanged (backward compat)', () => {
    const commercePrimary: Array<[string, Engine[]]> = [
      ['ecommerce_d2c', ['commerce', 'service']],
      ['qsr', ['commerce', 'service']],
      ['fresh_produce', ['commerce', 'service']],
    ];
    for (const [fn, expected] of commercePrimary) {
      expect(deriveEnginesFromFunctionId(fn)).toEqual(expected);
    }
  });

  it('multi-engine lead partners preserve engine ordering via sortByEngineOrder', () => {
    // real_estate is [lead, booking, service]. ENGINES tuple order is
    // commerce < booking < lead < engagement < info < service, so sorted
    // output is [booking, lead, service]. Verify the recipe table applies
    // canonical order (deriveEnginesFromFunctionId sorts output).
    const engines = deriveEnginesFromFunctionId('real_estate');
    // Booking comes before lead in ENGINES tuple.
    expect(engines.indexOf('booking')).toBeLessThan(engines.indexOf('lead'));
  });
});
