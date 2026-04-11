import { registerBlock } from '../../registry';

import ServicePackageBlock, { definition as servicePackageDef } from './service-package';
import ExpertProfileBlock, { definition as expertProfileDef } from './expert-profile';
import ConsultationBookingBlock, { definition as consultationBookingDef } from './consultation-booking';
import ProjectScopeBlock, { definition as projectScopeDef } from './project-scope';
import CaseStudyBlock, { definition as caseStudyDef } from './case-study';
import ProposalBlock, { definition as proposalDef } from './proposal';
import EngagementTimelineBlock, { definition as engagementTimelineDef } from './engagement-timeline';
import RetainerStatusBlock, { definition as retainerStatusDef } from './retainer-status';
import CredentialBadgeBlock, { definition as credentialBadgeDef } from './credential-badge';
import DocumentCollectorBlock, { definition as documentCollectorDef } from './document-collector';
import PropertyListingBlock, { definition as propertyListingDef } from './property-listing';
import ComplianceChecklistBlock, { definition as complianceChecklistDef } from './compliance-checklist';
import ClientReviewBlock, { definition as clientReviewDef } from './client-review';
import FeeCalculatorBlock, { definition as feeCalculatorDef } from './fee-calculator';

export function registerBusinessBlocks(): void {
  registerBlock(servicePackageDef, ServicePackageBlock);
  registerBlock(expertProfileDef, ExpertProfileBlock);
  registerBlock(consultationBookingDef, ConsultationBookingBlock);
  registerBlock(projectScopeDef, ProjectScopeBlock);
  registerBlock(caseStudyDef, CaseStudyBlock);
  registerBlock(proposalDef, ProposalBlock);
  registerBlock(engagementTimelineDef, EngagementTimelineBlock);
  registerBlock(retainerStatusDef, RetainerStatusBlock);
  registerBlock(credentialBadgeDef, CredentialBadgeBlock);
  registerBlock(documentCollectorDef, DocumentCollectorBlock);
  registerBlock(propertyListingDef, PropertyListingBlock);
  registerBlock(complianceChecklistDef, ComplianceChecklistBlock);
  registerBlock(clientReviewDef, ClientReviewBlock);
  registerBlock(feeCalculatorDef, FeeCalculatorBlock);
}

export {
  ServicePackageBlock, ExpertProfileBlock, ConsultationBookingBlock, ProjectScopeBlock,
  CaseStudyBlock, ProposalBlock, EngagementTimelineBlock, RetainerStatusBlock,
  CredentialBadgeBlock, DocumentCollectorBlock, PropertyListingBlock, ComplianceChecklistBlock,
  ClientReviewBlock, FeeCalculatorBlock,
};
