// Booking flow templates registry (M05).
//
// Keyed by `functionId`. Multiple functionIds can share a template (hotels and
// vacation rentals use the same `hotel` flow, clinics and vet clinics use the
// same `clinic-appointment`, etc.).
//
// Every template declares `engine: 'booking'`. Consumers keyed by engine
// (M11 session, M12 orchestrator) treat the absence of an engine field as
// legacy / untagged.

import type { SystemFlowTemplate } from '@/lib/types-flow-engine';
import { HOTEL_FLOW_TEMPLATE } from './hotel';
import { CLINIC_APPOINTMENT_FLOW_TEMPLATE } from './clinic-appointment';
import { WELLNESS_APPOINTMENT_FLOW_TEMPLATE } from './wellness-appointment';
import { TICKETING_FLOW_TEMPLATE } from './ticketing';
import { AIRPORT_TRANSFER_FLOW_TEMPLATE } from './airport-transfer';

export {
  HOTEL_FLOW_TEMPLATE,
  CLINIC_APPOINTMENT_FLOW_TEMPLATE,
  WELLNESS_APPOINTMENT_FLOW_TEMPLATE,
  TICKETING_FLOW_TEMPLATE,
  AIRPORT_TRANSFER_FLOW_TEMPLATE,
};

// Maps business-taxonomy functionIds to booking flow templates. Drawn
// from the M03 recipe's booking-primary entries; the five template
// categories cover the five sub-verticals identified in the M05 spec.
export const BOOKING_FLOW_TEMPLATES: Readonly<Record<string, SystemFlowTemplate>> = {
  // Hospitality (10)
  hotels_resorts:       HOTEL_FLOW_TEMPLATE,
  budget_accommodation: HOTEL_FLOW_TEMPLATE,
  boutique_bnb:         HOTEL_FLOW_TEMPLATE,
  serviced_apartments:  HOTEL_FLOW_TEMPLATE,
  vacation_rentals:     HOTEL_FLOW_TEMPLATE,
  guest_houses:         HOTEL_FLOW_TEMPLATE,
  camping_glamping:     HOTEL_FLOW_TEMPLATE,
  corporate_housing:    HOTEL_FLOW_TEMPLATE,
  event_venues:         HOTEL_FLOW_TEMPLATE,
  shared_accommodation: HOTEL_FLOW_TEMPLATE,

  // Healthcare booking sub-set (10)
  primary_care:         CLINIC_APPOINTMENT_FLOW_TEMPLATE,
  hospitals:            CLINIC_APPOINTMENT_FLOW_TEMPLATE,
  diagnostic_imaging:   CLINIC_APPOINTMENT_FLOW_TEMPLATE,
  dental_care:          CLINIC_APPOINTMENT_FLOW_TEMPLATE,
  vision_care:          CLINIC_APPOINTMENT_FLOW_TEMPLATE,
  mental_health:        CLINIC_APPOINTMENT_FLOW_TEMPLATE,
  physical_therapy:     CLINIC_APPOINTMENT_FLOW_TEMPLATE,
  alternative_medicine: CLINIC_APPOINTMENT_FLOW_TEMPLATE,
  home_healthcare:      CLINIC_APPOINTMENT_FLOW_TEMPLATE,
  veterinary:           CLINIC_APPOINTMENT_FLOW_TEMPLATE,

  // Personal wellness booking (9)
  hair_beauty:       WELLNESS_APPOINTMENT_FLOW_TEMPLATE,
  spa_wellness:      WELLNESS_APPOINTMENT_FLOW_TEMPLATE,
  fitness_gym:       WELLNESS_APPOINTMENT_FLOW_TEMPLATE,
  yoga_mindfulness:  WELLNESS_APPOINTMENT_FLOW_TEMPLATE,
  skin_aesthetic:    WELLNESS_APPOINTMENT_FLOW_TEMPLATE,
  cosmetic_surgery:  WELLNESS_APPOINTMENT_FLOW_TEMPLATE,
  wellness_retreat:  WELLNESS_APPOINTMENT_FLOW_TEMPLATE,
  personal_training: WELLNESS_APPOINTMENT_FLOW_TEMPLATE,
  body_art:          WELLNESS_APPOINTMENT_FLOW_TEMPLATE,

  // Ticketing (4) — travel agencies, public transport, cinemas (scheduled events)
  ticketing_booking: TICKETING_FLOW_TEMPLATE,
  public_transport:  TICKETING_FLOW_TEMPLATE,
  travel_agency:     TICKETING_FLOW_TEMPLATE,
  cinemas_theaters:  TICKETING_FLOW_TEMPLATE,

  // Transfer / ride (2)
  airport_transfer: AIRPORT_TRANSFER_FLOW_TEMPLATE,
  taxi_ride:        AIRPORT_TRANSFER_FLOW_TEMPLATE,

  // Extended coverage — other booking-primary functionIds per the M03
  // recipe. These verticals' blocks aren't tagged for booking in M04
  // (M04 covered only the core 7 verticals). The nearest-fit template
  // declares stage structure; M12 will find zero matching vertical
  // blocks for these partners and fall back to legacy routing. Logged
  // as Q3 — proper coverage comes in Phase 2.
  notary_compliance:     CLINIC_APPOINTMENT_FLOW_TEMPLATE,
  full_service_restaurant: WELLNESS_APPOINTMENT_FLOW_TEMPLATE,
  casual_dining:         WELLNESS_APPOINTMENT_FLOW_TEMPLATE,
  bars_pubs:             WELLNESS_APPOINTMENT_FLOW_TEMPLATE,
  vehicle_maintenance:   WELLNESS_APPOINTMENT_FLOW_TEMPLATE,
  car_wash:              WELLNESS_APPOINTMENT_FLOW_TEMPLATE,
  vehicle_rental:        WELLNESS_APPOINTMENT_FLOW_TEMPLATE,
  driving_education:     WELLNESS_APPOINTMENT_FLOW_TEMPLATE,
  ev_infrastructure:     TICKETING_FLOW_TEMPLATE,
  luxury_adventure:      TICKETING_FLOW_TEMPLATE,
  live_entertainment:    TICKETING_FLOW_TEMPLATE,
  plumbing_electrical:   WELLNESS_APPOINTMENT_FLOW_TEMPLATE,
  cleaning_housekeeping: WELLNESS_APPOINTMENT_FLOW_TEMPLATE,
  pest_control:          WELLNESS_APPOINTMENT_FLOW_TEMPLATE,
  appliance_repair:      WELLNESS_APPOINTMENT_FLOW_TEMPLATE,
  laundry_drycleaning:   WELLNESS_APPOINTMENT_FLOW_TEMPLATE,
};

export function getBookingFlowTemplate(
  functionId: string | null | undefined,
): SystemFlowTemplate | null {
  if (!functionId) return null;
  return BOOKING_FLOW_TEMPLATES[functionId] ?? null;
}
