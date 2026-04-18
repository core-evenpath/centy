// Engagement flow template — subscription / RSVP.
//
// Covers: partners whose primary engagement surface is newsletter
// signup, event RSVP, or membership commitment (where the commitment
// itself is the conversion, not a payment).
//
// No dedicated functionId today — maps in via the index as a fallback
// for engagement-primary partners that don't fit nonprofit-charity or
// community-engagement. Also used by personal_wellness partners whose
// primary engagement surface is a `membership_tier` block.

import type { SystemFlowTemplate } from '@/lib/types-flow-engine';
import { defaultSettings } from '@/lib/flow-templates';

export const ENGAGEMENT_SUBSCRIPTION_RSVP_FLOW_TEMPLATE: SystemFlowTemplate = {
  id: 'engagement_tpl_subscription_rsvp',
  name: 'Engagement Flow — Subscription / RSVP',
  industryId: 'personal_wellness',
  functionId: 'membership_rsvp_generic',
  industryName: 'Community & Membership',
  functionName: 'Subscription / RSVP',
  description: 'Engagement-engine flow for subscription + RSVP partners: offer-present → rsvp-or-subscribe → confirmation → follow-up.',
  engine: 'engagement',
  serviceIntentBreaks: ['track-donation', 'cancel-recurring', 'update-rsvp'],
  settings: defaultSettings(),
  stages: [
    { id: 'sr_greeting', type: 'greeting', label: 'Welcome', blockTypes: ['greeting', 'suggestions'], intentTriggers: ['browsing', 'inquiry'], leadScoreImpact: 1, isEntry: true },
    { id: 'sr_discovery', type: 'discovery', label: 'Offers / Events', blockTypes: ['membership_tier', 'pu_event_calendar', 'loyalty_progress'], intentTriggers: ['browsing', 'inquiry'], leadScoreImpact: 2 },
    { id: 'sr_showcase', type: 'showcase', label: 'Tier Details', blockTypes: ['membership_tier', 'loyalty_progress'], intentTriggers: ['pricing', 'inquiry'], leadScoreImpact: 3 },
    { id: 'sr_conversion', type: 'conversion', label: 'Subscribe / RSVP', blockTypes: ['membership_tier', 'invite_rsvp', 'pu_volunteer'], intentTriggers: ['booking', 'schedule'], leadScoreImpact: 5 },
    { id: 'sr_followup', type: 'followup', label: 'Member Benefits', blockTypes: ['loyalty_progress', 'pu_feedback'], intentTriggers: ['returning'], leadScoreImpact: 0 },
    { id: 'sr_handoff', type: 'handoff', label: 'Contact', blockTypes: ['contact'], intentTriggers: ['contact', 'complaint', 'urgent'], leadScoreImpact: 0, isExit: true },
  ],
  transitions: [
    { from: 'sr_greeting', to: 'sr_discovery', trigger: 'browsing' },
    { from: 'sr_greeting', to: 'sr_conversion', trigger: 'booking', priority: 1 },
    { from: 'sr_greeting', to: 'sr_handoff', trigger: 'contact' },
    { from: 'sr_discovery', to: 'sr_showcase', trigger: 'pricing' },
    { from: 'sr_discovery', to: 'sr_conversion', trigger: 'booking', priority: 1 },
    { from: 'sr_discovery', to: 'sr_handoff', trigger: 'contact' },
    { from: 'sr_showcase', to: 'sr_conversion', trigger: 'booking', priority: 1 },
    { from: 'sr_showcase', to: 'sr_handoff', trigger: 'contact' },
    { from: 'sr_conversion', to: 'sr_followup', trigger: 'returning' },
    { from: 'sr_conversion', to: 'sr_handoff', trigger: 'contact' },
    { from: 'sr_followup', to: 'sr_handoff', trigger: 'contact' },
    { from: 'sr_discovery', to: 'sr_handoff', trigger: 'complaint' },
    { from: 'sr_showcase', to: 'sr_handoff', trigger: 'complaint' },
    { from: 'sr_conversion', to: 'sr_handoff', trigger: 'complaint' },
  ],
};
