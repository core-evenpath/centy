// Booking flow template — healthcare clinic / appointment sub-vertical.
//
// Covers healthcare booking functionIds: primary_care, dental_care,
// vision_care, mental_health, physical_therapy, alternative_medicine,
// home_healthcare, veterinary, diagnostic_imaging, hospitals.

import type { SystemFlowTemplate } from '@/lib/types-flow-engine';
import { defaultSettings } from '@/lib/flow-templates';

export const CLINIC_APPOINTMENT_FLOW_TEMPLATE: SystemFlowTemplate = {
  id: 'booking_tpl_clinic_appointment',
  name: 'Booking Flow — Clinic Appointment',
  industryId: 'healthcare_medical',
  functionId: 'primary_care',
  industryName: 'Healthcare & Medical Services',
  functionName: 'Clinic Appointment',
  description: 'Booking-engine flow for healthcare partners: services discovery, provider selection, intake, appointment.',
  engine: 'booking',
  serviceIntentBreaks: ['track-reservation', 'cancel-booking', 'modify-booking'],
  settings: defaultSettings({ showPromos: false }),
  stages: [
    {
      id: 'clin_greeting',
      type: 'greeting',
      label: 'Welcome',
      blockTypes: ['greeting', 'suggestions'],
      intentTriggers: ['browsing'],
      leadScoreImpact: 1,
      isEntry: true,
    },
    {
      id: 'clin_discovery',
      type: 'discovery',
      label: 'Services & Providers',
      blockTypes: ['wait_time'],
      intentTriggers: ['browsing', 'returning', 'inquiry'],
      leadScoreImpact: 2,
    },
    {
      id: 'clin_showcase',
      type: 'showcase',
      label: 'Options',
      blockTypes: ['telehealth'],
      intentTriggers: ['pricing', 'inquiry'],
      leadScoreImpact: 3,
    },
    {
      id: 'clin_conversion',
      type: 'conversion',
      label: 'Book Appointment',
      blockTypes: ['appointment', 'patient_intake', 'telehealth'],
      intentTriggers: ['booking', 'schedule'],
      leadScoreImpact: 5,
    },
    {
      id: 'clin_handoff',
      type: 'handoff',
      label: 'Contact Clinic',
      blockTypes: ['contact'],
      intentTriggers: ['contact', 'complaint', 'urgent'],
      leadScoreImpact: 0,
      isExit: true,
    },
  ],
  transitions: [
    { from: 'clin_greeting', to: 'clin_discovery', trigger: 'browsing' },
    { from: 'clin_greeting', to: 'clin_conversion', trigger: 'booking', priority: 1 },
    { from: 'clin_greeting', to: 'clin_handoff', trigger: 'urgent', priority: 2 },
    { from: 'clin_greeting', to: 'clin_handoff', trigger: 'contact' },
    { from: 'clin_discovery', to: 'clin_showcase', trigger: 'inquiry' },
    { from: 'clin_discovery', to: 'clin_conversion', trigger: 'booking', priority: 1 },
    { from: 'clin_discovery', to: 'clin_conversion', trigger: 'schedule' },
    { from: 'clin_discovery', to: 'clin_handoff', trigger: 'urgent', priority: 2 },
    { from: 'clin_discovery', to: 'clin_handoff', trigger: 'contact' },
    { from: 'clin_showcase', to: 'clin_conversion', trigger: 'booking', priority: 1 },
    { from: 'clin_showcase', to: 'clin_discovery', trigger: 'browsing' },
    { from: 'clin_showcase', to: 'clin_handoff', trigger: 'contact' },
    { from: 'clin_conversion', to: 'clin_handoff', trigger: 'contact' },
    // complaint escalation
    { from: 'clin_discovery', to: 'clin_handoff', trigger: 'complaint' },
    { from: 'clin_showcase', to: 'clin_handoff', trigger: 'complaint' },
    { from: 'clin_conversion', to: 'clin_handoff', trigger: 'complaint' },
  ],
};
