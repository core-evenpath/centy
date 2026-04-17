// Booking flow template — travel ticketing sub-vertical.
//
// Covers travel booking functionIds: ticketing_booking, public_transport,
// travel_agency, cinemas_theaters (event-ticket style).

import type { SystemFlowTemplate } from '@/lib/types-flow-engine';
import { defaultSettings } from '@/lib/flow-templates';

export const TICKETING_FLOW_TEMPLATE: SystemFlowTemplate = {
  id: 'booking_tpl_ticketing',
  name: 'Booking Flow — Ticketing',
  industryId: 'travel_transport',
  functionId: 'ticketing_booking',
  industryName: 'Travel, Transport & Logistics',
  functionName: 'Ticketing & Booking',
  description: 'Booking-engine flow for ticketing partners: route discovery, schedule browsing, ticket purchase.',
  engine: 'booking',
  serviceIntentBreaks: ['track-reservation', 'cancel-booking', 'modify-booking'],
  settings: defaultSettings(),
  stages: [
    {
      id: 'tkt_greeting',
      type: 'greeting',
      label: 'Welcome',
      blockTypes: ['greeting', 'suggestions'],
      intentTriggers: ['browsing'],
      leadScoreImpact: 1,
      isEntry: true,
    },
    {
      id: 'tkt_discovery',
      type: 'discovery',
      label: 'Routes & Schedule',
      blockTypes: ['tl_schedule_grid'],
      intentTriggers: ['browsing', 'returning', 'schedule'],
      leadScoreImpact: 2,
    },
    {
      id: 'tkt_showcase',
      type: 'showcase',
      label: 'Options',
      blockTypes: ['ticket_booking', 'promo'],
      intentTriggers: ['pricing', 'inquiry'],
      leadScoreImpact: 3,
    },
    {
      id: 'tkt_conversion',
      type: 'conversion',
      label: 'Book Ticket',
      blockTypes: ['ticket_booking', 'cart'],
      intentTriggers: ['booking'],
      leadScoreImpact: 5,
    },
    {
      id: 'tkt_handoff',
      type: 'handoff',
      label: 'Contact Support',
      blockTypes: ['contact'],
      intentTriggers: ['contact', 'complaint', 'urgent'],
      leadScoreImpact: 0,
      isExit: true,
    },
  ],
  transitions: [
    { from: 'tkt_greeting', to: 'tkt_discovery', trigger: 'browsing' },
    { from: 'tkt_greeting', to: 'tkt_discovery', trigger: 'schedule' },
    { from: 'tkt_greeting', to: 'tkt_conversion', trigger: 'booking', priority: 1 },
    { from: 'tkt_greeting', to: 'tkt_handoff', trigger: 'contact' },
    { from: 'tkt_discovery', to: 'tkt_showcase', trigger: 'pricing' },
    { from: 'tkt_discovery', to: 'tkt_showcase', trigger: 'inquiry' },
    { from: 'tkt_discovery', to: 'tkt_conversion', trigger: 'booking', priority: 1 },
    { from: 'tkt_discovery', to: 'tkt_handoff', trigger: 'contact' },
    { from: 'tkt_showcase', to: 'tkt_conversion', trigger: 'booking', priority: 1 },
    { from: 'tkt_showcase', to: 'tkt_discovery', trigger: 'browsing' },
    { from: 'tkt_showcase', to: 'tkt_handoff', trigger: 'contact' },
    { from: 'tkt_conversion', to: 'tkt_handoff', trigger: 'contact' },
    // complaint escalation
    { from: 'tkt_discovery', to: 'tkt_handoff', trigger: 'complaint' },
    { from: 'tkt_showcase', to: 'tkt_handoff', trigger: 'complaint' },
    { from: 'tkt_conversion', to: 'tkt_handoff', trigger: 'complaint' },
  ],
};
