// Engagement flow templates registry (P2.engagement.M03).
//
// Mirrors the Commerce + Lead registries. Engagement is the first
// engine where many partners have no Service overlay by design
// (Adjustment 3 / service-exception class). The templates still list
// serviceIntentBreaks for partners that DO have service enabled; the
// recipe determines whether service is active for any given partner.

import type { SystemFlowTemplate } from '@/lib/types-flow-engine';
import { ENGAGEMENT_NONPROFIT_FLOW_TEMPLATE } from './nonprofit-charity';
import { ENGAGEMENT_COMMUNITY_FLOW_TEMPLATE } from './community-engagement';
import { ENGAGEMENT_SUBSCRIPTION_RSVP_FLOW_TEMPLATE } from './subscription-rsvp';

export {
  ENGAGEMENT_NONPROFIT_FLOW_TEMPLATE,
  ENGAGEMENT_COMMUNITY_FLOW_TEMPLATE,
  ENGAGEMENT_SUBSCRIPTION_RSVP_FLOW_TEMPLATE,
};

export const ENGAGEMENT_FLOW_TEMPLATES: Readonly<Record<string, SystemFlowTemplate>> = {
  // Engagement-primary functionIds from the recipe (4)
  ngo_nonprofit:          ENGAGEMENT_NONPROFIT_FLOW_TEMPLATE,
  religious:              ENGAGEMENT_COMMUNITY_FLOW_TEMPLATE,
  cultural_institutions:  ENGAGEMENT_COMMUNITY_FLOW_TEMPLATE,
  community_association:  ENGAGEMENT_COMMUNITY_FLOW_TEMPLATE,

  // Engagement-secondary (lead-primary with engagement overlay)
  community_savings:      ENGAGEMENT_SUBSCRIPTION_RSVP_FLOW_TEMPLATE,

  // Info-primary with engagement overlay (government consultations,
  // town halls route through engagement)
  government:             ENGAGEMENT_COMMUNITY_FLOW_TEMPLATE,
};

export function getEngagementFlowTemplate(
  functionId: string | null | undefined,
): SystemFlowTemplate | null {
  if (!functionId) return null;
  return ENGAGEMENT_FLOW_TEMPLATES[functionId] ?? null;
}
