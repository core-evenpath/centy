// Engagement flow template — nonprofit / charity.
//
// Covers: ngo_nonprofit. Also applies (via index mapping) to any
// nonprofit-shaped partner regardless of primary engine.
//
// Conversion shape (Adjustment 5): in-chat commitment, no transactional
// state to hold between turns. Donation confirm → receipt shown;
// no cart, no checkout, no offline-close.
//
// Service overlay: OPTIONAL. Service-exception partners (Adjustment 3)
// skip the service intent routing; partners with recurring-donation
// tracking opt in via partner.engines including 'service'. The template
// still lists serviceIntentBreaks so that partners WHO DO have service
// get correct routing; it's the recipe that gates whether service is
// included at all for a given partner.

import type { SystemFlowTemplate } from '@/lib/types-flow-engine';
import { defaultSettings } from '@/lib/flow-templates';

export const ENGAGEMENT_NONPROFIT_FLOW_TEMPLATE: SystemFlowTemplate = {
  id: 'engagement_tpl_nonprofit',
  name: 'Engagement Flow — Nonprofit / Charity',
  industryId: 'public_nonprofit',
  functionId: 'ngo_nonprofit',
  industryName: 'Public & Non-Profit',
  functionName: 'Nonprofit / Charity',
  description: 'Engagement-engine flow: mission-present → donation-ask → donation-confirm → impact-receipt.',
  engine: 'engagement',
  serviceIntentBreaks: ['track-donation', 'cancel-recurring', 'update-rsvp'],
  settings: defaultSettings(),
  // Canonical stage order: greeting → discovery → showcase → comparison
  // → conversion → followup → handoff. Nonprofit flows skip `comparison`
  // (you don't compare causes; you just give). Stages are left in
  // canonical order; comparison just isn't instantiated.
  stages: [
    { id: 'np_greeting', type: 'greeting', label: 'Welcome', blockTypes: ['greeting', 'suggestions'], intentTriggers: ['browsing', 'inquiry'], leadScoreImpact: 1, isEntry: true },
    { id: 'np_discovery', type: 'discovery', label: 'Mission / Programs', blockTypes: ['pu_program_card', 'pu_event_calendar', 'pu_impact_report'], intentTriggers: ['browsing', 'inquiry'], leadScoreImpact: 2 },
    { id: 'np_showcase', type: 'showcase', label: 'Impact Details', blockTypes: ['pu_impact_report', 'pu_program_card'], intentTriggers: ['pricing', 'inquiry'], leadScoreImpact: 3 },
    { id: 'np_conversion', type: 'conversion', label: 'Donate / Volunteer', blockTypes: ['pu_donation', 'pu_volunteer'], intentTriggers: ['booking', 'schedule'], leadScoreImpact: 5 },
    { id: 'np_followup', type: 'followup', label: 'Thank You / Impact', blockTypes: ['pu_impact_report', 'pu_feedback'], intentTriggers: ['returning'], leadScoreImpact: 0 },
    { id: 'np_handoff', type: 'handoff', label: 'Contact', blockTypes: ['contact'], intentTriggers: ['contact', 'complaint', 'urgent'], leadScoreImpact: 0, isExit: true },
  ],
  transitions: [
    { from: 'np_greeting', to: 'np_discovery', trigger: 'browsing' },
    { from: 'np_greeting', to: 'np_discovery', trigger: 'inquiry' },
    { from: 'np_greeting', to: 'np_conversion', trigger: 'booking', priority: 1 },
    { from: 'np_greeting', to: 'np_handoff', trigger: 'contact' },
    { from: 'np_discovery', to: 'np_showcase', trigger: 'pricing' },
    { from: 'np_discovery', to: 'np_conversion', trigger: 'booking', priority: 1 },
    { from: 'np_discovery', to: 'np_handoff', trigger: 'contact' },
    { from: 'np_showcase', to: 'np_conversion', trigger: 'booking', priority: 1 },
    { from: 'np_showcase', to: 'np_handoff', trigger: 'contact' },
    { from: 'np_conversion', to: 'np_followup', trigger: 'returning' },
    { from: 'np_conversion', to: 'np_handoff', trigger: 'contact' },
    { from: 'np_followup', to: 'np_handoff', trigger: 'contact' },
    { from: 'np_discovery', to: 'np_handoff', trigger: 'complaint' },
    { from: 'np_showcase', to: 'np_handoff', trigger: 'complaint' },
    { from: 'np_conversion', to: 'np_handoff', trigger: 'complaint' },
  ],
};
