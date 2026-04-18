// Preview Copilot — scripted customer journeys (M13).
//
// All user messages are static plain text. No templating, no random
// values, no time-dependence. This is the reproducibility contract:
// same script + same partner config = identical block ids per turn.
//
// 8 scripts per sub-vertical × 5 sub-verticals = 40 total.
// Themes (identical across sub-verticals so reviewers can compare):
//   1. greeting + browse
//   2. specific availability
//   3. comparison
//   4. booking flow
//   5. add-on
//   6. service-overlay break  (track / cancel / modify intent mid-conversation)
//   7. cancel flow
//   8. sub-vertical edge case

import type { Engine } from '../engine-types';

export interface PreviewScript {
  id: string;
  engine: Engine;
  /** Sub-vertical id — hotel | clinic | wellness | ticketing | airport-transfer */
  subVertical: 'hotel' | 'clinic' | 'wellness' | 'ticketing' | 'airport-transfer';
  label: string;
  description: string;
  turns: Array<{ role: 'user'; content: string }>;
}

const T = (content: string) => ({ role: 'user' as const, content });

// ── Hotel (hospitality) ───────────────────────────────────────────────

const HOTEL_SCRIPTS: PreviewScript[] = [
  {
    id: 'hotel-01-greeting-browse',
    engine: 'booking',
    subVertical: 'hotel',
    label: 'Greeting + browse',
    description: 'Visitor arrives, asks what rooms are available',
    turns: [
      T('hi'),
      T('what rooms do you have'),
      T('show me the ocean view ones'),
    ],
  },
  {
    id: 'hotel-02-specific-availability',
    engine: 'booking',
    subVertical: 'hotel',
    label: 'Specific availability',
    description: 'Visitor asks about dates and availability',
    turns: [
      T('are you open this weekend'),
      T('do you have rooms for 2 adults next friday'),
      T('what about saturday night'),
    ],
  },
  {
    id: 'hotel-03-comparison',
    engine: 'booking',
    subVertical: 'hotel',
    label: 'Comparison',
    description: 'Visitor compares two room types',
    turns: [
      T('tell me about your suites'),
      T('what is the difference between the deluxe and premium'),
      T('which is better for a family'),
    ],
  },
  {
    id: 'hotel-04-booking-flow',
    engine: 'booking',
    subVertical: 'hotel',
    label: 'Booking flow',
    description: 'Visitor progresses from browse to reservation',
    turns: [
      T('show me rooms'),
      T('i like the ocean view one'),
      T('book it for three nights'),
      T('confirm the reservation please'),
    ],
  },
  {
    id: 'hotel-05-addon',
    engine: 'booking',
    subVertical: 'hotel',
    label: 'Add-on (meal plan, transfer)',
    description: 'Visitor asks about add-ons after selecting a room',
    turns: [
      T('book the deluxe room'),
      T('what meal plan options do you have'),
      T('do you offer airport transfer'),
    ],
  },
  {
    id: 'hotel-06-service-break',
    engine: 'booking',
    subVertical: 'hotel',
    label: 'Service overlay break',
    description: 'Mid-booking, visitor switches to checking an existing reservation',
    turns: [
      T('show me rooms'),
      T('actually, can you track my reservation from last week'),
      T('what is the status'),
    ],
  },
  {
    id: 'hotel-07-cancel',
    engine: 'booking',
    subVertical: 'hotel',
    label: 'Cancel flow',
    description: 'Visitor asks to cancel an existing booking',
    turns: [
      T('i want to cancel my booking'),
      T('what is the cancellation policy'),
      T('go ahead and cancel it'),
    ],
  },
  {
    id: 'hotel-08-edge-venue',
    engine: 'booking',
    subVertical: 'hotel',
    label: 'Edge case — venue / event booking',
    description: 'Visitor asks about event-space or group booking',
    turns: [
      T('do you have event space'),
      T('we need a venue for 80 people'),
      T('what does it cost per night'),
    ],
  },
];

// ── Clinic (healthcare) ───────────────────────────────────────────────

const CLINIC_SCRIPTS: PreviewScript[] = [
  {
    id: 'clinic-01-greeting-browse',
    engine: 'booking',
    subVertical: 'clinic',
    label: 'Greeting + browse',
    description: 'Patient arrives, asks about services',
    turns: [
      T('hi there'),
      T('what services do you offer'),
      T('can i see your providers'),
    ],
  },
  {
    id: 'clinic-02-specific-availability',
    engine: 'booking',
    subVertical: 'clinic',
    label: 'Specific availability',
    description: 'Patient asks for appointment time',
    turns: [
      T('when can i come in'),
      T('do you have anything tomorrow morning'),
      T('something after 3pm would work'),
    ],
  },
  {
    id: 'clinic-03-comparison',
    engine: 'booking',
    subVertical: 'clinic',
    label: 'Comparison',
    description: 'Patient compares in-person vs telehealth',
    turns: [
      T('i need a consultation'),
      T('whats the difference between telehealth and in-person'),
      T('which should i choose for a follow-up'),
    ],
  },
  {
    id: 'clinic-04-booking-flow',
    engine: 'booking',
    subVertical: 'clinic',
    label: 'Booking flow',
    description: 'Patient books an appointment with intake',
    turns: [
      T('i want to book an appointment'),
      T('thursday at 10am works'),
      T('ok ill fill out the intake form'),
      T('confirm the booking please'),
    ],
  },
  {
    id: 'clinic-05-addon',
    engine: 'booking',
    subVertical: 'clinic',
    label: 'Add-on — insurance / intake',
    description: 'Patient asks about insurance coverage during booking',
    turns: [
      T('book me an appointment'),
      T('do you accept my insurance'),
      T('what forms do i need to fill out beforehand'),
    ],
  },
  {
    id: 'clinic-06-service-break',
    engine: 'booking',
    subVertical: 'clinic',
    label: 'Service overlay break',
    description: 'Patient asks about lab results mid-booking',
    turns: [
      T('i want to book a follow-up'),
      T('actually, are my lab results ready'),
      T('when will they be ready'),
    ],
  },
  {
    id: 'clinic-07-cancel',
    engine: 'booking',
    subVertical: 'clinic',
    label: 'Cancel flow',
    description: 'Patient cancels their appointment',
    turns: [
      T('i need to cancel my appointment'),
      T('whats your cancellation policy'),
      T('please cancel it'),
    ],
  },
  {
    id: 'clinic-08-edge-urgent',
    engine: 'booking',
    subVertical: 'clinic',
    label: 'Edge case — urgent symptom',
    description: 'Patient reports acute symptoms; flow should route to handoff',
    turns: [
      T('i have chest pain'),
      T('it started an hour ago'),
      T('should i come in'),
    ],
  },
];

// ── Wellness (personal care) ──────────────────────────────────────────

const WELLNESS_SCRIPTS: PreviewScript[] = [
  {
    id: 'wellness-01-greeting-browse',
    engine: 'booking',
    subVertical: 'wellness',
    label: 'Greeting + browse',
    description: 'Visitor asks about class offerings',
    turns: [
      T('hello'),
      T('what classes do you have this week'),
      T('show me yoga times'),
    ],
  },
  {
    id: 'wellness-02-specific-availability',
    engine: 'booking',
    subVertical: 'wellness',
    label: 'Specific availability',
    description: 'Visitor asks about a specific stylist/therapist time',
    turns: [
      T('is sarah available saturday'),
      T('what about sunday morning'),
      T('her first open slot works'),
    ],
  },
  {
    id: 'wellness-03-comparison',
    engine: 'booking',
    subVertical: 'wellness',
    label: 'Comparison',
    description: 'Visitor compares two service packages',
    turns: [
      T('whats in your signature facial'),
      T('how is that different from the deep-clean facial'),
      T('which do you recommend for sensitive skin'),
    ],
  },
  {
    id: 'wellness-04-booking-flow',
    engine: 'booking',
    subVertical: 'wellness',
    label: 'Booking flow',
    description: 'Visitor books an appointment with intake',
    turns: [
      T('i want to book a massage'),
      T('the 60 minute one'),
      T('ill fill out the health history form'),
      T('confirm please'),
    ],
  },
  {
    id: 'wellness-05-addon',
    engine: 'booking',
    subVertical: 'wellness',
    label: 'Add-on — membership / gift card',
    description: 'Visitor asks about membership after booking',
    turns: [
      T('book me a facial'),
      T('do you have a membership plan'),
      T('whats included in the platinum tier'),
    ],
  },
  {
    id: 'wellness-06-service-break',
    engine: 'booking',
    subVertical: 'wellness',
    label: 'Service overlay break',
    description: 'Visitor asks about a previous appointment mid-booking',
    turns: [
      T('i want to book a facial'),
      T('actually, can you check my loyalty points'),
      T('did last weeks appointment count'),
    ],
  },
  {
    id: 'wellness-07-cancel',
    engine: 'booking',
    subVertical: 'wellness',
    label: 'Cancel flow',
    description: 'Visitor cancels a class booking',
    turns: [
      T('i need to cancel my yoga class'),
      T('the saturday morning one'),
      T('please cancel'),
    ],
  },
  {
    id: 'wellness-08-edge-gift',
    engine: 'booking',
    subVertical: 'wellness',
    label: 'Edge case — gift card purchase',
    description: 'Visitor asks about gift cards',
    turns: [
      T('i want to buy a gift card'),
      T('for my sister'),
      T('something around 100 dollars'),
    ],
  },
];

// ── Ticketing (travel) ────────────────────────────────────────────────

const TICKETING_SCRIPTS: PreviewScript[] = [
  {
    id: 'ticketing-01-greeting-browse',
    engine: 'booking',
    subVertical: 'ticketing',
    label: 'Greeting + browse',
    description: 'Traveler arrives, asks what routes are available',
    turns: [
      T('hi'),
      T('what routes do you run'),
      T('how often do you go to chennai'),
    ],
  },
  {
    id: 'ticketing-02-specific-availability',
    engine: 'booking',
    subVertical: 'ticketing',
    label: 'Specific availability',
    description: 'Traveler asks about specific trip time',
    turns: [
      T('any tickets tomorrow morning'),
      T('the first one after 6am'),
      T('what time does it arrive'),
    ],
  },
  {
    id: 'ticketing-03-comparison',
    engine: 'booking',
    subVertical: 'ticketing',
    label: 'Comparison',
    description: 'Traveler compares two options',
    turns: [
      T('compare the express and sleeper'),
      T('which is faster'),
      T('which is cheaper'),
    ],
  },
  {
    id: 'ticketing-04-booking-flow',
    engine: 'booking',
    subVertical: 'ticketing',
    label: 'Booking flow',
    description: 'Traveler books a ticket',
    turns: [
      T('i need a ticket'),
      T('the 9am one'),
      T('2 passengers'),
      T('confirm and pay'),
    ],
  },
  {
    id: 'ticketing-05-addon',
    engine: 'booking',
    subVertical: 'ticketing',
    label: 'Add-on — insurance',
    description: 'Traveler asks about travel insurance',
    turns: [
      T('book me the 9am ticket'),
      T('do you offer travel insurance'),
      T('how much extra'),
    ],
  },
  {
    id: 'ticketing-06-service-break',
    engine: 'booking',
    subVertical: 'ticketing',
    label: 'Service overlay break',
    description: 'Traveler asks about existing ticket status mid-booking',
    turns: [
      T('i want a new ticket'),
      T('actually, can you tell me the status of my existing ticket'),
      T('is it delayed'),
    ],
  },
  {
    id: 'ticketing-07-cancel',
    engine: 'booking',
    subVertical: 'ticketing',
    label: 'Cancel flow',
    description: 'Traveler cancels a ticket',
    turns: [
      T('i want to cancel my ticket'),
      T('will i get a refund'),
      T('please go ahead and cancel'),
    ],
  },
  {
    id: 'ticketing-08-edge-group',
    engine: 'booking',
    subVertical: 'ticketing',
    label: 'Edge case — group / corporate booking',
    description: 'Traveler asks about group bookings',
    turns: [
      T('i need tickets for 20 people'),
      T('is there a group discount'),
      T('can we block book for next month'),
    ],
  },
];

// ── Airport Transfer (travel ride) ────────────────────────────────────

const AIRPORT_TRANSFER_SCRIPTS: PreviewScript[] = [
  {
    id: 'airport-transfer-01-greeting-browse',
    engine: 'booking',
    subVertical: 'airport-transfer',
    label: 'Greeting + browse',
    description: 'Traveler asks what vehicle options exist',
    turns: [
      T('hi'),
      T('what vehicles do you have for airport transfer'),
      T('how much for a sedan'),
    ],
  },
  {
    id: 'airport-transfer-02-specific-availability',
    engine: 'booking',
    subVertical: 'airport-transfer',
    label: 'Specific availability',
    description: 'Traveler asks about specific pickup time',
    turns: [
      T('i land at 11:30pm on friday'),
      T('can you pick me up at the airport'),
      T('whats the fare to my hotel'),
    ],
  },
  {
    id: 'airport-transfer-03-comparison',
    engine: 'booking',
    subVertical: 'airport-transfer',
    label: 'Comparison',
    description: 'Traveler compares vehicle tiers',
    turns: [
      T('whats the difference between sedan and suv'),
      T('which has more luggage space'),
      T('any with meet and greet'),
    ],
  },
  {
    id: 'airport-transfer-04-booking-flow',
    engine: 'booking',
    subVertical: 'airport-transfer',
    label: 'Booking flow',
    description: 'Traveler books a transfer',
    turns: [
      T('book an airport transfer'),
      T('sedan is fine'),
      T('flight arrives 11pm friday, drop at the marriott'),
      T('confirm the booking'),
    ],
  },
  {
    id: 'airport-transfer-05-addon',
    engine: 'booking',
    subVertical: 'airport-transfer',
    label: 'Add-on — return trip, child seat',
    description: 'Traveler adds return-trip or child-seat',
    turns: [
      T('book a sedan for arrival'),
      T('can you also book the return trip'),
      T('i need a child seat'),
    ],
  },
  {
    id: 'airport-transfer-06-service-break',
    engine: 'booking',
    subVertical: 'airport-transfer',
    label: 'Service overlay break',
    description: 'Traveler asks driver status mid-booking',
    turns: [
      T('book me a transfer'),
      T('actually, where is my current driver'),
      T('whats the eta'),
    ],
  },
  {
    id: 'airport-transfer-07-cancel',
    engine: 'booking',
    subVertical: 'airport-transfer',
    label: 'Cancel flow',
    description: 'Traveler cancels the transfer',
    turns: [
      T('cancel my transfer'),
      T('whats the cancellation fee'),
      T('go ahead and cancel'),
    ],
  },
  {
    id: 'airport-transfer-08-edge-multistop',
    engine: 'booking',
    subVertical: 'airport-transfer',
    label: 'Edge case — multi-stop / wait time',
    description: 'Traveler needs multi-stop or waiting-time pricing',
    turns: [
      T('i need to go airport -> office -> hotel'),
      T('how do you charge for wait time'),
      T('about 2 hours at the office'),
    ],
  },
];

// ── Exports ───────────────────────────────────────────────────────────

export const BOOKING_PREVIEW_SCRIPTS: readonly PreviewScript[] = [
  ...HOTEL_SCRIPTS,
  ...CLINIC_SCRIPTS,
  ...WELLNESS_SCRIPTS,
  ...TICKETING_SCRIPTS,
  ...AIRPORT_TRANSFER_SCRIPTS,
];

export function getScriptsBySubVertical(
  subVertical: PreviewScript['subVertical'],
): PreviewScript[] {
  return BOOKING_PREVIEW_SCRIPTS.filter((s) => s.subVertical === subVertical);
}

export function getScriptById(id: string): PreviewScript | undefined {
  return BOOKING_PREVIEW_SCRIPTS.find((s) => s.id === id);
}
