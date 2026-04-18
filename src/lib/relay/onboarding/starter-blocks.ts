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

export function getStarterBlocks(functionId: string): string[] {
  return STARTER_BLOCKS_BY_FUNCTION[functionId] ?? [];
}
