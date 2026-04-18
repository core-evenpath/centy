// Engagement seed templates (P2.engagement.M07).
//
// Hand-authored starter items for Engagement-facing modules. Same
// discipline as Lead M07: no real org names / PII / addresses; generic
// plausible descriptions; schema is authoritative; append-only.
//
// Module targets:
//   - moduleCampaigns     — donation campaigns, volunteer drives
//   - moduleEvents        — RSVP events (engagement-primary)
//   - moduleImpactStories — case studies, testimonials for nonprofits
//   - moduleMemberships   — subscription tiers, community memberships
//   - moduleCauses        — program-card content for nonprofit categories

import type { SeedTemplate } from '../commerce/index';

export type { SeedTemplate };

// ── CAMPAIGNS — 5 items, moduleCampaigns ────────────────────────────

export const CAMPAIGNS_SEED: SeedTemplate = {
  id: 'engagement.campaigns',
  label: 'Sample campaigns',
  description: '5 donation / volunteer campaign entries demonstrating pu_program_card + pu_donation blocks',
  moduleSlug: 'moduleCampaigns',
  items: [
    {
      name: 'Year-End Giving Drive',
      description: 'Annual year-end fundraising drive with matching-gift option.',
      category: 'fundraising',
      currency: 'INR',
      images: [],
      fields: { campaignType: 'donation', goalAmount: 1000000, matchingGift: true, durationWeeks: 8 },
      sortOrder: 1,
      isActive: true,
    },
    {
      name: 'Monthly Giving Circle',
      description: 'Recurring-donor program with impact reports and community access.',
      category: 'recurring',
      currency: 'INR',
      images: [],
      fields: { campaignType: 'recurring-donation', minMonthly: 500, reportFrequency: 'quarterly' },
      sortOrder: 2,
      isActive: true,
    },
    {
      name: 'Weekend Volunteer Drive',
      description: 'One-weekend volunteer opportunity; open registration with roles listed.',
      category: 'volunteer',
      currency: 'INR',
      images: [],
      fields: { campaignType: 'volunteer', eventDate: 'saturday', rolesAvailable: 8, duration: 'single-weekend' },
      sortOrder: 3,
      isActive: true,
    },
    {
      name: 'Sponsor a Program',
      description: 'Sponsor specific program funding — allocate donation to preferred cause.',
      category: 'sponsorship',
      currency: 'INR',
      images: [],
      fields: { campaignType: 'designated-giving', minAmount: 10000, maxAmount: 500000 },
      sortOrder: 4,
      isActive: true,
    },
    {
      name: 'Capital Campaign',
      description: 'Multi-year campaign for infrastructure / major initiative.',
      category: 'capital',
      currency: 'INR',
      images: [],
      fields: { campaignType: 'capital', goalAmount: 10000000, durationYears: 3 },
      sortOrder: 5,
      isActive: true,
    },
  ],
};

// ── EVENTS — 5 items, moduleEvents ──────────────────────────────────

export const EVENTS_SEED: SeedTemplate = {
  id: 'engagement.events',
  label: 'Sample events',
  description: '5 engagement-facing events (fundraisers, community meetings, volunteer days)',
  moduleSlug: 'moduleEvents',
  items: [
    {
      name: 'Community Town Hall',
      description: 'Quarterly open meeting for community members to share feedback with staff.',
      category: 'community',
      currency: 'INR',
      images: [],
      fields: { eventType: 'town-hall', duration: '2-hours', capacity: 150, rsvpRequired: true },
      sortOrder: 1,
      isActive: true,
    },
    {
      name: 'Annual Gala Fundraiser',
      description: 'Evening fundraiser with dinner and program. Attendance supports organization.',
      category: 'fundraiser',
      currency: 'INR',
      images: [],
      fields: { eventType: 'fundraiser', ticketPrice: 5000, capacity: 200, blackTie: true },
      sortOrder: 2,
      isActive: true,
    },
    {
      name: 'Volunteer Orientation',
      description: 'Monthly onboarding for new volunteers; overview of programs and expectations.',
      category: 'volunteer',
      currency: 'INR',
      images: [],
      fields: { eventType: 'orientation', duration: '90-minutes', frequency: 'monthly' },
      sortOrder: 3,
      isActive: true,
    },
    {
      name: 'Cultural Festival',
      description: 'Annual cultural festival with performances, food, and family activities. Free entry.',
      category: 'festival',
      currency: 'INR',
      images: [],
      fields: { eventType: 'festival', duration: 'full-day', capacity: 2000, freeEntry: true },
      sortOrder: 4,
      isActive: true,
    },
    {
      name: 'Membership Meeting',
      description: 'Quarterly members-only strategy and update session.',
      category: 'members-only',
      currency: 'INR',
      images: [],
      fields: { eventType: 'meeting', duration: '90-minutes', membersOnly: true },
      sortOrder: 5,
      isActive: true,
    },
  ],
};

// ── IMPACT STORIES — 5 items, moduleImpactStories ───────────────────

export const IMPACT_STORIES_SEED: SeedTemplate = {
  id: 'engagement.impact_stories',
  label: 'Sample impact stories',
  description: '5 anonymized impact narratives; demonstrates pu_impact_report + program-card blocks',
  moduleSlug: 'moduleImpactStories',
  items: [
    {
      name: 'School Library Refurbishment',
      description: 'Donor funding restored reading materials and furniture for a rural primary school library.',
      category: 'education',
      currency: 'INR',
      images: [],
      fields: { impactArea: 'education', beneficiaries: 450, year: 2024, outcomeTag: 'library-restored' },
      sortOrder: 1,
      isActive: true,
    },
    {
      name: 'Clean-Water Pilot',
      description: 'Volunteer-led water-filtration pilot in a coastal village reduced reported illnesses.',
      category: 'health',
      currency: 'INR',
      images: [],
      fields: { impactArea: 'health', beneficiaries: 800, year: 2024, outcomeTag: 'clean-water' },
      sortOrder: 2,
      isActive: true,
    },
    {
      name: 'Skill-Training Program',
      description: 'Year-long vocational training supported first employment for program graduates.',
      category: 'livelihood',
      currency: 'INR',
      images: [],
      fields: { impactArea: 'livelihood', beneficiaries: 60, year: 2024, outcomeTag: 'first-employment' },
      sortOrder: 3,
      isActive: true,
    },
    {
      name: 'Disaster Relief Response',
      description: 'Flood-response team coordinated shelter and food distribution during the monsoon.',
      category: 'relief',
      currency: 'INR',
      images: [],
      fields: { impactArea: 'disaster-relief', beneficiaries: 2500, year: 2024, outcomeTag: 'relief-delivered' },
      sortOrder: 4,
      isActive: true,
    },
    {
      name: 'Community Garden',
      description: 'Neighborhood garden launched with weekly volunteer days and seasonal harvest distribution.',
      category: 'environment',
      currency: 'INR',
      images: [],
      fields: { impactArea: 'environment', beneficiaries: 120, year: 2024, outcomeTag: 'garden-launched' },
      sortOrder: 5,
      isActive: true,
    },
  ],
};

// ── MEMBERSHIPS — 5 items, moduleMemberships ────────────────────────

export const MEMBERSHIPS_SEED: SeedTemplate = {
  id: 'engagement.memberships',
  label: 'Sample memberships',
  description: '5 membership tier entries demonstrating membership_tier + loyalty_progress blocks',
  moduleSlug: 'moduleMemberships',
  items: [
    {
      name: 'Friend',
      description: 'Entry-level supporter tier with newsletter and event invites.',
      category: 'tier',
      price: 500,
      currency: 'INR',
      images: [],
      fields: { tierLevel: 1, benefits: 'newsletter, event-invites', cadence: 'annual' },
      sortOrder: 1,
      isActive: true,
    },
    {
      name: 'Supporter',
      description: 'Mid-level tier with exclusive content and member-only events.',
      category: 'tier',
      price: 2000,
      currency: 'INR',
      images: [],
      fields: { tierLevel: 2, benefits: 'exclusive-content, member-events', cadence: 'annual' },
      sortOrder: 2,
      isActive: true,
    },
    {
      name: 'Patron',
      description: 'Advanced tier with behind-the-scenes access and recognition in annual report.',
      category: 'tier',
      price: 10000,
      currency: 'INR',
      images: [],
      fields: { tierLevel: 3, benefits: 'bts-access, annual-report-recognition', cadence: 'annual' },
      sortOrder: 3,
      isActive: true,
    },
    {
      name: 'Benefactor',
      description: 'Major-supporter tier with named-program recognition and strategic-briefing access.',
      category: 'tier',
      price: 50000,
      currency: 'INR',
      images: [],
      fields: { tierLevel: 4, benefits: 'named-recognition, strategic-briefing', cadence: 'annual' },
      sortOrder: 4,
      isActive: true,
    },
    {
      name: 'Lifetime',
      description: 'One-time commitment granting lifetime access to member benefits.',
      category: 'lifetime',
      price: 500000,
      currency: 'INR',
      images: [],
      fields: { tierLevel: 5, benefits: 'all-prior-tiers, lifetime', cadence: 'one-time' },
      sortOrder: 5,
      isActive: true,
    },
  ],
};

// ── CAUSES — 5 items, moduleCauses ──────────────────────────────────

export const CAUSES_SEED: SeedTemplate = {
  id: 'engagement.causes',
  label: 'Sample causes',
  description: '5 program-area entries for nonprofit navigation; demonstrates pu_program_card',
  moduleSlug: 'moduleCauses',
  items: [
    {
      name: 'Education',
      description: 'Programs supporting student scholarships, library infrastructure, and teacher development.',
      category: 'area',
      currency: 'INR',
      images: [],
      fields: { areaFocus: 'education', subAreas: 'scholarships, libraries, teacher-dev', programCount: 4 },
      sortOrder: 1,
      isActive: true,
    },
    {
      name: 'Health',
      description: 'Maternal health, preventive care, and community clinic support programs.',
      category: 'area',
      currency: 'INR',
      images: [],
      fields: { areaFocus: 'health', subAreas: 'maternal, preventive, clinics', programCount: 3 },
      sortOrder: 2,
      isActive: true,
    },
    {
      name: 'Livelihood',
      description: 'Vocational training and micro-enterprise support for economic mobility.',
      category: 'area',
      currency: 'INR',
      images: [],
      fields: { areaFocus: 'livelihood', subAreas: 'vocational, micro-enterprise', programCount: 2 },
      sortOrder: 3,
      isActive: true,
    },
    {
      name: 'Environment',
      description: 'Reforestation, water conservation, and urban garden programs.',
      category: 'area',
      currency: 'INR',
      images: [],
      fields: { areaFocus: 'environment', subAreas: 'reforestation, water, urban-gardens', programCount: 3 },
      sortOrder: 4,
      isActive: true,
    },
    {
      name: 'Community',
      description: 'Cultural events, neighborhood associations, and civic-engagement programs.',
      category: 'area',
      currency: 'INR',
      images: [],
      fields: { areaFocus: 'community', subAreas: 'cultural, neighborhood, civic', programCount: 3 },
      sortOrder: 5,
      isActive: true,
    },
  ],
};

// ── Registry ────────────────────────────────────────────────────────

export const ENGAGEMENT_SEED_TEMPLATES: Readonly<Record<string, SeedTemplate>> = {
  [CAMPAIGNS_SEED.id]: CAMPAIGNS_SEED,
  [EVENTS_SEED.id]: EVENTS_SEED,
  [IMPACT_STORIES_SEED.id]: IMPACT_STORIES_SEED,
  [MEMBERSHIPS_SEED.id]: MEMBERSHIPS_SEED,
  [CAUSES_SEED.id]: CAUSES_SEED,
};

export function getEngagementSeedTemplate(id: string): SeedTemplate | undefined {
  return ENGAGEMENT_SEED_TEMPLATES[id];
}

export function listEngagementSeedTemplates(): SeedTemplate[] {
  return Object.values(ENGAGEMENT_SEED_TEMPLATES);
}
