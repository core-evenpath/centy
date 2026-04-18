// Lead seed templates (P2.lead.M07).
//
// Hand-authored starter items for Lead-facing modules. Lead seeds are
// more subjective than Commerce (products have obvious shapes; advisors
// and case studies require writing that doesn't feel templated). Rules:
//   - No real names / addresses / PII.
//   - Plausible generic descriptions.
//   - Append-only: running the seed twice produces 2x items.
//   - Schema is authoritative: if the partner's module schema rejects a
//     field, the schema is wrong (same rule as Booking M15, Commerce M07).
//
// Module targets (5):
//   - moduleServices — service offerings (legal, consulting, financial)
//   - moduleAdvisors — expert / advisor profiles
//   - moduleEligibility — qualification criteria for applications
//   - moduleDocumentTypes — required documents per product
//   - moduleCaseStudies — anonymized success stories / client reviews
//
// Lead is offline-closed: every seed item leans toward "qualified
// handoff" shape rather than "transaction completed."

import type { SeedTemplate } from '../commerce/index';

export type { SeedTemplate };

// ── SERVICE OFFERINGS — 5 items, moduleServices ──────────────────────

export const SERVICES_SEED: SeedTemplate = {
  id: 'lead.services',
  label: 'Sample service offerings',
  description: '5 B2B service packages across scope tiers; demonstrates service_package + fee_calculator blocks',
  moduleSlug: 'moduleServices',
  items: [
    {
      name: 'Starter Advisory',
      description: 'Single-session discovery engagement. Suitable for first-time clients exploring a specific question.',
      category: 'advisory',
      price: 15000,
      currency: 'INR',
      images: [],
      fields: { scope: 'single-session', deliverables: '1-page summary + follow-up call', durationDays: 3 },
      sortOrder: 1,
      isActive: true,
    },
    {
      name: 'Monthly Retainer',
      description: 'Ongoing advisory relationship with fixed hours per month. Suits clients needing regular check-ins.',
      category: 'retainer',
      price: 80000,
      currency: 'INR',
      images: [],
      fields: { scope: 'monthly-recurring', hoursPerMonth: 10, cancellation: '30-day-notice' },
      sortOrder: 2,
      isActive: true,
    },
    {
      name: 'Project Engagement',
      description: 'Scoped deliverable over a defined timeline with milestone-based payments.',
      category: 'project',
      price: 250000,
      currency: 'INR',
      images: [],
      fields: { scope: 'fixed-scope', timelineWeeks: 8, milestones: 4 },
      sortOrder: 3,
      isActive: true,
    },
    {
      name: 'Enterprise Engagement',
      description: 'Multi-phase engagement for complex organizational needs. Includes team + leadership involvement.',
      category: 'enterprise',
      price: 800000,
      currency: 'INR',
      images: [],
      fields: { scope: 'multi-phase', timelineWeeks: 20, milestones: 6, teamSize: 3 },
      sortOrder: 4,
      isActive: true,
    },
    {
      name: 'Flagship Advisory',
      description: 'Executive-level strategic advisory with board-level access. Highest-touch engagement tier.',
      category: 'flagship',
      price: 2000000,
      currency: 'INR',
      images: [],
      fields: { scope: 'executive-strategic', timelineWeeks: 26, cadence: 'weekly-sessions' },
      sortOrder: 5,
      isActive: true,
    },
  ],
};

// ── ADVISORS — 5 items, moduleAdvisors ───────────────────────────────

export const ADVISORS_SEED: SeedTemplate = {
  id: 'lead.advisors',
  label: 'Sample advisor profiles',
  description: '5 expert / advisor profiles demonstrating expert_profile + fin_advisor blocks',
  moduleSlug: 'moduleAdvisors',
  items: [
    {
      name: 'Senior Advisor',
      description: '15+ years experience. Specialties in corporate strategy and financial planning.',
      category: 'senior',
      currency: 'INR',
      images: [],
      fields: { yearsExperience: 15, specialties: 'corporate-strategy, financial-planning', credentials: 'CFA' },
      sortOrder: 1,
      isActive: true,
    },
    {
      name: 'Associate Advisor',
      description: '5-10 years experience. Focused on SME clients and early-stage ventures.',
      category: 'associate',
      currency: 'INR',
      images: [],
      fields: { yearsExperience: 7, specialties: 'SME, early-stage', credentials: 'CA' },
      sortOrder: 2,
      isActive: true,
    },
    {
      name: 'Specialist Consultant',
      description: 'Domain specialist in regulatory compliance and risk advisory.',
      category: 'specialist',
      currency: 'INR',
      images: [],
      fields: { yearsExperience: 10, specialties: 'compliance, risk-advisory', credentials: 'CIA' },
      sortOrder: 3,
      isActive: true,
    },
    {
      name: 'Partner',
      description: 'Practice lead with 20+ years experience across enterprise engagements.',
      category: 'partner',
      currency: 'INR',
      images: [],
      fields: { yearsExperience: 22, specialties: 'enterprise-strategy, governance', credentials: 'CFA, MBA' },
      sortOrder: 4,
      isActive: true,
    },
    {
      name: 'Analyst',
      description: 'Entry-level team member supporting research and client deliverable preparation.',
      category: 'junior',
      currency: 'INR',
      images: [],
      fields: { yearsExperience: 2, specialties: 'research, modeling', credentials: 'MBA-candidate' },
      sortOrder: 5,
      isActive: true,
    },
  ],
};

// ── ELIGIBILITY — 5 items, moduleEligibility ─────────────────────────

export const ELIGIBILITY_SEED: SeedTemplate = {
  id: 'lead.eligibility',
  label: 'Sample eligibility criteria',
  description: '5 qualification entries for application products; demonstrates fin_eligibility + fin_application blocks',
  moduleSlug: 'moduleEligibility',
  items: [
    {
      name: 'Basic Account Eligibility',
      description: 'Minimum requirements for opening a standard savings or current account.',
      category: 'account-opening',
      currency: 'INR',
      images: [],
      fields: { minAge: 18, minBalance: 0, documentsRequired: 'ID-proof, address-proof' },
      sortOrder: 1,
      isActive: true,
    },
    {
      name: 'Personal Loan Eligibility',
      description: 'Criteria for unsecured personal loans up to 5 lakh.',
      category: 'unsecured-loan',
      currency: 'INR',
      images: [],
      fields: { minIncome: 25000, minCreditScore: 650, maxLoanAmount: 500000, tenureMonths: 60 },
      sortOrder: 2,
      isActive: true,
    },
    {
      name: 'Business Loan Eligibility',
      description: 'Working-capital line for small businesses with 2+ years operating history.',
      category: 'business-loan',
      currency: 'INR',
      images: [],
      fields: { minBusinessAgeMonths: 24, minAnnualRevenue: 2500000, maxLoanAmount: 5000000 },
      sortOrder: 3,
      isActive: true,
    },
    {
      name: 'Mortgage Eligibility',
      description: 'Home-loan qualification criteria with LTV limits.',
      category: 'mortgage',
      currency: 'INR',
      images: [],
      fields: { minIncome: 50000, maxLTV: 80, maxTenureYears: 25, minCreditScore: 700 },
      sortOrder: 4,
      isActive: true,
    },
    {
      name: 'Insurance Policy Eligibility',
      description: 'Standard life-insurance policy eligibility. Underwriting conditions apply.',
      category: 'life-insurance',
      currency: 'INR',
      images: [],
      fields: { minAge: 18, maxAgeAtEntry: 60, minSumAssured: 500000, medicalRequired: true },
      sortOrder: 5,
      isActive: true,
    },
  ],
};

// ── DOCUMENT TYPES — 5 items, moduleDocumentTypes ────────────────────

export const DOCUMENT_TYPES_SEED: SeedTemplate = {
  id: 'lead.document_types',
  label: 'Sample document requirements',
  description: '5 document-type entries for application flows; demonstrates fin_doc_upload + document_collector',
  moduleSlug: 'moduleDocumentTypes',
  items: [
    {
      name: 'Government ID',
      description: 'Any valid government-issued photo identification.',
      category: 'identity',
      currency: 'INR',
      images: [],
      fields: { formats: 'PDF, JPG, PNG', maxSizeMB: 5, requiredFor: 'all-applications' },
      sortOrder: 1,
      isActive: true,
    },
    {
      name: 'Address Proof',
      description: 'Recent utility bill, rental agreement, or official correspondence showing address.',
      category: 'address',
      currency: 'INR',
      images: [],
      fields: { formats: 'PDF, JPG', maxSizeMB: 5, validityDays: 90 },
      sortOrder: 2,
      isActive: true,
    },
    {
      name: 'Income Proof',
      description: 'Salary slips, ITR, or 3-month bank statements showing income flow.',
      category: 'income',
      currency: 'INR',
      images: [],
      fields: { formats: 'PDF', maxSizeMB: 10, requiredFor: 'loan-applications', lookbackMonths: 3 },
      sortOrder: 3,
      isActive: true,
    },
    {
      name: 'Business Registration',
      description: 'Certificate of incorporation, partnership deed, or proprietorship declaration.',
      category: 'business',
      currency: 'INR',
      images: [],
      fields: { formats: 'PDF', maxSizeMB: 10, requiredFor: 'business-loans, commercial-accounts' },
      sortOrder: 4,
      isActive: true,
    },
    {
      name: 'Medical Report',
      description: 'Recent medical examination report for insurance underwriting.',
      category: 'medical',
      currency: 'INR',
      images: [],
      fields: { formats: 'PDF', maxSizeMB: 15, requiredFor: 'life-insurance', validityDays: 180 },
      sortOrder: 5,
      isActive: true,
    },
  ],
};

// ── CASE STUDIES — 5 items, moduleCaseStudies ────────────────────────

export const CASE_STUDIES_SEED: SeedTemplate = {
  id: 'lead.case_studies',
  label: 'Sample case studies',
  description: '5 anonymized engagement outcomes; demonstrates case_study + client_review blocks',
  moduleSlug: 'moduleCaseStudies',
  items: [
    {
      name: 'Manufacturing SME Turnaround',
      description: 'Mid-sized manufacturer rebuilt cash-flow forecasting after two quarters of losses. Achieved positive working capital within six months.',
      category: 'turnaround',
      currency: 'INR',
      images: [],
      fields: { industry: 'manufacturing', durationMonths: 6, engagementType: 'advisory', outcomeTag: 'cash-flow-restored' },
      sortOrder: 1,
      isActive: true,
    },
    {
      name: 'Tech Startup Scale-Up',
      description: 'Series-A SaaS company structured go-to-market for expansion into two new geographies. Revenue doubled in 12 months.',
      category: 'scale-up',
      currency: 'INR',
      images: [],
      fields: { industry: 'technology', durationMonths: 12, engagementType: 'strategic', outcomeTag: 'revenue-doubled' },
      sortOrder: 2,
      isActive: true,
    },
    {
      name: 'Retail Chain Restructuring',
      description: 'Regional retail chain optimized store-level P&L. Closed underperforming outlets, improved overall margin by 8 percentage points.',
      category: 'operational',
      currency: 'INR',
      images: [],
      fields: { industry: 'retail', durationMonths: 9, engagementType: 'operational', outcomeTag: 'margin-improved' },
      sortOrder: 3,
      isActive: true,
    },
    {
      name: 'Family Office Structuring',
      description: 'Multi-generation family office established governance framework. Resolved succession ambiguity, aligned investment mandate.',
      category: 'governance',
      currency: 'INR',
      images: [],
      fields: { industry: 'family-office', durationMonths: 4, engagementType: 'governance', outcomeTag: 'succession-resolved' },
      sortOrder: 4,
      isActive: true,
    },
    {
      name: 'Non-Profit Capacity Building',
      description: 'Mid-sized NGO improved grant-writing capability and financial reporting. Grant revenue increased by 40 percent in the following cycle.',
      category: 'capacity',
      currency: 'INR',
      images: [],
      fields: { industry: 'non-profit', durationMonths: 8, engagementType: 'capacity-building', outcomeTag: 'grant-revenue-up' },
      sortOrder: 5,
      isActive: true,
    },
  ],
};

// ── Registry ────────────────────────────────────────────────────────

export const LEAD_SEED_TEMPLATES: Readonly<Record<string, SeedTemplate>> = {
  [SERVICES_SEED.id]: SERVICES_SEED,
  [ADVISORS_SEED.id]: ADVISORS_SEED,
  [ELIGIBILITY_SEED.id]: ELIGIBILITY_SEED,
  [DOCUMENT_TYPES_SEED.id]: DOCUMENT_TYPES_SEED,
  [CASE_STUDIES_SEED.id]: CASE_STUDIES_SEED,
};

export function getLeadSeedTemplate(id: string): SeedTemplate | undefined {
  return LEAD_SEED_TEMPLATES[id];
}

export function listLeadSeedTemplates(): SeedTemplate[] {
  return Object.values(LEAD_SEED_TEMPLATES);
}
