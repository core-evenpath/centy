// Booking flow template — airport transfer / ride sub-vertical.
//
// Covers travel ride-booking functionIds: airport_transfer, taxi_ride.

import type { SystemFlowTemplate } from '@/lib/types-flow-engine';
import { defaultSettings } from '@/lib/flow-templates';

export const AIRPORT_TRANSFER_FLOW_TEMPLATE: SystemFlowTemplate = {
  id: 'booking_tpl_airport_transfer',
  name: 'Booking Flow — Airport Transfer',
  industryId: 'travel_transport',
  functionId: 'airport_transfer',
  industryName: 'Travel, Transport & Logistics',
  functionName: 'Airport Transfer',
  description: 'Booking-engine flow for transfer/ride partners: trip discovery, vehicle tier, booking confirmation.',
  engine: 'booking',
  serviceIntentBreaks: ['track-reservation', 'cancel-booking', 'modify-booking'],
  settings: defaultSettings({ showPromos: false }),
  stages: [
    {
      id: 'tr_greeting',
      type: 'greeting',
      label: 'Welcome',
      blockTypes: ['greeting', 'suggestions'],
      intentTriggers: ['browsing'],
      leadScoreImpact: 1,
      isEntry: true,
    },
    {
      id: 'tr_discovery',
      type: 'discovery',
      label: 'Trip Options',
      blockTypes: ['tl_schedule_grid'],
      intentTriggers: ['browsing', 'returning'],
      leadScoreImpact: 2,
    },
    {
      id: 'tr_showcase',
      type: 'showcase',
      label: 'Vehicle & Rate',
      blockTypes: ['transfer_booking'],
      intentTriggers: ['pricing', 'inquiry'],
      leadScoreImpact: 3,
    },
    {
      id: 'tr_conversion',
      type: 'conversion',
      label: 'Book Transfer',
      blockTypes: ['transfer_booking', 'cart'],
      intentTriggers: ['booking'],
      leadScoreImpact: 5,
    },
    {
      id: 'tr_handoff',
      type: 'handoff',
      label: 'Contact Dispatch',
      blockTypes: ['contact'],
      intentTriggers: ['contact', 'complaint', 'urgent'],
      leadScoreImpact: 0,
      isExit: true,
    },
  ],
  transitions: [
    { from: 'tr_greeting', to: 'tr_discovery', trigger: 'browsing' },
    { from: 'tr_greeting', to: 'tr_conversion', trigger: 'booking', priority: 1 },
    { from: 'tr_greeting', to: 'tr_handoff', trigger: 'urgent', priority: 2 },
    { from: 'tr_greeting', to: 'tr_handoff', trigger: 'contact' },
    { from: 'tr_discovery', to: 'tr_showcase', trigger: 'pricing' },
    { from: 'tr_discovery', to: 'tr_showcase', trigger: 'inquiry' },
    { from: 'tr_discovery', to: 'tr_conversion', trigger: 'booking', priority: 1 },
    { from: 'tr_discovery', to: 'tr_handoff', trigger: 'urgent', priority: 2 },
    { from: 'tr_discovery', to: 'tr_handoff', trigger: 'contact' },
    { from: 'tr_showcase', to: 'tr_conversion', trigger: 'booking', priority: 1 },
    { from: 'tr_showcase', to: 'tr_discovery', trigger: 'browsing' },
    { from: 'tr_showcase', to: 'tr_handoff', trigger: 'contact' },
    { from: 'tr_conversion', to: 'tr_handoff', trigger: 'contact' },
    // complaint escalation
    { from: 'tr_discovery', to: 'tr_handoff', trigger: 'complaint' },
    { from: 'tr_showcase', to: 'tr_handoff', trigger: 'complaint' },
    { from: 'tr_conversion', to: 'tr_handoff', trigger: 'complaint' },
  ],
};
