// Lead flow template — professional services.
//
// Covers: legal_services, consulting_advisory, architecture_design,
// hr_recruitment, marketing_advertising, software_it, pr_communications,
// accounting_tax (professional side), construction_dev.
//
// Offline-closed: conversion is "signed proposal" or "discovery call
// booked." Service overlay handles retainer burn-down check, project
// status, document amendments.

import type { SystemFlowTemplate } from '@/lib/types-flow-engine';
import { defaultSettings } from '@/lib/flow-templates';

export const LEAD_PROFESSIONAL_FLOW_TEMPLATE: SystemFlowTemplate = {
  id: 'lead_tpl_professional',
  name: 'Lead Flow — Professional Services',
  industryId: 'business_professional',
  functionId: 'consulting_advisory',
  industryName: 'Business & Professional Services',
  functionName: 'Professional Services',
  description: 'Lead-engine flow for B2B services: inquiry → scope → proposal → consultation-booking → offline-close.',
  engine: 'lead',
  serviceIntentBreaks: ['track-application', 'status-check', 'amend-application', 'withdraw-application'],
  settings: defaultSettings(),
  stages: [
    { id: 'ps_greeting', type: 'greeting', label: 'Welcome', blockTypes: ['greeting', 'suggestions'], intentTriggers: ['browsing', 'inquiry'], leadScoreImpact: 1, isEntry: true },
    { id: 'ps_discovery', type: 'discovery', label: 'Services & Experts', blockTypes: ['service_package', 'expert_profile', 'case_study'], intentTriggers: ['browsing', 'inquiry'], leadScoreImpact: 2 },
    { id: 'ps_showcase', type: 'showcase', label: 'Scope & Pricing', blockTypes: ['project_scope', 'proposal', 'fee_calculator', 'credential_badge'], intentTriggers: ['pricing', 'inquiry'], leadScoreImpact: 3 },
    { id: 'ps_social_proof', type: 'social_proof', label: 'Case Studies & Reviews', blockTypes: ['case_study', 'client_review'], intentTriggers: ['comparing'], leadScoreImpact: 4 },
    { id: 'ps_conversion', type: 'conversion', label: 'Book Consultation', blockTypes: ['consultation_booking', 'proposal', 'document_collector'], intentTriggers: ['booking', 'schedule'], leadScoreImpact: 5 },
    { id: 'ps_followup', type: 'followup', label: 'Engagement Status', blockTypes: ['engagement_timeline', 'retainer_status', 'document_collector'], intentTriggers: ['returning'], leadScoreImpact: 0 },
    { id: 'ps_handoff', type: 'handoff', label: 'Contact Team', blockTypes: ['contact', 'expert_profile'], intentTriggers: ['contact', 'complaint', 'urgent'], leadScoreImpact: 0, isExit: true },
  ],
  transitions: [
    { from: 'ps_greeting', to: 'ps_discovery', trigger: 'browsing' },
    { from: 'ps_greeting', to: 'ps_discovery', trigger: 'inquiry' },
    { from: 'ps_greeting', to: 'ps_handoff', trigger: 'contact' },
    { from: 'ps_discovery', to: 'ps_showcase', trigger: 'pricing' },
    { from: 'ps_discovery', to: 'ps_social_proof', trigger: 'comparing' },
    { from: 'ps_discovery', to: 'ps_conversion', trigger: 'booking', priority: 1 },
    { from: 'ps_discovery', to: 'ps_handoff', trigger: 'contact' },
    { from: 'ps_showcase', to: 'ps_social_proof', trigger: 'comparing' },
    { from: 'ps_showcase', to: 'ps_conversion', trigger: 'booking', priority: 1 },
    { from: 'ps_showcase', to: 'ps_handoff', trigger: 'contact' },
    { from: 'ps_social_proof', to: 'ps_conversion', trigger: 'booking', priority: 1 },
    { from: 'ps_social_proof', to: 'ps_handoff', trigger: 'contact' },
    { from: 'ps_conversion', to: 'ps_followup', trigger: 'returning' },
    { from: 'ps_conversion', to: 'ps_handoff', trigger: 'contact' },
    { from: 'ps_followup', to: 'ps_handoff', trigger: 'contact' },
    { from: 'ps_followup', to: 'ps_handoff', trigger: 'complaint' },
    { from: 'ps_discovery', to: 'ps_handoff', trigger: 'complaint' },
    { from: 'ps_showcase', to: 'ps_handoff', trigger: 'complaint' },
    { from: 'ps_conversion', to: 'ps_handoff', trigger: 'complaint' },
  ],
};
