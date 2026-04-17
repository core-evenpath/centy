// Booking flow template — hospitality sub-vertical.
//
// Covers the hospitality family (hotels, B&Bs, vacation rentals, serviced
// apartments, camping/glamping, corporate housing, event venues, guest houses,
// shared accommodation). Canonical stage order per the M05 spec:
// greeting → discovery → showcase → comparison → conversion → followup → handoff.
//
// Every `blockTypes[*]` id must exist in `_registry-data.ts` and have an
// `engines` list containing 'booking' or 'shared' (verified by the M05
// acceptance probe).

import type { SystemFlowTemplate } from '@/lib/types-flow-engine';
import { defaultSettings } from '@/lib/flow-templates';

export const HOTEL_FLOW_TEMPLATE: SystemFlowTemplate = {
  id: 'booking_tpl_hotel',
  name: 'Booking Flow — Hotels & Accommodation',
  industryId: 'hospitality',
  functionId: 'hotels_resorts',
  industryName: 'Hospitality & Accommodation',
  functionName: 'Hotels & Resorts',
  description: 'Booking-engine flow for hospitality partners: browse rooms, see property details, compare options, book, check in.',
  engine: 'booking',
  serviceIntentBreaks: ['track-reservation', 'cancel-booking', 'modify-booking'],
  settings: defaultSettings(),
  stages: [
    {
      id: 'hot_greeting',
      type: 'greeting',
      label: 'Welcome',
      blockTypes: ['greeting', 'suggestions'],
      intentTriggers: ['browsing'],
      leadScoreImpact: 1,
      isEntry: true,
    },
    {
      id: 'hot_discovery',
      type: 'discovery',
      label: 'Browse Rooms',
      blockTypes: ['room_card', 'camping_unit', 'amenities', 'property_gallery', 'local_experiences'],
      intentTriggers: ['browsing', 'returning'],
      leadScoreImpact: 2,
    },
    {
      id: 'hot_showcase',
      type: 'showcase',
      label: 'Room Detail',
      blockTypes: ['room_detail', 'availability', 'meal_plan', 'venue_space', 'promo'],
      intentTriggers: ['pricing', 'inquiry'],
      leadScoreImpact: 3,
    },
    {
      id: 'hot_comparison',
      type: 'comparison',
      label: 'Compare Options',
      blockTypes: ['room_card', 'meal_plan'],
      intentTriggers: ['comparing'],
      leadScoreImpact: 4,
    },
    {
      id: 'hot_conversion',
      type: 'conversion',
      label: 'Book & Check-in',
      blockTypes: ['availability', 'check_in', 'concierge', 'transfer', 'cart'],
      intentTriggers: ['booking', 'schedule'],
      leadScoreImpact: 5,
    },
    {
      id: 'hot_followup',
      type: 'followup',
      label: 'Reviews',
      blockTypes: ['guest_review', 'nudge'],
      intentTriggers: ['comparing', 'returning'],
      leadScoreImpact: 2,
    },
    {
      id: 'hot_handoff',
      type: 'handoff',
      label: 'Contact Front Desk',
      blockTypes: ['contact', 'house_rules'],
      intentTriggers: ['contact', 'complaint', 'urgent'],
      leadScoreImpact: 0,
      isExit: true,
    },
  ],
  transitions: [
    { from: 'hot_greeting', to: 'hot_discovery', trigger: 'browsing' },
    { from: 'hot_greeting', to: 'hot_conversion', trigger: 'booking', priority: 1 },
    { from: 'hot_greeting', to: 'hot_handoff', trigger: 'contact' },
    { from: 'hot_discovery', to: 'hot_showcase', trigger: 'pricing' },
    { from: 'hot_discovery', to: 'hot_showcase', trigger: 'inquiry' },
    { from: 'hot_discovery', to: 'hot_comparison', trigger: 'comparing' },
    { from: 'hot_discovery', to: 'hot_conversion', trigger: 'booking', priority: 1 },
    { from: 'hot_discovery', to: 'hot_handoff', trigger: 'contact' },
    { from: 'hot_showcase', to: 'hot_comparison', trigger: 'comparing' },
    { from: 'hot_showcase', to: 'hot_conversion', trigger: 'booking', priority: 1 },
    { from: 'hot_showcase', to: 'hot_discovery', trigger: 'browsing' },
    { from: 'hot_showcase', to: 'hot_handoff', trigger: 'contact' },
    { from: 'hot_comparison', to: 'hot_conversion', trigger: 'booking', priority: 1 },
    { from: 'hot_comparison', to: 'hot_discovery', trigger: 'browsing' },
    { from: 'hot_comparison', to: 'hot_handoff', trigger: 'contact' },
    { from: 'hot_conversion', to: 'hot_followup', trigger: 'returning' },
    { from: 'hot_conversion', to: 'hot_handoff', trigger: 'contact' },
    { from: 'hot_followup', to: 'hot_handoff', trigger: 'contact' },
    // complaint escalation
    { from: 'hot_discovery', to: 'hot_handoff', trigger: 'complaint' },
    { from: 'hot_showcase', to: 'hot_handoff', trigger: 'complaint' },
    { from: 'hot_comparison', to: 'hot_handoff', trigger: 'complaint' },
    { from: 'hot_conversion', to: 'hot_handoff', trigger: 'complaint' },
  ],
};
