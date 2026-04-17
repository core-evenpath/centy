// Booking flow template — personal wellness appointment sub-vertical.
//
// Covers personal_wellness booking functionIds: hair_beauty, spa_wellness,
// fitness_gym, yoga_mindfulness, skin_aesthetic, cosmetic_surgery,
// wellness_retreat, personal_training, body_art.

import type { SystemFlowTemplate } from '@/lib/types-flow-engine';
import { defaultSettings } from '@/lib/flow-templates';

export const WELLNESS_APPOINTMENT_FLOW_TEMPLATE: SystemFlowTemplate = {
  id: 'booking_tpl_wellness_appointment',
  name: 'Booking Flow — Wellness Appointment',
  industryId: 'personal_wellness',
  functionId: 'hair_beauty',
  industryName: 'Personal Care & Wellness',
  functionName: 'Wellness Appointment',
  description: 'Booking-engine flow for wellness/salon/spa/gym partners: schedule browsing, class sign-up, intake, appointment.',
  engine: 'booking',
  serviceIntentBreaks: ['track-reservation', 'cancel-booking', 'modify-booking'],
  settings: defaultSettings(),
  stages: [
    {
      id: 'well_greeting',
      type: 'greeting',
      label: 'Welcome',
      blockTypes: ['greeting', 'suggestions'],
      intentTriggers: ['browsing'],
      leadScoreImpact: 1,
      isEntry: true,
    },
    {
      id: 'well_discovery',
      type: 'discovery',
      label: 'Schedule & Classes',
      blockTypes: ['class_schedule'],
      intentTriggers: ['browsing', 'returning', 'schedule'],
      leadScoreImpact: 2,
    },
    {
      id: 'well_showcase',
      type: 'showcase',
      label: 'Session Details',
      blockTypes: ['promo'],
      intentTriggers: ['pricing', 'inquiry'],
      leadScoreImpact: 3,
    },
    {
      id: 'well_conversion',
      type: 'conversion',
      label: 'Book Appointment',
      blockTypes: ['pw_appointment', 'intake_form', 'cart'],
      intentTriggers: ['booking'],
      leadScoreImpact: 5,
    },
    {
      id: 'well_handoff',
      type: 'handoff',
      label: 'Contact Studio',
      blockTypes: ['contact'],
      intentTriggers: ['contact', 'complaint', 'urgent'],
      leadScoreImpact: 0,
      isExit: true,
    },
  ],
  transitions: [
    { from: 'well_greeting', to: 'well_discovery', trigger: 'browsing' },
    { from: 'well_greeting', to: 'well_discovery', trigger: 'schedule' },
    { from: 'well_greeting', to: 'well_conversion', trigger: 'booking', priority: 1 },
    { from: 'well_greeting', to: 'well_handoff', trigger: 'contact' },
    { from: 'well_discovery', to: 'well_showcase', trigger: 'pricing' },
    { from: 'well_discovery', to: 'well_showcase', trigger: 'inquiry' },
    { from: 'well_discovery', to: 'well_conversion', trigger: 'booking', priority: 1 },
    { from: 'well_discovery', to: 'well_handoff', trigger: 'contact' },
    { from: 'well_showcase', to: 'well_conversion', trigger: 'booking', priority: 1 },
    { from: 'well_showcase', to: 'well_discovery', trigger: 'browsing' },
    { from: 'well_showcase', to: 'well_handoff', trigger: 'contact' },
    { from: 'well_conversion', to: 'well_handoff', trigger: 'contact' },
    // complaint escalation
    { from: 'well_discovery', to: 'well_handoff', trigger: 'complaint' },
    { from: 'well_showcase', to: 'well_handoff', trigger: 'complaint' },
    { from: 'well_conversion', to: 'well_handoff', trigger: 'complaint' },
  ],
};
