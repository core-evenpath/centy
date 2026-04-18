// Lead flow template — financial services.
//
// Covers: retail_banking, alternative_lending, consumer_lending,
// commercial_lending, wealth_management, insurance_brokerage,
// accounting_tax, investment_trading, credit_debt, fintech,
// payments_processing, community_savings.
//
// Offline-closed: conversion ≠ transaction. Conversion here is
// "qualified application submitted" / "advisor contact accepted."
// Service overlay handles post-submission status-check, doc-amend,
// withdraw.

import type { SystemFlowTemplate } from '@/lib/types-flow-engine';
import { defaultSettings } from '@/lib/flow-templates';

export const LEAD_FINANCIAL_FLOW_TEMPLATE: SystemFlowTemplate = {
  id: 'lead_tpl_financial',
  name: 'Lead Flow — Financial Services',
  industryId: 'financial_services',
  functionId: 'wealth_management',
  industryName: 'Financial Services',
  functionName: 'Financial Services',
  description: 'Lead-engine flow for financial partners: inquiry → eligibility → application → doc-upload → offline-close.',
  engine: 'lead',
  serviceIntentBreaks: ['track-application', 'status-check', 'amend-application', 'withdraw-application'],
  settings: defaultSettings(),
  stages: [
    { id: 'fin_greeting', type: 'greeting', label: 'Welcome', blockTypes: ['greeting', 'suggestions'], intentTriggers: ['browsing', 'inquiry'], leadScoreImpact: 1, isEntry: true },
    { id: 'fin_discovery', type: 'discovery', label: 'Product Browse', blockTypes: ['fin_product_card', 'fin_advisor', 'fin_eligibility'], intentTriggers: ['browsing', 'inquiry'], leadScoreImpact: 2 },
    { id: 'fin_showcase', type: 'showcase', label: 'Details & Pricing', blockTypes: ['fin_loan_calc', 'fin_rate_compare', 'fin_insurance'], intentTriggers: ['pricing', 'inquiry'], leadScoreImpact: 3 },
    { id: 'fin_comparison', type: 'comparison', label: 'Compare Rates', blockTypes: ['fin_rate_compare'], intentTriggers: ['comparing'], leadScoreImpact: 4 },
    { id: 'fin_conversion', type: 'conversion', label: 'Apply & Upload Docs', blockTypes: ['fin_application', 'fin_doc_upload'], intentTriggers: ['booking', 'schedule'], leadScoreImpact: 5 },
    { id: 'fin_followup', type: 'followup', label: 'Application Status', blockTypes: ['fin_app_tracker', 'fin_account_snapshot'], intentTriggers: ['returning'], leadScoreImpact: 0 },
    { id: 'fin_handoff', type: 'handoff', label: 'Contact Advisor', blockTypes: ['contact', 'fin_advisor'], intentTriggers: ['contact', 'complaint', 'urgent'], leadScoreImpact: 0, isExit: true },
  ],
  transitions: [
    { from: 'fin_greeting', to: 'fin_discovery', trigger: 'browsing' },
    { from: 'fin_greeting', to: 'fin_discovery', trigger: 'inquiry' },
    { from: 'fin_greeting', to: 'fin_handoff', trigger: 'contact' },
    { from: 'fin_discovery', to: 'fin_showcase', trigger: 'pricing' },
    { from: 'fin_discovery', to: 'fin_comparison', trigger: 'comparing' },
    { from: 'fin_discovery', to: 'fin_conversion', trigger: 'booking', priority: 1 },
    { from: 'fin_discovery', to: 'fin_handoff', trigger: 'contact' },
    { from: 'fin_showcase', to: 'fin_comparison', trigger: 'comparing' },
    { from: 'fin_showcase', to: 'fin_conversion', trigger: 'booking', priority: 1 },
    { from: 'fin_showcase', to: 'fin_handoff', trigger: 'contact' },
    { from: 'fin_comparison', to: 'fin_conversion', trigger: 'booking', priority: 1 },
    { from: 'fin_comparison', to: 'fin_handoff', trigger: 'contact' },
    { from: 'fin_conversion', to: 'fin_followup', trigger: 'returning' },
    { from: 'fin_conversion', to: 'fin_handoff', trigger: 'contact' },
    { from: 'fin_followup', to: 'fin_handoff', trigger: 'contact' },
    { from: 'fin_followup', to: 'fin_handoff', trigger: 'complaint' },
    { from: 'fin_discovery', to: 'fin_handoff', trigger: 'complaint' },
    { from: 'fin_showcase', to: 'fin_handoff', trigger: 'complaint' },
    { from: 'fin_conversion', to: 'fin_handoff', trigger: 'complaint' },
  ],
};
