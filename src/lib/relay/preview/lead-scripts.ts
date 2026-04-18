// Lead preview scripts (P2.lead.M08).
//
// 8 scripts per sub-vertical × 3 sub-verticals = 24 scripts.
// Themes identical across sub-verticals so reviewers can compare:
//   1. initial inquiry
//   2. eligibility check
//   3. document upload / collect
//   4. schedule consultation
//   5. receive proposal / quote
//   6. status check (service overlay — requires X01)
//   7. withdraw / cancel application (service overlay — requires X01)
//   8. sub-vertical edge case (multi-stakeholder, complex eligibility,
//      long-timeline follow-up)
//
// Reuses the `PreviewScript` shape from booking-scripts.ts for runner
// consistency. All turns static plain text; no templates / randoms /
// Date.now.

import type { PreviewScript as BookingPreviewScript } from './booking-scripts';

export type LeadSubVertical =
  | 'financial-services'
  | 'professional-services'
  | 'real-estate-b2b';

export interface LeadPreviewScript extends Omit<BookingPreviewScript, 'subVertical' | 'engine'> {
  engine: 'lead';
  subVertical: LeadSubVertical;
}

const T = (content: string) => ({ role: 'user' as const, content });

// ── Financial services ────────────────────────────────────────────────

const FINANCIAL_SCRIPTS: LeadPreviewScript[] = [
  {
    id: 'fin-01-inquiry',
    engine: 'lead',
    subVertical: 'financial-services',
    label: 'Initial inquiry',
    description: 'Visitor asks about available financial products',
    turns: [T('hi'), T('what loans do you offer'), T('tell me about personal loans')],
  },
  {
    id: 'fin-02-eligibility',
    engine: 'lead',
    subVertical: 'financial-services',
    label: 'Eligibility check',
    description: 'Visitor checks qualification criteria before applying',
    turns: [T('am i eligible for a personal loan'), T('what credit score do you need'), T('whats the minimum income')],
  },
  {
    id: 'fin-03-doc-upload',
    engine: 'lead',
    subVertical: 'financial-services',
    label: 'Document upload',
    description: 'Visitor asks what documents are needed for application',
    turns: [T('what documents do i need to apply'), T('can i upload them online'), T('do you need income proof')],
  },
  {
    id: 'fin-04-consult',
    engine: 'lead',
    subVertical: 'financial-services',
    label: 'Schedule consultation',
    description: 'Visitor books a discovery call with an advisor',
    turns: [T('i want to talk to an advisor'), T('schedule a discovery call'), T('are slots available this week')],
  },
  {
    id: 'fin-05-proposal',
    engine: 'lead',
    subVertical: 'financial-services',
    label: 'Get a quote',
    description: 'Visitor requests a personalized quote or rate comparison',
    turns: [T('get a quote for me'), T('what rate would i get'), T('compare with market')],
  },
  {
    id: 'fin-06-status',
    engine: 'lead',
    subVertical: 'financial-services',
    label: 'Application status (service break)',
    description: 'Returning visitor checks status of their submitted application',
    turns: [T('whats the status of my application'), T('has my loan been approved'), T('when will i hear back')],
  },
  {
    id: 'fin-07-withdraw',
    engine: 'lead',
    subVertical: 'financial-services',
    label: 'Withdraw application (service break)',
    description: 'Returning visitor withdraws their in-progress application',
    turns: [T('i want to withdraw my application'), T('can i cancel my loan request'), T('how do i stop the process')],
  },
  {
    id: 'fin-08-edge-multi-product',
    engine: 'lead',
    subVertical: 'financial-services',
    label: 'Edge: bundled products',
    description: 'Visitor evaluates account + loan + insurance as a bundle',
    turns: [T('i want an account and a loan'), T('and also life insurance'), T('can you bundle everything')],
  },
];

// ── Professional services ─────────────────────────────────────────────

const PROFESSIONAL_SCRIPTS: LeadPreviewScript[] = [
  {
    id: 'prof-01-inquiry',
    engine: 'lead',
    subVertical: 'professional-services',
    label: 'Initial inquiry',
    description: 'Visitor explores what services are offered',
    turns: [T('hi'), T('what services do you offer'), T('tell me about your legal services')],
  },
  {
    id: 'prof-02-scope',
    engine: 'lead',
    subVertical: 'professional-services',
    label: 'Project scope',
    description: 'Visitor describes their situation and gets scope recommendation',
    turns: [T('i need help with a contract review'), T('what would that involve'), T('how long does it take')],
  },
  {
    id: 'prof-03-docs',
    engine: 'lead',
    subVertical: 'professional-services',
    label: 'Document collection',
    description: 'Visitor asks what documents to share upfront',
    turns: [T('what should i send you'), T('can i upload documents'), T('do you need the contract first')],
  },
  {
    id: 'prof-04-consult',
    engine: 'lead',
    subVertical: 'professional-services',
    label: 'Schedule consultation',
    description: 'Visitor books a discovery call',
    turns: [T('schedule a discovery call'), T('i want to meet a consultant'), T('whats your availability')],
  },
  {
    id: 'prof-05-proposal',
    engine: 'lead',
    subVertical: 'professional-services',
    label: 'Request a proposal',
    description: 'Visitor requests a formal proposal with pricing',
    turns: [T('request a proposal'), T('how much will this cost'), T('send me a fee structure')],
  },
  {
    id: 'prof-06-status',
    engine: 'lead',
    subVertical: 'professional-services',
    label: 'Engagement status (service break)',
    description: 'Active client checks progress of their engagement',
    turns: [T('whats the status of my project'), T('where are we in the timeline'), T('any updates')],
  },
  {
    id: 'prof-07-amend',
    engine: 'lead',
    subVertical: 'professional-services',
    label: 'Amend engagement (service break)',
    description: 'Active client requests scope change mid-engagement',
    turns: [T('i want to change the scope'), T('can we amend the proposal'), T('add another deliverable')],
  },
  {
    id: 'prof-08-edge-retainer',
    engine: 'lead',
    subVertical: 'professional-services',
    label: 'Edge: retainer decision',
    description: 'Visitor evaluates fixed-scope project vs. monthly retainer',
    turns: [T('project or retainer which is better'), T('what is a retainer'), T('compare both options')],
  },
];

// ── Real estate / B2B high-ticket ─────────────────────────────────────

const REAL_ESTATE_SCRIPTS: LeadPreviewScript[] = [
  {
    id: 're-01-inquiry',
    engine: 'lead',
    subVertical: 'real-estate-b2b',
    label: 'Initial inquiry',
    description: 'Visitor browses available properties or packages',
    turns: [T('hi'), T('what properties are available'), T('show me office spaces')],
  },
  {
    id: 're-02-qualify',
    engine: 'lead',
    subVertical: 'real-estate-b2b',
    label: 'Requirement qualification',
    description: 'Visitor describes what they need and gets property matches',
    turns: [T('i need a 5000 sq ft office'), T('budget is 50 lakh'), T('in south mumbai')],
  },
  {
    id: 're-03-docs',
    engine: 'lead',
    subVertical: 'real-estate-b2b',
    label: 'Documentation',
    description: 'Visitor asks about paperwork needed for viewing / transaction',
    turns: [T('what documents do i need'), T('can i send them online'), T('how long is verification')],
  },
  {
    id: 're-04-viewing',
    engine: 'lead',
    subVertical: 'real-estate-b2b',
    label: 'Schedule viewing',
    description: 'Visitor schedules a property viewing / site visit',
    turns: [T('schedule a viewing'), T('when can i see the property'), T('weekend slots available')],
  },
  {
    id: 're-05-proposal',
    engine: 'lead',
    subVertical: 'real-estate-b2b',
    label: 'Request proposal',
    description: 'Visitor requests formal proposal with terms',
    turns: [T('get a quote'), T('send me the proposal'), T('whats the final price')],
  },
  {
    id: 're-06-status',
    engine: 'lead',
    subVertical: 'real-estate-b2b',
    label: 'Deal status (service break)',
    description: 'Active buyer checks deal progress',
    turns: [T('whats the status of my deal'), T('has the owner responded'), T('when do we sign')],
  },
  {
    id: 're-07-withdraw',
    engine: 'lead',
    subVertical: 'real-estate-b2b',
    label: 'Withdraw offer (service break)',
    description: 'Active buyer withdraws their offer / cancels viewing',
    turns: [T('i want to withdraw my offer'), T('cancel my viewing'), T('step away from the deal')],
  },
  {
    id: 're-08-edge-multi-party',
    engine: 'lead',
    subVertical: 'real-estate-b2b',
    label: 'Edge: multi-stakeholder decision',
    description: 'Visitor is an agent deciding with colleagues on a corporate lease',
    turns: [T('we are 3 partners deciding together'), T('can my colleague see the space too'), T('loop them into the discussion')],
  },
];

// ── Registry ──────────────────────────────────────────────────────────

export const LEAD_PREVIEW_SCRIPTS: readonly LeadPreviewScript[] = [
  ...FINANCIAL_SCRIPTS,
  ...PROFESSIONAL_SCRIPTS,
  ...REAL_ESTATE_SCRIPTS,
];

export function getLeadScriptsBySubVertical(
  subVertical: LeadSubVertical,
): LeadPreviewScript[] {
  return LEAD_PREVIEW_SCRIPTS.filter((s) => s.subVertical === subVertical);
}

export function getLeadScriptById(id: string): LeadPreviewScript | undefined {
  return LEAD_PREVIEW_SCRIPTS.find((s) => s.id === id);
}
