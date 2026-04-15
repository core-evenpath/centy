import type { IntentType } from './intent-engine';

// ── functionId → vertical ────────────────────────────────────────────
const FUNCTION_TO_VERTICAL: Record<string, string> = {
  // Ecommerce
  ecommerce_d2c: 'ecommerce', physical_retail: 'ecommerce', fashion_apparel: 'ecommerce',
  electronics_gadgets: 'ecommerce', jewelry_luxury: 'ecommerce', furniture_home: 'ecommerce',
  grocery_convenience: 'ecommerce', health_wellness_retail: 'ecommerce', books_stationery: 'ecommerce',
  sports_outdoor: 'ecommerce', baby_kids: 'ecommerce', pet_supplies: 'ecommerce',
  wholesale_distribution: 'ecommerce',
  // Hospitality
  hotels_resorts: 'hospitality', budget_accommodation: 'hospitality', boutique_bnb: 'hospitality',
  serviced_apartments: 'hospitality', shared_accommodation: 'hospitality', vacation_rentals: 'hospitality',
  guest_houses: 'hospitality', camping_glamping: 'hospitality', corporate_housing: 'hospitality',
  event_venues: 'hospitality',
  // Healthcare
  general_practice: 'healthcare', dental_care: 'healthcare', specialist_clinic: 'healthcare',
  diagnostic_lab: 'healthcare', pharmacy: 'healthcare', physiotherapy: 'healthcare',
  mental_health: 'healthcare', alternative_medicine: 'healthcare', home_healthcare: 'healthcare',
  veterinary: 'healthcare',
  // Food & Beverage
  full_service_restaurant: 'food_beverage', casual_dining: 'food_beverage', qsr: 'food_beverage',
  beverage_cafe: 'food_beverage', bakery_desserts: 'food_beverage', cloud_kitchen: 'food_beverage',
  catering_events: 'food_beverage', bars_pubs: 'food_beverage', street_food: 'food_beverage',
  // Business
  real_estate: 'business', legal_services: 'business', consulting_advisory: 'business',
  marketing_advertising: 'business', software_it: 'business', hr_recruitment: 'business',
  architecture_design: 'business', pr_communications: 'business', translation_docs: 'business',
  notary_compliance: 'business',
  // Education
  early_childhood: 'education', k12_education: 'education', higher_education: 'education',
  test_preparation: 'education', language_learning: 'education', skill_vocational: 'education',
  corporate_training: 'education', online_learning: 'education', academic_consulting: 'education',
  creative_arts: 'education',
  // Personal Wellness
  hair_beauty: 'personal_wellness', spa_massage: 'personal_wellness', fitness_gym: 'personal_wellness',
  yoga_meditation: 'personal_wellness', skin_aesthetic: 'personal_wellness', nail_lash: 'personal_wellness',
  tattoo_piercing: 'personal_wellness', weight_nutrition: 'personal_wellness',
  // Automotive
  new_vehicle_sales: 'automotive', used_vehicle_sales: 'automotive', vehicle_service: 'automotive',
  car_wash_detail: 'automotive', auto_parts: 'automotive', tires_batteries: 'automotive',
  vehicle_rental: 'automotive', ev_infrastructure: 'automotive', fleet_mobility: 'automotive',
  // Travel & Transport
  travel_agency: 'travel_transport', visa_immigration: 'travel_transport', ticketing_services: 'travel_transport',
  taxi_ride: 'travel_transport', public_transport: 'travel_transport', logistics_courier: 'travel_transport',
  moving_relocation: 'travel_transport', airport_chauffeur: 'travel_transport', luxury_adventure: 'travel_transport',
  // Events & Entertainment
  event_planning: 'events_entertainment', wedding_events: 'events_entertainment',
  corporate_events: 'events_entertainment', photo_video: 'events_entertainment',
  decor_floral: 'events_entertainment', live_entertainment: 'events_entertainment',
  av_production: 'events_entertainment', cinema_theatre: 'events_entertainment',
  // Financial Services
  retail_banking: 'financial_services', alt_lending: 'financial_services', consumer_lending: 'financial_services',
  commercial_lending: 'financial_services', payments_processing: 'financial_services',
  wealth_mgmt: 'financial_services', insurance_broker: 'financial_services',
  accounting_tax: 'financial_services', investment_trading: 'financial_services',
  forex_remittance: 'financial_services', credit_advisory: 'financial_services',
  fintech: 'financial_services', community_savings: 'financial_services',
  // Home & Property
  plumbing_electrical: 'home_property', appliance_repair: 'home_property',
  painting_renovation: 'home_property', cleaning_housekeeping: 'home_property',
  pest_control: 'home_property', landscaping_gardening: 'home_property',
  // Food Supply
  grocery_wholesale: 'food_supply', organic_farm: 'food_supply',
  meat_seafood: 'food_supply', specialty_imported: 'food_supply',
  // Public & Nonprofit
  government_office: 'public_nonprofit', ngo_nonprofit: 'public_nonprofit',
  religious_org: 'public_nonprofit', community_assoc: 'public_nonprofit',
  utilities_infra: 'public_nonprofit', edu_cultural: 'public_nonprofit',
};

export function getVerticalForCategory(category: string): string {
  return FUNCTION_TO_VERTICAL[category] || 'ecommerce';
}

/**
 * True when the given sub-vertical slug has an explicit vertical mapping.
 * Callers that need to distinguish "mapped to ecommerce" from "unmapped,
 * falling back to ecommerce" should use this first.
 */
export function hasVerticalForCategory(category: string): boolean {
  return Object.prototype.hasOwnProperty.call(FUNCTION_TO_VERTICAL, category);
}

// ── Per-vertical intent → block ID mapping ───────────────────────────

type IntentBlockMap = Partial<Record<IntentType, string | null>>;

const VERTICAL_BLOCKS: Record<string, IntentBlockMap> = {
  ecommerce: {
    greeting: 'ecom_greeting', browse: 'ecom_product_card', search: 'ecom_product_card',
    product_detail: 'ecom_product_detail', compare: 'ecom_compare', price_check: 'ecom_product_detail',
    cart_view: 'ecom_cart', cart_add: 'ecom_cart', checkout: 'ecom_cart',
    order_status: 'ecom_order_tracker', promo_inquiry: 'ecom_promo',
    booking: 'ecom_cart', subscribe: 'ecom_product_detail', bundle_inquiry: 'ecom_product_card',
  },
  hospitality: {
    greeting: 'ecom_greeting', browse: 'hosp_room_card', search: 'hosp_room_card',
    product_detail: 'hosp_room_detail', price_check: 'hosp_room_detail',
    order_status: 'hosp_check_in', promo_inquiry: 'ecom_promo',
    booking: 'hosp_availability', compare: 'ecom_compare',
  },
  healthcare: {
    greeting: 'ecom_greeting', browse: 'hc_service_card', search: 'hc_service_card',
    product_detail: 'hc_service_card', price_check: 'hc_insurance',
    order_status: 'hc_treatment_plan', booking: 'hc_appointment',
    promo_inquiry: 'ecom_promo',
  },
  food_beverage: {
    greeting: 'ecom_greeting', browse: 'fb_menu_item', search: 'fb_menu_item',
    product_detail: 'fb_menu_detail', price_check: 'fb_menu_detail',
    cart_view: 'fb_order_customizer', cart_add: 'fb_order_customizer', checkout: 'fb_order_customizer',
    order_status: 'fb_kitchen_queue', promo_inquiry: 'fb_daily_specials',
    booking: 'fb_table_reservation', bundle_inquiry: 'fb_combo_meal',
  },
  business: {
    greeting: 'ecom_greeting', browse: 'biz_service_package', search: 'biz_service_package',
    product_detail: 'biz_service_package', price_check: 'biz_fee_calculator',
    order_status: 'biz_engagement_timeline', booking: 'biz_consultation_booking',
    promo_inquiry: 'ecom_promo',
  },
  education: {
    greeting: 'ecom_greeting', browse: 'edu_course_card', search: 'edu_course_card',
    product_detail: 'edu_course_detail', price_check: 'edu_fee_structure',
    order_status: 'edu_progress', booking: 'edu_enrollment',
    promo_inquiry: 'ecom_promo',
  },
  personal_wellness: {
    greeting: 'ecom_greeting', browse: 'pw_service_card', search: 'pw_service_card',
    product_detail: 'pw_service_detail', price_check: 'pw_service_detail',
    order_status: 'pw_loyalty_progress', booking: 'pw_appointment',
    promo_inquiry: 'pw_spa_package', bundle_inquiry: 'pw_spa_package',
  },
  automotive: {
    greeting: 'ecom_greeting', browse: 'auto_vehicle_card', search: 'auto_vehicle_card',
    product_detail: 'auto_vehicle_detail', price_check: 'auto_finance_calc',
    cart_view: 'auto_rental_builder', order_status: 'auto_service_tracker',
    booking: 'auto_service_scheduler', compare: 'ecom_compare',
    promo_inquiry: 'ecom_promo',
  },
  travel_transport: {
    greeting: 'ecom_greeting', browse: 'tl_tour_package', search: 'tl_tour_package',
    product_detail: 'tl_itinerary', price_check: 'tl_quote_builder',
    order_status: 'tl_shipment_tracker', booking: 'tl_ticket_booking',
    promo_inquiry: 'ecom_promo',
  },
  events_entertainment: {
    greeting: 'ecom_greeting', browse: 'evt_service_card', search: 'evt_service_card',
    product_detail: 'evt_service_card', price_check: 'evt_quote_builder',
    order_status: 'evt_timeline', booking: 'evt_availability',
    promo_inquiry: 'ecom_promo',
  },
  financial_services: {
    greeting: 'ecom_greeting', browse: 'fin_product_card', search: 'fin_product_card',
    product_detail: 'fin_product_card', price_check: 'fin_loan_calc',
    order_status: 'fin_app_tracker', booking: 'fin_application',
    promo_inquiry: 'ecom_promo',
  },
  home_property: {
    greeting: 'ecom_greeting', browse: 'hp_service_card', search: 'hp_service_card',
    product_detail: 'hp_service_card', price_check: 'hp_estimate',
    order_status: 'hp_job_tracker', booking: 'hp_scheduler',
    promo_inquiry: 'ecom_promo',
  },
  food_supply: {
    greeting: 'ecom_greeting', browse: 'fs_product_card', search: 'fs_product_card',
    product_detail: 'fs_product_detail', price_check: 'fs_wholesale_pricing',
    cart_view: 'fs_bulk_order', cart_add: 'fs_bulk_order', checkout: 'fs_bulk_order',
    order_status: 'fs_order_tracker', promo_inquiry: 'ecom_promo',
  },
  public_nonprofit: {
    greeting: 'ecom_greeting', browse: 'pu_service_directory', search: 'pu_service_directory',
    product_detail: 'pu_service_directory', price_check: 'pu_bill_pay',
    order_status: 'pu_application_tracker', booking: 'pu_appointment',
    promo_inquiry: 'ecom_promo',
  },
};

// Shared fallbacks for intents that are the same across all verticals
const SHARED_INTENTS: Partial<Record<IntentType, string | null>> = {
  contact: 'shared_contact',
  support: 'shared_contact',
  return_request: 'shared_contact',
  loyalty_inquiry: 'shared_nudge',
  quiz: 'shared_suggestions',
  general: null,
};

export function getBlockIdForIntent(intentType: IntentType, category: string): string | null {
  const vertical = getVerticalForCategory(category);
  const verticalMap = VERTICAL_BLOCKS[vertical];

  // Check vertical-specific mapping first
  if (verticalMap && intentType in verticalMap) {
    return verticalMap[intentType] ?? null;
  }

  // Then check shared intents
  if (intentType in SHARED_INTENTS) {
    return SHARED_INTENTS[intentType] ?? null;
  }

  return null;
}

// ── Gemini type → block ID (vertical-aware) ──────────────────────────

const VERTICAL_TYPE_MAP: Record<string, Record<string, string>> = {
  ecommerce: { catalog: 'ecom_product_card', products: 'ecom_product_card', compare: 'ecom_compare', greeting: 'ecom_greeting', welcome: 'ecom_greeting', promo: 'ecom_promo', offer: 'ecom_promo', deal: 'ecom_promo' },
  hospitality: { catalog: 'hosp_room_card', rooms: 'hosp_room_card', services: 'hosp_concierge', greeting: 'ecom_greeting', promo: 'ecom_promo' },
  healthcare: { catalog: 'hc_service_card', services: 'hc_service_card', greeting: 'ecom_greeting', promo: 'ecom_promo' },
  food_beverage: { catalog: 'fb_menu_item', menu: 'fb_menu_item', products: 'fb_menu_item', greeting: 'ecom_greeting', promo: 'fb_daily_specials' },
  business: { catalog: 'biz_service_package', services: 'biz_service_package', greeting: 'ecom_greeting', promo: 'ecom_promo' },
  education: { catalog: 'edu_course_card', services: 'edu_course_card', greeting: 'ecom_greeting', promo: 'ecom_promo' },
  personal_wellness: { catalog: 'pw_service_card', services: 'pw_service_card', greeting: 'ecom_greeting', promo: 'pw_spa_package' },
  automotive: { catalog: 'auto_vehicle_card', products: 'auto_vehicle_card', listings: 'auto_vehicle_card', services: 'auto_service_menu', greeting: 'ecom_greeting', promo: 'ecom_promo' },
  travel_transport: { catalog: 'tl_tour_package', services: 'tl_tour_package', listings: 'tl_tour_package', greeting: 'ecom_greeting', promo: 'ecom_promo' },
  events_entertainment: { catalog: 'evt_service_card', services: 'evt_service_card', greeting: 'ecom_greeting', promo: 'ecom_promo' },
  financial_services: { catalog: 'fin_product_card', products: 'fin_product_card', services: 'fin_product_card', greeting: 'ecom_greeting', promo: 'ecom_promo' },
  home_property: { catalog: 'hp_service_card', services: 'hp_service_card', listings: 'hp_service_card', greeting: 'ecom_greeting', promo: 'ecom_promo' },
  food_supply: { catalog: 'fs_product_card', products: 'fs_product_card', greeting: 'ecom_greeting', promo: 'ecom_promo' },
  public_nonprofit: { catalog: 'pu_service_directory', services: 'pu_service_directory', greeting: 'ecom_greeting', promo: 'ecom_promo' },
};

// Shared type mappings used across all verticals
const SHARED_TYPE_MAP: Record<string, string> = {
  contact: 'shared_contact',
  text: 'shared_suggestions',
};

export function getBlockIdForGeminiType(geminiType: string, category: string): string | null {
  const vertical = getVerticalForCategory(category);
  const verticalMap = VERTICAL_TYPE_MAP[vertical];

  if (verticalMap?.[geminiType]) return verticalMap[geminiType];
  if (SHARED_TYPE_MAP[geminiType]) return SHARED_TYPE_MAP[geminiType];

  return null;
}
