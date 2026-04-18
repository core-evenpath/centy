// Lead flow templates registry (P2.lead.M03).
//
// Keyed by `functionId`. Mirrors the Commerce flow-templates registry
// from Session 1 and the Booking registry from Phase 1.

import type { SystemFlowTemplate } from '@/lib/types-flow-engine';
import { LEAD_FINANCIAL_FLOW_TEMPLATE } from './financial-services';
import { LEAD_PROFESSIONAL_FLOW_TEMPLATE } from './professional-services';
import { LEAD_REAL_ESTATE_B2B_FLOW_TEMPLATE } from './real-estate-b2b';

export {
  LEAD_FINANCIAL_FLOW_TEMPLATE,
  LEAD_PROFESSIONAL_FLOW_TEMPLATE,
  LEAD_REAL_ESTATE_B2B_FLOW_TEMPLATE,
};

export const LEAD_FLOW_TEMPLATES: Readonly<Record<string, SystemFlowTemplate>> = {
  // Financial services (12)
  retail_banking:       LEAD_FINANCIAL_FLOW_TEMPLATE,
  alternative_lending:  LEAD_FINANCIAL_FLOW_TEMPLATE,
  consumer_lending:     LEAD_FINANCIAL_FLOW_TEMPLATE,
  commercial_lending:   LEAD_FINANCIAL_FLOW_TEMPLATE,
  payments_processing:  LEAD_FINANCIAL_FLOW_TEMPLATE,
  wealth_management:    LEAD_FINANCIAL_FLOW_TEMPLATE,
  insurance_brokerage:  LEAD_FINANCIAL_FLOW_TEMPLATE,
  accounting_tax:       LEAD_PROFESSIONAL_FLOW_TEMPLATE,
  investment_trading:   LEAD_FINANCIAL_FLOW_TEMPLATE,
  credit_debt:          LEAD_FINANCIAL_FLOW_TEMPLATE,
  fintech:              LEAD_FINANCIAL_FLOW_TEMPLATE,
  community_savings:    LEAD_FINANCIAL_FLOW_TEMPLATE,
  auto_insurance:       LEAD_FINANCIAL_FLOW_TEMPLATE,

  // Education (9) — education is lead + info primarily; use professional
  // template as closest fit (academic counseling is consulting-shaped)
  early_childhood:      LEAD_PROFESSIONAL_FLOW_TEMPLATE,
  k12_education:        LEAD_PROFESSIONAL_FLOW_TEMPLATE,
  higher_education:     LEAD_PROFESSIONAL_FLOW_TEMPLATE,
  test_preparation:     LEAD_PROFESSIONAL_FLOW_TEMPLATE,
  language_learning:    LEAD_PROFESSIONAL_FLOW_TEMPLATE,
  skill_vocational:     LEAD_PROFESSIONAL_FLOW_TEMPLATE,
  corporate_training:   LEAD_PROFESSIONAL_FLOW_TEMPLATE,
  academic_counseling:  LEAD_PROFESSIONAL_FLOW_TEMPLATE,
  creative_arts:        LEAD_PROFESSIONAL_FLOW_TEMPLATE,

  // Professional services (9)
  real_estate:          LEAD_REAL_ESTATE_B2B_FLOW_TEMPLATE,
  construction_dev:     LEAD_REAL_ESTATE_B2B_FLOW_TEMPLATE,
  legal_services:       LEAD_PROFESSIONAL_FLOW_TEMPLATE,
  architecture_design:  LEAD_REAL_ESTATE_B2B_FLOW_TEMPLATE,
  hr_recruitment:       LEAD_PROFESSIONAL_FLOW_TEMPLATE,
  marketing_advertising:LEAD_PROFESSIONAL_FLOW_TEMPLATE,
  software_it:          LEAD_PROFESSIONAL_FLOW_TEMPLATE,
  consulting_advisory:  LEAD_PROFESSIONAL_FLOW_TEMPLATE,
  pr_communications:    LEAD_PROFESSIONAL_FLOW_TEMPLATE,

  // F&B lead: catering events
  catering_events:      LEAD_REAL_ESTATE_B2B_FLOW_TEMPLATE,

  // Automotive lead-primary (5)
  vehicle_sales_new:    LEAD_REAL_ESTATE_B2B_FLOW_TEMPLATE,
  vehicle_sales_used:   LEAD_REAL_ESTATE_B2B_FLOW_TEMPLATE,
  fleet_services:       LEAD_REAL_ESTATE_B2B_FLOW_TEMPLATE,
  motorcycle_sales:     LEAD_REAL_ESTATE_B2B_FLOW_TEMPLATE,

  // Travel / logistics (2)
  moving_relocation:    LEAD_REAL_ESTATE_B2B_FLOW_TEMPLATE,
  visa_immigration:     LEAD_PROFESSIONAL_FLOW_TEMPLATE,

  // Events / entertainment (6)
  event_planning:       LEAD_REAL_ESTATE_B2B_FLOW_TEMPLATE,
  wedding_private:      LEAD_REAL_ESTATE_B2B_FLOW_TEMPLATE,
  corporate_events:     LEAD_REAL_ESTATE_B2B_FLOW_TEMPLATE,
  photography_video:    LEAD_REAL_ESTATE_B2B_FLOW_TEMPLATE,
  hosts_anchors:        LEAD_PROFESSIONAL_FLOW_TEMPLATE,
  av_production:        LEAD_REAL_ESTATE_B2B_FLOW_TEMPLATE,

  // Home / property (6)
  painting_renovation:  LEAD_REAL_ESTATE_B2B_FLOW_TEMPLATE,
  landscaping_gardening:LEAD_REAL_ESTATE_B2B_FLOW_TEMPLATE,
  home_automation:      LEAD_REAL_ESTATE_B2B_FLOW_TEMPLATE,
  carpentry_furniture:  LEAD_REAL_ESTATE_B2B_FLOW_TEMPLATE,
  solar_renewable:      LEAD_PROFESSIONAL_FLOW_TEMPLATE,
  security_surveillance:LEAD_PROFESSIONAL_FLOW_TEMPLATE,
};

export function getLeadFlowTemplate(
  functionId: string | null | undefined,
): SystemFlowTemplate | null {
  if (!functionId) return null;
  return LEAD_FLOW_TEMPLATES[functionId] ?? null;
}
