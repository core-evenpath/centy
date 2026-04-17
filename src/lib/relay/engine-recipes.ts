// Relay Engine Architecture — functionId → engines recipe (M03).
//
// Deterministic lookup: given a partner's `functionId`, which engines are
// in scope for their conversational surface?
//
// **Phase 1 scope.** Booking-primary functions MUST carry `booking` and
// `service`. Non-booking engine membership is best-effort in Phase 1 and
// will be tuned in Phase 2 per-engine milestones (one milestone per
// engine; see `docs/engine-rollout-phase2/…` once that phase starts).
// No runtime reads of non-booking engines occur until then, so the
// best-effort tags are data-only and cause no user-visible behavior
// today.
//
// **Rules.**
// - No AI. No string similarity. Hard-coded table + lookup.
// - Unknown functionId → `[]` (not an error; caller decides fallback).
// - Output is stable-ordered by the canonical `ENGINES` tuple.

import type { Engine } from './engine-types';
import { ENGINES } from './engine-types';
import type { Partner } from '../types';

// Full recipe table: every functionId from
// `src/lib/business-taxonomy/industries.ts` (~147 entries).
//
// Numbers in comments mark row count per industry; counts should match
// the BUSINESS_FUNCTIONS groups in `industries.ts`.
//
export const FUNCTION_TO_ENGINES: Record<string, readonly Engine[]> = {
  // 1. FINANCIAL SERVICES (13)
  retail_banking:       ['lead', 'service'],
  alternative_lending:  ['lead', 'service'],
  consumer_lending:     ['lead', 'service'],
  commercial_lending:   ['lead', 'service'],
  payments_processing:  ['lead', 'service'],
  wealth_management:    ['lead', 'service'],
  insurance_brokerage:  ['lead', 'service'],
  accounting_tax:       ['lead', 'service'],
  investment_trading:   ['lead', 'service'],
  forex_remittance:     ['commerce', 'service'],
  credit_debt:          ['lead', 'service'],
  fintech:              ['lead', 'service'],
  community_savings:    ['lead', 'engagement'],

  // 2. EDUCATION & LEARNING (10)
  early_childhood:      ['lead', 'booking', 'service'],
  k12_education:        ['lead', 'info'],
  higher_education:     ['lead', 'info'],
  test_preparation:     ['lead', 'booking', 'service'],
  language_learning:    ['lead', 'booking', 'service'],
  skill_vocational:     ['lead', 'booking', 'service'],
  corporate_training:   ['lead', 'service'],
  online_learning:      ['commerce', 'service'],
  academic_counseling:  ['lead', 'booking', 'service'],
  creative_arts:        ['lead', 'booking', 'service'],

  // 3. HEALTHCARE & MEDICAL (11) — booking-native
  primary_care:         ['booking', 'service'],
  hospitals:            ['booking', 'service', 'info'],
  diagnostic_imaging:   ['booking', 'service'],
  pharmacy_retail:      ['commerce', 'service'],
  dental_care:          ['booking', 'service'],
  vision_care:          ['booking', 'commerce', 'service'],
  mental_health:        ['booking', 'service'],
  physical_therapy:     ['booking', 'service'],
  alternative_medicine: ['booking', 'service'],
  home_healthcare:      ['booking', 'lead', 'service'],
  veterinary:           ['booking', 'service'],

  // 4. BUSINESS & PROFESSIONAL (11)
  real_estate:          ['lead', 'booking', 'service'],
  construction_dev:     ['lead', 'service'],
  legal_services:       ['lead', 'booking', 'service'],
  architecture_design:  ['lead', 'service'],
  hr_recruitment:       ['lead', 'service'],
  marketing_advertising:['lead', 'service'],
  software_it:          ['lead', 'service'],
  consulting_advisory:  ['lead', 'booking', 'service'],
  pr_communications:    ['lead', 'service'],
  translation_docs:     ['commerce', 'service'],
  notary_compliance:    ['booking', 'service'],

  // 5. RETAIL & COMMERCE (13) — commerce-native
  physical_retail:      ['commerce', 'service', 'info'],
  ecommerce_d2c:        ['commerce', 'service'],
  fashion_apparel:      ['commerce', 'service'],
  electronics_gadgets:  ['commerce', 'service'],
  jewelry_luxury:       ['commerce', 'service'],
  furniture_home:       ['commerce', 'service'],
  grocery_convenience:  ['commerce', 'service'],
  health_wellness_retail:['commerce', 'service'],
  books_stationery:     ['commerce', 'service'],
  sports_outdoor:       ['commerce', 'service'],
  baby_kids:            ['commerce', 'service'],
  pet_supplies:         ['commerce', 'service'],
  wholesale_distribution:['commerce', 'lead', 'service'],

  // 6. FOOD & BEVERAGE (9)
  full_service_restaurant:['booking', 'commerce', 'service'],
  casual_dining:        ['commerce', 'booking', 'service'],
  qsr:                  ['commerce', 'service'],
  beverage_cafe:        ['commerce', 'service'],
  bakery_desserts:      ['commerce', 'service'],
  cloud_kitchen:        ['commerce', 'service'],
  street_food:          ['commerce', 'service'],
  bars_pubs:            ['booking', 'commerce', 'service'],
  catering_events:      ['lead', 'service'],

  // 7. FOOD SUPPLY & DISTRIBUTION (8)
  fresh_produce:        ['commerce', 'service'],
  meat_fish:            ['commerce', 'service'],
  dairy_beverage:       ['commerce', 'service'],
  packaged_specialty:   ['commerce', 'service'],
  grocery_delivery:     ['commerce', 'service'],
  food_wholesale:       ['commerce', 'lead', 'service'],
  farm_agricultural:    ['commerce', 'lead', 'service'],
  organic_health_foods: ['commerce', 'service'],

  // 8. PERSONAL CARE & WELLNESS (9) — booking-native
  hair_beauty:          ['booking', 'service'],
  spa_wellness:         ['booking', 'service'],
  fitness_gym:          ['booking', 'service'],
  yoga_mindfulness:     ['booking', 'service'],
  skin_aesthetic:       ['booking', 'service'],
  cosmetic_surgery:     ['booking', 'lead', 'service'],
  wellness_retreat:     ['booking', 'service'],
  personal_training:    ['booking', 'service'],
  body_art:             ['booking', 'service'],

  // 9. AUTOMOTIVE & MOBILITY (12)
  vehicle_sales_new:    ['lead', 'booking', 'service'],
  vehicle_sales_used:   ['lead', 'booking', 'service'],
  vehicle_maintenance:  ['booking', 'service'],
  car_wash:             ['booking', 'service'],
  auto_parts:           ['commerce', 'service'],
  tires_batteries:      ['commerce', 'booking', 'service'],
  vehicle_rental:       ['booking', 'service'],
  ev_infrastructure:    ['booking', 'info', 'service'],
  fleet_services:       ['lead', 'booking', 'service'],
  driving_education:    ['booking', 'lead', 'service'],
  motorcycle_sales:     ['lead', 'booking', 'service'],
  auto_insurance:       ['lead', 'service'],

  // 10. TRAVEL, TRANSPORT & LOGISTICS (9)
  travel_agency:        ['booking', 'lead', 'service'],
  ticketing_booking:    ['booking', 'service'],
  airport_transfer:     ['booking', 'service'],
  taxi_ride:            ['booking', 'service'],
  public_transport:     ['info', 'service'],
  logistics_courier:    ['commerce', 'service'],
  moving_relocation:    ['lead', 'booking', 'service'],
  visa_immigration:     ['lead', 'service'],
  luxury_adventure:     ['booking', 'service'],

  // 11. HOSPITALITY & ACCOMMODATION (10) — booking-native
  hotels_resorts:       ['booking', 'service'],
  budget_accommodation: ['booking', 'service'],
  boutique_bnb:         ['booking', 'service'],
  serviced_apartments:  ['booking', 'service'],
  vacation_rentals:     ['booking', 'service'],
  guest_houses:         ['booking', 'service'],
  camping_glamping:     ['booking', 'service'],
  corporate_housing:    ['booking', 'lead', 'service'],
  event_venues:         ['booking', 'lead', 'service'],
  shared_accommodation: ['booking', 'service'],

  // 12. EVENTS, MEDIA & ENTERTAINMENT (10)
  event_planning:       ['lead', 'booking', 'service'],
  wedding_private:      ['lead', 'booking', 'service'],
  corporate_events:     ['lead', 'booking', 'service'],
  photography_video:    ['lead', 'booking', 'service'],
  live_entertainment:   ['booking', 'lead', 'service'],
  cinemas_theaters:     ['booking', 'service'],
  hosts_anchors:        ['lead', 'service'],
  av_production:        ['lead', 'service'],
  decor_floral:         ['commerce', 'lead', 'service'],
  printing_invitations: ['commerce', 'service'],

  // 13. HOME & PROPERTY SERVICES (11)
  plumbing_electrical:  ['booking', 'lead', 'service'],
  cleaning_housekeeping:['booking', 'service'],
  painting_renovation:  ['lead', 'booking', 'service'],
  landscaping_gardening:['lead', 'booking', 'service'],
  pest_control:         ['booking', 'service'],
  home_automation:      ['lead', 'booking', 'service'],
  appliance_repair:     ['booking', 'service'],
  laundry_drycleaning:  ['booking', 'commerce', 'service'],
  carpentry_furniture:  ['lead', 'commerce', 'service'],
  solar_renewable:      ['lead', 'service'],
  security_surveillance:['lead', 'booking', 'service'],

  // 14. PUBLIC, NON-PROFIT & UTILITIES (6)
  government:           ['info', 'engagement'],
  ngo_nonprofit:        ['engagement', 'info'],
  religious:            ['engagement', 'info'],
  cultural_institutions:['engagement', 'booking', 'info'],
  community_association:['engagement', 'info'],
  utilities:            ['info', 'service'],
};

// Lock output order to the canonical `ENGINES` tuple — deterministic and
// stable across calls for the same input.
const ENGINE_ORDER = new Map<Engine, number>(
  ENGINES.map((e, i) => [e, i] as const),
);

function sortByEngineOrder(engines: readonly Engine[]): Engine[] {
  return [...engines].sort(
    (a, b) => (ENGINE_ORDER.get(a) ?? 99) - (ENGINE_ORDER.get(b) ?? 99),
  );
}

/**
 * Look up the engine set for a given functionId.
 * Unknown functionId returns `[]` — the caller decides how to fall back.
 * Output is stable-ordered per the canonical `ENGINES` tuple.
 */
export function deriveEnginesFromFunctionId(
  functionId: string | null | undefined,
): Engine[] {
  if (!functionId) return [];
  const row = FUNCTION_TO_ENGINES[functionId];
  if (!row) return [];
  return sortByEngineOrder(row);
}

/**
 * Canonical accessor for a partner's engines.
 *
 * - If the partner has an explicit `engines` array (set by onboarding at
 *   M14 or edited manually), return it verbatim (sorted).
 * - Otherwise, derive from the partner's primary `functionId` under
 *   `businessPersona.identity.businessCategories[0].functionId`.
 * - Legacy partners with neither → `[]`.
 */
export function getPartnerEngines(
  partner: Pick<Partner, 'engines'> & {
    businessProfile?: unknown;
    [key: string]: unknown;
  },
): Engine[] {
  if (Array.isArray(partner.engines) && partner.engines.length > 0) {
    return sortByEngineOrder(partner.engines);
  }
  // Firestore partner docs carry the functionId under a deep path. The
  // runtime shape (not captured in the typed Partner interface today) is
  // `partner.businessPersona?.identity?.businessCategories?.[0]?.functionId`
  // per `src/lib/relay/orchestrator/signals/partner.ts:31–35`. We read it
  // defensively so this function works both with the typed Partner and
  // with the raw Firestore doc that the orchestrator sees first.
  const p = partner as {
    businessPersona?: {
      identity?: {
        businessCategories?: { functionId?: string }[];
      };
    };
  };
  const fn = p.businessPersona?.identity?.businessCategories?.[0]?.functionId;
  return deriveEnginesFromFunctionId(fn);
}
