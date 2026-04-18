// M14 starter block sets, curated per booking-primary functionId.
//
// NOT auto-derived from "all booking blocks for this functionId" —
// that would overwhelm operators. Each set is a hand-picked 8–13
// block list that together runs a coherent flow without redundancy.
//
// All ids must exist in the registry (verified by the acceptance test).

export const STARTER_BLOCKS_BY_FUNCTION: Record<string, string[]> = {
  // Hospitality — hotel-like flow
  hotels_resorts: [
    'greeting', 'suggestions',
    'room_card', 'room_detail', 'amenities', 'property_gallery',
    'availability', 'meal_plan',
    'check_in', 'transfer', 'concierge',
    'house_rules', 'contact',
  ],
  budget_accommodation: [
    'greeting', 'suggestions',
    'room_card', 'availability', 'amenities',
    'check_in', 'transfer', 'house_rules', 'contact',
  ],
  boutique_bnb: [
    'greeting', 'suggestions',
    'room_card', 'room_detail', 'property_gallery', 'amenities',
    'availability', 'meal_plan', 'house_rules', 'concierge', 'contact',
  ],
  serviced_apartments: [
    'greeting', 'suggestions',
    'room_card', 'room_detail', 'amenities', 'availability',
    'check_in', 'house_rules', 'contact',
  ],
  vacation_rentals: [
    'greeting', 'suggestions',
    'room_card', 'room_detail', 'property_gallery', 'amenities',
    'availability', 'house_rules', 'check_in', 'contact',
  ],
  guest_houses: [
    'greeting', 'suggestions',
    'room_card', 'amenities', 'availability', 'meal_plan',
    'house_rules', 'contact',
  ],
  camping_glamping: [
    'greeting', 'suggestions',
    'camping_unit', 'property_gallery', 'amenities',
    'availability', 'house_rules', 'contact',
  ],
  corporate_housing: [
    'greeting', 'suggestions',
    'room_card', 'room_detail', 'amenities', 'availability',
    'check_in', 'transfer', 'house_rules', 'contact',
  ],
  event_venues: [
    'greeting', 'suggestions',
    'venue_space', 'property_gallery', 'amenities',
    'meal_plan', 'house_rules', 'contact',
  ],

  // Healthcare — clinic-appointment flow
  primary_care: [
    'greeting', 'suggestions',
    'appointment', 'telehealth', 'patient_intake', 'wait_time',
    'contact',
  ],
  dental_care: [
    'greeting', 'suggestions',
    'appointment', 'patient_intake', 'wait_time',
    'contact',
  ],
  vision_care: [
    'greeting', 'suggestions',
    'appointment', 'patient_intake',
    'contact',
  ],
  mental_health: [
    'greeting', 'suggestions',
    'appointment', 'telehealth', 'patient_intake',
    'contact',
  ],
  physical_therapy: [
    'greeting', 'suggestions',
    'appointment', 'patient_intake',
    'contact',
  ],
  alternative_medicine: [
    'greeting', 'suggestions',
    'appointment', 'patient_intake',
    'contact',
  ],
  diagnostic_imaging: [
    'greeting', 'suggestions',
    'appointment', 'patient_intake', 'wait_time',
    'contact',
  ],
  home_healthcare: [
    'greeting', 'suggestions',
    'appointment', 'telehealth', 'patient_intake',
    'contact',
  ],
  veterinary: [
    'greeting', 'suggestions',
    'appointment', 'patient_intake',
    'contact',
  ],
  hospitals: [
    'greeting', 'suggestions',
    'appointment', 'telehealth', 'patient_intake', 'wait_time',
    'contact',
  ],

  // Wellness — salon / studio / spa flow
  hair_beauty: [
    'greeting', 'suggestions',
    'pw_appointment', 'intake_form',
    'contact',
  ],
  spa_wellness: [
    'greeting', 'suggestions',
    'pw_appointment', 'intake_form',
    'contact',
  ],
  fitness_gym: [
    'greeting', 'suggestions',
    'pw_appointment', 'class_schedule', 'intake_form',
    'contact',
  ],
  yoga_mindfulness: [
    'greeting', 'suggestions',
    'pw_appointment', 'class_schedule', 'intake_form',
    'contact',
  ],
  skin_aesthetic: [
    'greeting', 'suggestions',
    'pw_appointment', 'intake_form',
    'contact',
  ],
  cosmetic_surgery: [
    'greeting', 'suggestions',
    'pw_appointment', 'intake_form',
    'contact',
  ],
  wellness_retreat: [
    'greeting', 'suggestions',
    'pw_appointment', 'intake_form',
    'contact',
  ],
  personal_training: [
    'greeting', 'suggestions',
    'pw_appointment', 'class_schedule', 'intake_form',
    'contact',
  ],
  body_art: [
    'greeting', 'suggestions',
    'pw_appointment', 'intake_form',
    'contact',
  ],

  // Travel — ticketing
  ticketing_booking: [
    'greeting', 'suggestions',
    'ticket_booking', 'tl_schedule_grid',
    'cart', 'contact',
  ],
  travel_agency: [
    'greeting', 'suggestions',
    'ticket_booking', 'tl_schedule_grid',
    'cart', 'contact',
  ],
  // Note: public_transport is classified as [info, service] in the M03
  // recipe — not booking-primary. Its ticket-booking flow template
  // exists in M05 for cases where an operator opts in to booking, but
  // it doesn't ship a starter block set here. The onboarding picker
  // simply won't suggest starter blocks for it.
  cinemas_theaters: [
    'greeting', 'suggestions',
    'ticket_booking', 'tl_schedule_grid',
    'cart', 'contact',
  ],

  // Travel — airport-transfer / taxi
  airport_transfer: [
    'greeting', 'suggestions',
    'transfer_booking', 'cart', 'contact',
  ],
  taxi_ride: [
    'greeting', 'suggestions',
    'transfer_booking', 'cart', 'contact',
  ],
};

// ──────────────────────────────────────────────────────────────────
// Commerce starter blocks (P2.commerce.M06)
// ──────────────────────────────────────────────────────────────────

const COMMERCE_STARTER_BLOCKS: Record<string, string[]> = {
  // Retail / D2C — general-retail flow shape
  ecommerce_d2c: [
    'greeting', 'suggestions',
    'product_card', 'product_detail', 'compare', 'bundle',
    'promo', 'cart', 'subscription', 'contact',
  ],
  physical_retail: [
    'greeting', 'suggestions',
    'product_card', 'product_detail', 'compare',
    'promo', 'cart', 'contact',
  ],
  fashion_apparel: [
    'greeting', 'suggestions',
    'skin_quiz', 'product_card', 'product_detail', 'compare', 'bundle',
    'promo', 'cart', 'contact',
  ],
  electronics_gadgets: [
    'greeting', 'suggestions',
    'product_card', 'product_detail', 'compare', 'bundle',
    'promo', 'cart', 'contact',
  ],
  jewelry_luxury: [
    'greeting', 'suggestions',
    'product_card', 'product_detail', 'compare',
    'cart', 'contact',
  ],
  furniture_home: [
    'greeting', 'suggestions',
    'product_card', 'product_detail', 'compare', 'bundle',
    'cart', 'contact',
  ],
  grocery_convenience: [
    'greeting', 'suggestions',
    'product_card', 'subscription',
    'promo', 'cart', 'contact',
  ],
  health_wellness_retail: [
    'greeting', 'suggestions',
    'skin_quiz', 'product_card', 'product_detail', 'compare',
    'subscription', 'cart', 'contact',
  ],
  books_stationery: [
    'greeting', 'suggestions',
    'product_card', 'product_detail', 'compare',
    'cart', 'contact',
  ],
  sports_outdoor: [
    'greeting', 'suggestions',
    'product_card', 'product_detail', 'compare', 'bundle',
    'promo', 'cart', 'contact',
  ],
  baby_kids: [
    'greeting', 'suggestions',
    'product_card', 'product_detail', 'bundle', 'subscription',
    'promo', 'cart', 'contact',
  ],
  pet_supplies: [
    'greeting', 'suggestions',
    'product_card', 'product_detail', 'bundle', 'subscription',
    'cart', 'contact',
  ],
  pharmacy_retail: [
    'greeting', 'suggestions',
    'product_card', 'product_detail', 'subscription',
    'cart', 'contact',
  ],

  // Food & Beverage — food-delivery flow shape
  full_service_restaurant: [
    'greeting', 'suggestions',
    'menu_item', 'menu_detail', 'category_browser', 'dietary_filter',
    'order_customizer', 'daily_specials', 'drink_menu',
    'cart', 'contact',
  ],
  casual_dining: [
    'greeting', 'suggestions',
    'menu_item', 'category_browser', 'dietary_filter',
    'order_customizer', 'daily_specials', 'combo_meal',
    'cart', 'contact',
  ],
  qsr: [
    'greeting', 'suggestions',
    'menu_item', 'category_browser', 'dietary_filter',
    'order_customizer', 'combo_meal',
    'cart', 'contact',
  ],
  beverage_cafe: [
    'greeting', 'suggestions',
    'menu_item', 'category_browser', 'drink_menu',
    'order_customizer', 'daily_specials',
    'cart', 'contact',
  ],
  bakery_desserts: [
    'greeting', 'suggestions',
    'menu_item', 'menu_detail', 'category_browser',
    'daily_specials', 'catering',
    'cart', 'contact',
  ],
  cloud_kitchen: [
    'greeting', 'suggestions',
    'menu_item', 'category_browser', 'dietary_filter',
    'order_customizer', 'combo_meal',
    'cart', 'contact',
  ],
  street_food: [
    'greeting', 'suggestions',
    'menu_item', 'category_browser',
    'combo_meal', 'cart', 'contact',
  ],

  // Food Supply / B2B — food-supply flow shape
  fresh_produce: [
    'greeting', 'suggestions',
    'fs_product_card', 'catalog_browser', 'stock_status',
    'bulk_order', 'delivery_scheduler', 'recurring_order',
    'cart', 'contact',
  ],
  meat_fish: [
    'greeting', 'suggestions',
    'fs_product_card', 'fs_product_detail', 'supplier_profile',
    'wholesale_pricing', 'delivery_scheduler', 'quality_report',
    'cert_compliance', 'cart', 'contact',
  ],
  dairy_beverage: [
    'greeting', 'suggestions',
    'fs_product_card', 'fs_product_detail', 'stock_status',
    'wholesale_pricing', 'delivery_scheduler', 'recurring_order',
    'cart', 'contact',
  ],
  packaged_specialty: [
    'greeting', 'suggestions',
    'fs_product_card', 'fs_product_detail', 'catalog_browser',
    'wholesale_pricing', 'bulk_order', 'sample_request',
    'cart', 'contact',
  ],
  grocery_delivery: [
    'greeting', 'suggestions',
    'fs_product_card', 'catalog_browser', 'stock_status',
    'delivery_scheduler', 'recurring_order',
    'cart', 'contact',
  ],
  food_wholesale: [
    'greeting', 'suggestions',
    'fs_product_card', 'catalog_browser', 'bulk_order',
    'wholesale_pricing', 'delivery_scheduler', 'recurring_order',
    'cart', 'contact',
  ],
  farm_agricultural: [
    'greeting', 'suggestions',
    'fs_product_card', 'supplier_profile', 'cert_compliance',
    'wholesale_pricing', 'delivery_scheduler', 'sample_request',
    'cart', 'contact',
  ],
  organic_health_foods: [
    'greeting', 'suggestions',
    'fs_product_card', 'fs_product_detail', 'cert_compliance',
    'wholesale_pricing', 'delivery_scheduler',
    'cart', 'contact',
  ],

  // Subscription — subscription flow shape
  online_learning: [
    'greeting', 'suggestions',
    'skin_quiz', 'product_card', 'product_detail',
    'subscription', 'promo', 'cart', 'contact',
  ],

  // Other commerce-primary functionIds (service-oriented retail, B2B,
  // specialty) — general-retail / food-supply shapes as closest fit.
  forex_remittance: [
    'greeting', 'suggestions',
    'product_card', 'product_detail',
    'cart', 'contact',
  ],
  translation_docs: [
    'greeting', 'suggestions',
    'product_card', 'product_detail',
    'cart', 'contact',
  ],
  wholesale_distribution: [
    'greeting', 'suggestions',
    'fs_product_card', 'catalog_browser', 'bulk_order',
    'wholesale_pricing', 'delivery_scheduler',
    'cart', 'contact',
  ],
  auto_parts: [
    'greeting', 'suggestions',
    'product_card', 'product_detail', 'compare',
    'cart', 'contact',
  ],
  tires_batteries: [
    'greeting', 'suggestions',
    'product_card', 'product_detail', 'compare',
    'cart', 'contact',
  ],
  logistics_courier: [
    'greeting', 'suggestions',
    'product_card', 'product_detail',
    'cart', 'contact',
  ],
  decor_floral: [
    'greeting', 'suggestions',
    'product_card', 'product_detail', 'bundle',
    'cart', 'contact',
  ],
  printing_invitations: [
    'greeting', 'suggestions',
    'product_card', 'product_detail', 'bundle',
    'cart', 'contact',
  ],
};

for (const [fn, ids] of Object.entries(COMMERCE_STARTER_BLOCKS)) {
  STARTER_BLOCKS_BY_FUNCTION[fn] = ids;
}

export function getStarterBlocks(functionId: string): string[] {
  return STARTER_BLOCKS_BY_FUNCTION[functionId] ?? [];
}
