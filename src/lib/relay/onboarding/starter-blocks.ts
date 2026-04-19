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

// ── Lead starter blocks (P2.lead.M06) ──────────────────────────────────
// One curated set per lead-primary functionId. Set size 5-13 per Session 1
// retro band. Covers all 48 lead-primary functionIds from M01.
const LEAD_STARTER_BLOCKS: Record<string, string[]> = {
  // Financial services (13) — fin_* blocks + shared
  retail_banking: [
    'greeting', 'suggestions',
    'fin_product_card', 'fin_account_snapshot', 'fin_application',
    'fin_doc_upload', 'fin_app_tracker', 'contact',
  ],
  alternative_lending: [
    'greeting', 'suggestions',
    'fin_product_card', 'fin_loan_calc', 'fin_application',
    'fin_eligibility', 'fin_doc_upload', 'contact',
  ],
  consumer_lending: [
    'greeting', 'suggestions',
    'fin_product_card', 'fin_loan_calc', 'fin_application',
    'fin_eligibility', 'fin_credit_score', 'contact',
  ],
  commercial_lending: [
    'greeting', 'suggestions',
    'fin_product_card', 'fin_loan_calc', 'fin_application',
    'fin_doc_upload', 'fin_advisor', 'contact',
  ],
  payments_processing: [
    'greeting', 'suggestions',
    'fin_transfer', 'fin_product_card', 'contact',
  ],
  wealth_management: [
    'greeting', 'suggestions',
    'fin_portfolio', 'fin_advisor', 'fin_product_card',
    'fin_rate_compare', 'contact',
  ],
  insurance_brokerage: [
    'greeting', 'suggestions',
    'fin_insurance', 'fin_product_card', 'fin_advisor',
    'fin_application', 'fin_doc_upload', 'contact',
  ],
  accounting_tax: [
    'greeting', 'suggestions',
    'service_package', 'expert_profile', 'consultation_booking',
    'document_collector', 'contact',
  ],
  investment_trading: [
    'greeting', 'suggestions',
    'fin_portfolio', 'fin_product_card', 'fin_advisor',
    'fin_eligibility', 'contact',
  ],
  credit_debt: [
    'greeting', 'suggestions',
    'fin_credit_score', 'fin_loan_calc', 'fin_eligibility',
    'fin_advisor', 'contact',
  ],
  fintech: [
    'greeting', 'suggestions',
    'fin_product_card', 'fin_eligibility', 'fin_loan_calc',
    'fin_application', 'fin_transfer', 'contact',
  ],
  community_savings: [
    'greeting', 'suggestions',
    'fin_account_snapshot', 'fin_product_card', 'fin_advisor', 'contact',
  ],
  auto_insurance: [
    'greeting', 'suggestions',
    'fin_insurance', 'fin_product_card', 'fin_application', 'contact',
  ],

  // Education (9) — professional-services shape
  early_childhood: [
    'greeting', 'suggestions',
    'service_package', 'expert_profile', 'consultation_booking',
    'credential_badge', 'contact',
  ],
  k12_education: [
    'greeting', 'suggestions',
    'service_package', 'credential_badge', 'contact',
  ],
  higher_education: [
    'greeting', 'suggestions',
    'service_package', 'expert_profile', 'credential_badge',
    'document_collector', 'contact',
  ],
  test_preparation: [
    'greeting', 'suggestions',
    'service_package', 'expert_profile', 'consultation_booking',
    'credential_badge', 'contact',
  ],
  language_learning: [
    'greeting', 'suggestions',
    'service_package', 'expert_profile', 'consultation_booking',
    'credential_badge', 'client_review', 'contact',
  ],
  skill_vocational: [
    'greeting', 'suggestions',
    'service_package', 'expert_profile', 'credential_badge',
    'client_review', 'contact',
  ],
  corporate_training: [
    'greeting', 'suggestions',
    'service_package', 'expert_profile', 'proposal',
    'case_study', 'contact',
  ],
  academic_counseling: [
    'greeting', 'suggestions',
    'service_package', 'expert_profile', 'consultation_booking',
    'credential_badge', 'contact',
  ],
  creative_arts: [
    'greeting', 'suggestions',
    'service_package', 'expert_profile', 'evt_portfolio', 'contact',
  ],

  // Professional services (9)
  real_estate: [
    'greeting', 'suggestions',
    'property_listing', 'expert_profile', 'consultation_booking',
    'fee_calculator', 'document_collector', 'client_review', 'contact',
  ],
  construction_dev: [
    'greeting', 'suggestions',
    'service_package', 'expert_profile', 'project_scope',
    'proposal', 'credential_badge', 'client_review', 'contact',
  ],
  legal_services: [
    'greeting', 'suggestions',
    'service_package', 'expert_profile', 'consultation_booking',
    'case_study', 'proposal', 'retainer_status', 'credential_badge',
    'compliance_checklist', 'client_review', 'contact',
  ],
  architecture_design: [
    'greeting', 'suggestions',
    'service_package', 'expert_profile', 'consultation_booking',
    'case_study', 'project_scope', 'fee_calculator', 'client_review', 'contact',
  ],
  hr_recruitment: [
    'greeting', 'suggestions',
    'service_package', 'expert_profile', 'consultation_booking',
    'case_study', 'proposal', 'engagement_timeline', 'contact',
  ],
  marketing_advertising: [
    'greeting', 'suggestions',
    'service_package', 'expert_profile', 'consultation_booking',
    'case_study', 'proposal', 'retainer_status', 'client_review', 'contact',
  ],
  software_it: [
    'greeting', 'suggestions',
    'service_package', 'expert_profile', 'consultation_booking',
    'case_study', 'project_scope', 'proposal', 'engagement_timeline',
    'fee_calculator', 'client_review', 'contact',
  ],
  consulting_advisory: [
    'greeting', 'suggestions',
    'service_package', 'expert_profile', 'consultation_booking',
    'case_study', 'project_scope', 'proposal', 'retainer_status',
    'client_review', 'contact',
  ],
  pr_communications: [
    'greeting', 'suggestions',
    'service_package', 'expert_profile', 'consultation_booking',
    'case_study', 'retainer_status', 'client_review', 'contact',
  ],

  // F&B lead (1)
  catering_events: [
    'greeting', 'suggestions',
    'evt_service_card', 'event_package', 'evt_quote_builder',
    'vendor_profile', 'evt_client_review', 'contact',
  ],

  // Automotive lead-primary (5)
  vehicle_sales_new: [
    'greeting', 'suggestions',
    'property_listing', 'fee_calculator', 'consultation_booking',
    'fin_loan_calc', 'client_review', 'contact',
  ],
  vehicle_sales_used: [
    'greeting', 'suggestions',
    'property_listing', 'fee_calculator', 'consultation_booking',
    'fin_loan_calc', 'client_review', 'contact',
  ],
  fleet_services: [
    'greeting', 'suggestions',
    'service_package', 'fee_calculator', 'consultation_booking',
    'contact',
  ],
  motorcycle_sales: [
    'greeting', 'suggestions',
    'property_listing', 'fee_calculator', 'consultation_booking',
    'client_review', 'contact',
  ],

  // Travel / logistics (2)
  moving_relocation: [
    'greeting', 'suggestions',
    'service_package', 'fee_calculator', 'consultation_booking',
    'document_collector', 'client_review', 'contact',
  ],
  visa_immigration: [
    'greeting', 'suggestions',
    'service_package', 'expert_profile', 'consultation_booking',
    'document_collector', 'compliance_checklist', 'contact',
  ],

  // Events / entertainment (6)
  event_planning: [
    'greeting', 'suggestions',
    'evt_service_card', 'event_package', 'evt_quote_builder',
    'vendor_profile', 'evt_portfolio', 'evt_client_review', 'contact',
  ],
  wedding_private: [
    'greeting', 'suggestions',
    'evt_service_card', 'event_package', 'evt_quote_builder',
    'mood_board', 'vendor_profile', 'evt_portfolio', 'evt_client_review', 'contact',
  ],
  corporate_events: [
    'greeting', 'suggestions',
    'evt_service_card', 'event_package', 'evt_quote_builder',
    'vendor_profile', 'evt_equipment', 'evt_client_review', 'contact',
  ],
  photography_video: [
    'greeting', 'suggestions',
    'evt_service_card', 'vendor_profile', 'evt_portfolio',
    'evt_quote_builder', 'evt_client_review', 'contact',
  ],
  hosts_anchors: [
    'greeting', 'suggestions',
    'evt_service_card', 'vendor_profile', 'evt_portfolio', 'contact',
  ],
  av_production: [
    'greeting', 'suggestions',
    'evt_equipment', 'evt_service_card', 'vendor_profile',
    'evt_quote_builder', 'contact',
  ],

  // Home / property (6)
  painting_renovation: [
    'greeting', 'suggestions',
    'hp_service_card', 'hp_technician', 'hp_estimate',
    'hp_before_after', 'hp_review', 'contact',
  ],
  landscaping_gardening: [
    'greeting', 'suggestions',
    'hp_service_card', 'hp_technician', 'hp_estimate',
    'hp_maintenance_plan', 'hp_before_after', 'hp_review', 'contact',
  ],
  home_automation: [
    'greeting', 'suggestions',
    'hp_service_card', 'hp_technician', 'hp_estimate',
    'hp_before_after', 'hp_review', 'contact',
  ],
  carpentry_furniture: [
    'greeting', 'suggestions',
    'hp_service_card', 'hp_estimate', 'hp_before_after',
    'hp_review', 'contact',
  ],
  solar_renewable: [
    'greeting', 'suggestions',
    'hp_service_card', 'hp_estimate', 'hp_maintenance_plan',
    'hp_warranty', 'hp_review', 'contact',
  ],
  security_surveillance: [
    'greeting', 'suggestions',
    'hp_service_card', 'hp_estimate', 'hp_maintenance_plan',
    'hp_warranty', 'hp_review', 'contact',
  ],
};

for (const [fn, ids] of Object.entries(LEAD_STARTER_BLOCKS)) {
  STARTER_BLOCKS_BY_FUNCTION[fn] = ids;
}

// ── Engagement starter blocks (P2.engagement.M06) ──────────────────
// Curated sets per Engagement-primary functionId. Set size 5-13 per
// the Session 1 retro band. Engagement sets skew small — nonprofit
// flows have a narrow natural surface (donate, impact-report,
// event-calendar, volunteer, contact, greeting = 6 blocks). Service-
// exception partners (Adjustment 3) have no Service-dependent blocks
// in their starter sets.
const ENGAGEMENT_STARTER_BLOCKS: Record<string, string[]> = {
  ngo_nonprofit: [
    'greeting', 'suggestions',
    'pu_program_card', 'pu_donation', 'pu_impact_report',
    'pu_volunteer', 'pu_event_calendar', 'pu_feedback', 'contact',
  ],
  religious: [
    'greeting', 'suggestions',
    'pu_event_calendar', 'pu_donation', 'pu_volunteer',
    'pu_program_card', 'pu_feedback', 'contact',
  ],
  community_association: [
    'greeting', 'suggestions',
    'pu_event_calendar', 'pu_complaint', 'pu_volunteer',
    'pu_feedback', 'contact',
  ],
  // cultural_institutions blends booking (ticketed events) with
  // engagement (donations + volunteer). Starter set picks engagement
  // core blocks; the booking sub-surface (tickets) is a separate
  // partner-level decision handled by the booking catalog on that tab.
  cultural_institutions: [
    'greeting', 'suggestions',
    'pu_event_calendar', 'pu_donation', 'pu_program_card',
    'pu_volunteer', 'pu_feedback', 'contact',
  ],
};

for (const [fn, ids] of Object.entries(ENGAGEMENT_STARTER_BLOCKS)) {
  STARTER_BLOCKS_BY_FUNCTION[fn] = ids;
}

// ── Info starter blocks (P2.info.M06) ──────────────────────────────
// 3 info-primary functionIds. Narrow sets (5-6 blocks) per Session 3
// retro's prediction that info trends smallest — info partners serve
// directory + status + contact.
const INFO_STARTER_BLOCKS: Record<string, string[]> = {
  public_transport: [
    'greeting', 'suggestions',
    'tl_schedule_grid', 'pu_office_locator', 'contact',
  ],
  government: [
    'greeting', 'suggestions',
    'pu_service_directory', 'pu_document_portal', 'pu_office_locator', 'contact',
  ],
  utilities: [
    'greeting', 'suggestions',
    'pu_outage_status', 'pu_service_directory', 'pu_office_locator', 'contact',
  ],
};

for (const [fn, ids] of Object.entries(INFO_STARTER_BLOCKS)) {
  STARTER_BLOCKS_BY_FUNCTION[fn] = ids;
}

export function getStarterBlocks(functionId: string): string[] {
  return STARTER_BLOCKS_BY_FUNCTION[functionId] ?? [];
}
