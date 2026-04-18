// Lead flow template — real estate / B2B high-ticket inquiries.
//
// Covers: real_estate, corporate_housing, corporate_events,
// event_venues (B2B slice), wedding_private, event_planning,
// photography_video, hosts_anchors, av_production,
// home_automation, painting_renovation, landscaping_gardening,
// carpentry_furniture, solar_renewable, security_surveillance,
// moving_relocation, visa_immigration, vehicle_sales_new,
// vehicle_sales_used, fleet_services, motorcycle_sales,
// auto_insurance, catering_events, construction_dev.
//
// High-ticket inquiry shape: browse listings / packages → compare →
// scheduled viewing/consultation → proposal → offline-close.

import type { SystemFlowTemplate } from '@/lib/types-flow-engine';
import { defaultSettings } from '@/lib/flow-templates';

export const LEAD_REAL_ESTATE_B2B_FLOW_TEMPLATE: SystemFlowTemplate = {
  id: 'lead_tpl_real_estate_b2b',
  name: 'Lead Flow — Real Estate / B2B',
  industryId: 'business_professional',
  functionId: 'real_estate',
  industryName: 'Real Estate & B2B',
  functionName: 'Real Estate B2B',
  description: 'Lead-engine flow for high-ticket inquiries: browse listings/packages → compare → viewing/consultation → proposal → offline-close.',
  engine: 'lead',
  serviceIntentBreaks: ['track-application', 'status-check', 'amend-application', 'withdraw-application'],
  settings: defaultSettings(),
  stages: [
    { id: 're_greeting', type: 'greeting', label: 'Welcome', blockTypes: ['greeting', 'suggestions'], intentTriggers: ['browsing', 'inquiry'], leadScoreImpact: 1, isEntry: true },
    { id: 're_discovery', type: 'discovery', label: 'Browse Listings', blockTypes: ['property_listing', 'service_package', 'event_package', 'evt_service_card', 'vendor_profile'], intentTriggers: ['browsing', 'inquiry'], leadScoreImpact: 2 },
    { id: 're_showcase', type: 'showcase', label: 'Details & Packages', blockTypes: ['evt_quote_builder', 'evt_equipment', 'mood_board', 'hp_estimate', 'hp_maintenance_plan', 'credential_badge'], intentTriggers: ['pricing', 'inquiry'], leadScoreImpact: 3 },
    { id: 're_comparison', type: 'comparison', label: 'Compare Options', blockTypes: ['compare', 'evt_portfolio', 'hp_before_after'], intentTriggers: ['comparing'], leadScoreImpact: 4 },
    { id: 're_conversion', type: 'conversion', label: 'Schedule Viewing / Proposal', blockTypes: ['consultation_booking', 'hp_scheduler', 'hp_service_request', 'proposal', 'document_collector'], intentTriggers: ['booking', 'schedule'], leadScoreImpact: 5 },
    { id: 're_followup', type: 'followup', label: 'Engagement Status', blockTypes: ['engagement_timeline', 'evt_timeline', 'document_collector'], intentTriggers: ['returning'], leadScoreImpact: 0 },
    { id: 're_handoff', type: 'handoff', label: 'Contact Broker', blockTypes: ['contact', 'expert_profile', 'vendor_profile'], intentTriggers: ['contact', 'complaint', 'urgent'], leadScoreImpact: 0, isExit: true },
  ],
  transitions: [
    { from: 're_greeting', to: 're_discovery', trigger: 'browsing' },
    { from: 're_greeting', to: 're_discovery', trigger: 'inquiry' },
    { from: 're_greeting', to: 're_handoff', trigger: 'contact' },
    { from: 're_discovery', to: 're_showcase', trigger: 'pricing' },
    { from: 're_discovery', to: 're_comparison', trigger: 'comparing' },
    { from: 're_discovery', to: 're_conversion', trigger: 'booking', priority: 1 },
    { from: 're_discovery', to: 're_handoff', trigger: 'contact' },
    { from: 're_showcase', to: 're_comparison', trigger: 'comparing' },
    { from: 're_showcase', to: 're_conversion', trigger: 'booking', priority: 1 },
    { from: 're_showcase', to: 're_handoff', trigger: 'contact' },
    { from: 're_comparison', to: 're_conversion', trigger: 'booking', priority: 1 },
    { from: 're_comparison', to: 're_handoff', trigger: 'contact' },
    { from: 're_conversion', to: 're_followup', trigger: 'returning' },
    { from: 're_conversion', to: 're_handoff', trigger: 'contact' },
    { from: 're_followup', to: 're_handoff', trigger: 'contact' },
    { from: 're_followup', to: 're_handoff', trigger: 'complaint' },
    { from: 're_discovery', to: 're_handoff', trigger: 'complaint' },
    { from: 're_showcase', to: 're_handoff', trigger: 'complaint' },
    { from: 're_conversion', to: 're_handoff', trigger: 'complaint' },
  ],
};
