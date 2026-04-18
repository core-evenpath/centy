// Engagement flow template — community engagement.
//
// Covers: religious, community_association, cultural_institutions
// (the engagement side — booking side is handled by the booking
// flow template when active engine = booking).
//
// Conversion shape: event attendance confirmation, volunteer signup,
// or community-feedback submission. All in-chat.

import type { SystemFlowTemplate } from '@/lib/types-flow-engine';
import { defaultSettings } from '@/lib/flow-templates';

export const ENGAGEMENT_COMMUNITY_FLOW_TEMPLATE: SystemFlowTemplate = {
  id: 'engagement_tpl_community',
  name: 'Engagement Flow — Community / Religious',
  industryId: 'public_nonprofit',
  functionId: 'community_association',
  industryName: 'Public & Non-Profit',
  functionName: 'Community Engagement',
  description: 'Engagement-engine flow for community orgs, religious orgs, cultural institutions: event-present → volunteer-ask → signup-confirm → community-next-step.',
  engine: 'engagement',
  serviceIntentBreaks: ['track-donation', 'cancel-recurring', 'update-rsvp'],
  settings: defaultSettings(),
  stages: [
    { id: 'co_greeting', type: 'greeting', label: 'Welcome', blockTypes: ['greeting', 'suggestions'], intentTriggers: ['browsing', 'inquiry'], leadScoreImpact: 1, isEntry: true },
    { id: 'co_discovery', type: 'discovery', label: 'Events / Programs', blockTypes: ['pu_event_calendar', 'pu_program_card', 'pu_document_portal'], intentTriggers: ['browsing', 'inquiry'], leadScoreImpact: 2 },
    { id: 'co_showcase', type: 'showcase', label: 'Event Details', blockTypes: ['pu_program_card', 'pu_impact_report'], intentTriggers: ['pricing', 'inquiry'], leadScoreImpact: 3 },
    { id: 'co_conversion', type: 'conversion', label: 'Volunteer / RSVP / Donate', blockTypes: ['pu_volunteer', 'pu_donation', 'invite_rsvp'], intentTriggers: ['booking', 'schedule'], leadScoreImpact: 5 },
    { id: 'co_followup', type: 'followup', label: 'Community Update', blockTypes: ['pu_feedback', 'pu_impact_report'], intentTriggers: ['returning'], leadScoreImpact: 0 },
    { id: 'co_handoff', type: 'handoff', label: 'Contact', blockTypes: ['contact', 'pu_office_locator'], intentTriggers: ['contact', 'complaint', 'urgent'], leadScoreImpact: 0, isExit: true },
  ],
  transitions: [
    { from: 'co_greeting', to: 'co_discovery', trigger: 'browsing' },
    { from: 'co_greeting', to: 'co_discovery', trigger: 'inquiry' },
    { from: 'co_greeting', to: 'co_conversion', trigger: 'booking', priority: 1 },
    { from: 'co_greeting', to: 'co_handoff', trigger: 'contact' },
    { from: 'co_discovery', to: 'co_showcase', trigger: 'pricing' },
    { from: 'co_discovery', to: 'co_conversion', trigger: 'booking', priority: 1 },
    { from: 'co_discovery', to: 'co_handoff', trigger: 'contact' },
    { from: 'co_showcase', to: 'co_conversion', trigger: 'booking', priority: 1 },
    { from: 'co_showcase', to: 'co_handoff', trigger: 'contact' },
    { from: 'co_conversion', to: 'co_followup', trigger: 'returning' },
    { from: 'co_conversion', to: 'co_handoff', trigger: 'contact' },
    { from: 'co_followup', to: 'co_handoff', trigger: 'contact' },
    { from: 'co_discovery', to: 'co_handoff', trigger: 'complaint' },
    { from: 'co_showcase', to: 'co_handoff', trigger: 'complaint' },
    { from: 'co_conversion', to: 'co_handoff', trigger: 'complaint' },
  ],
};
