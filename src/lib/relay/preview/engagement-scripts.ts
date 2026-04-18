// Engagement preview scripts (P2.engagement.M08).
//
// 8 scripts per sub-vertical × 3 sub-verticals = 24 scripts.
// Themes are engagement-shaped (in-chat commitment, no transaction):
//   1. First-time donate / first-time volunteer / first-time RSVP
//   2. Recurring commitment setup
//   3. Event participation
//   4. Impact inquiry (where does my money go / what did I help accomplish)
//   5. Receipt / confirmation lookup (service overlay — only where applicable)
//   6. Cancel recurring (service overlay — only where applicable)
//   7. Anonymous commitment edge case
//   8. Matching gift / multi-stakeholder edge case
//
// For service-exception sub-verticals (per Adjustment 3), themes 5
// and 6 are replaced with substitute themes (community-testimonial,
// mission-deep-dive). The nonprofit-charity sub-vertical uses
// substitutes because ngo_nonprofit is a service-exception function
// in the recipe.

import type { PreviewScript as BookingPreviewScript } from './booking-scripts';

export type EngagementSubVertical =
  | 'nonprofit-charity'
  | 'community-engagement'
  | 'subscription-rsvp';

export interface EngagementPreviewScript extends Omit<BookingPreviewScript, 'subVertical' | 'engine'> {
  engine: 'engagement';
  subVertical: EngagementSubVertical;
}

const T = (content: string) => ({ role: 'user' as const, content });

// ── Nonprofit / Charity ───────────────────────────────────────────────
// ngo_nonprofit is service-exception → themes 5 (receipt lookup) and 6
// (cancel recurring) substituted with community-testimonial and
// mission-deep-dive since the recipe has no service overlay.

const NONPROFIT_SCRIPTS: EngagementPreviewScript[] = [
  {
    id: 'nonprofit-01-first-donate',
    engine: 'engagement',
    subVertical: 'nonprofit-charity',
    label: 'First-time donate',
    description: 'Visitor makes their first donation',
    turns: [T('hi'), T('i want to donate'), T('donate 500 rupees')],
  },
  {
    id: 'nonprofit-02-recurring',
    engine: 'engagement',
    subVertical: 'nonprofit-charity',
    label: 'Recurring commitment setup',
    description: 'Visitor sets up monthly recurring donation',
    turns: [T('i want to set up monthly giving'), T('tell me about the monthly giving circle'), T('sign me up for monthly contribution')],
  },
  {
    id: 'nonprofit-03-event',
    engine: 'engagement',
    subVertical: 'nonprofit-charity',
    label: 'Event participation',
    description: 'Visitor asks about upcoming fundraising event',
    turns: [T('are there any upcoming events'), T('tell me about the annual gala'), T('how do i RSVP')],
  },
  {
    id: 'nonprofit-04-impact',
    engine: 'engagement',
    subVertical: 'nonprofit-charity',
    label: 'Impact inquiry',
    description: 'Visitor asks where donations go',
    turns: [T('where does my money go'), T('show me the impact report'), T('what did last year accomplish')],
  },
  {
    id: 'nonprofit-05-testimonial-substitute',
    engine: 'engagement',
    subVertical: 'nonprofit-charity',
    label: 'Community testimonial (substitute for service-receipt-lookup)',
    description: 'Visitor reads community testimonials — substitute theme for service-exception nonprofits',
    turns: [T('show me community feedback'), T('what do supporters say'), T('share a success story')],
  },
  {
    id: 'nonprofit-06-mission-deep',
    engine: 'engagement',
    subVertical: 'nonprofit-charity',
    label: 'Mission deep-dive (substitute for service-cancel)',
    description: 'Visitor explores programs in depth — substitute theme for service-exception nonprofits',
    turns: [T('tell me about your programs'), T('what causes do you fund'), T('show me the education program')],
  },
  {
    id: 'nonprofit-07-anonymous',
    engine: 'engagement',
    subVertical: 'nonprofit-charity',
    label: 'Anonymous donation edge case',
    description: 'Visitor makes anonymous contribution',
    turns: [T('i want to donate anonymously'), T('can i give without sharing my name'), T('donate 1000 rupees anonymous')],
  },
  {
    id: 'nonprofit-08-matching-gift',
    engine: 'engagement',
    subVertical: 'nonprofit-charity',
    label: 'Matching gift edge case',
    description: 'Corporate donor inquires about matching-gift program',
    turns: [T('my company matches donations'), T('tell me about matching gifts'), T('how do corporate matches work')],
  },
];

// ── Community Engagement ──────────────────────────────────────────────

const COMMUNITY_SCRIPTS: EngagementPreviewScript[] = [
  {
    id: 'community-01-first-volunteer',
    engine: 'engagement',
    subVertical: 'community-engagement',
    label: 'First-time volunteer',
    description: 'Visitor signs up to volunteer for the first time',
    turns: [T('i want to volunteer'), T('what roles are available'), T('sign me up')],
  },
  {
    id: 'community-02-recurring-commitment',
    engine: 'engagement',
    subVertical: 'community-engagement',
    label: 'Recurring volunteer commitment',
    description: 'Visitor sets up ongoing weekly volunteer commitment',
    turns: [T('i want to volunteer regularly'), T('is there a weekly program'), T('sign me up for the weekly rotation')],
  },
  {
    id: 'community-03-event-rsvp',
    engine: 'engagement',
    subVertical: 'community-engagement',
    label: 'Event RSVP',
    description: 'Visitor RSVPs to a community town hall',
    turns: [T('RSVP to the community town hall'), T('when is it'), T('count me in')],
  },
  {
    id: 'community-04-impact',
    engine: 'engagement',
    subVertical: 'community-engagement',
    label: 'Volunteer impact inquiry',
    description: 'Volunteer asks what their hours accomplished',
    turns: [T('what did my volunteer hours accomplish'), T('show me the community impact'), T('how many people did we help')],
  },
  {
    id: 'community-05-receipt',
    engine: 'engagement',
    subVertical: 'community-engagement',
    label: 'RSVP confirmation lookup (service overlay)',
    description: 'Returning visitor checks RSVP confirmation',
    turns: [T('whats the status of my RSVP'), T('did my RSVP go through'), T('confirm my attendance')],
  },
  {
    id: 'community-06-cancel',
    engine: 'engagement',
    subVertical: 'community-engagement',
    label: 'Cancel volunteer commitment (service overlay)',
    description: 'Volunteer updates their RSVP or cancels a commitment',
    turns: [T('i need to cancel my volunteer slot'), T('update my RSVP to no'), T('cancel my attendance for saturday')],
  },
  {
    id: 'community-07-anonymous-feedback',
    engine: 'engagement',
    subVertical: 'community-engagement',
    label: 'Anonymous feedback edge case',
    description: 'Community member submits anonymous feedback',
    turns: [T('i want to leave anonymous feedback'), T('can i report an issue anonymously'), T('submit anonymous complaint')],
  },
  {
    id: 'community-08-multi-stakeholder',
    engine: 'engagement',
    subVertical: 'community-engagement',
    label: 'Multi-stakeholder edge case',
    description: 'Group wants to attend event together',
    turns: [T('we are a group of 5'), T('can we all RSVP together'), T('book spots for 5 people')],
  },
];

// ── Subscription / RSVP ───────────────────────────────────────────────

const SUBSCRIPTION_RSVP_SCRIPTS: EngagementPreviewScript[] = [
  {
    id: 'sub-01-first-signup',
    engine: 'engagement',
    subVertical: 'subscription-rsvp',
    label: 'First-time membership signup',
    description: 'Visitor signs up for membership for the first time',
    turns: [T('i want to become a member'), T('what tiers are available'), T('sign me up for the friend tier')],
  },
  {
    id: 'sub-02-recurring',
    engine: 'engagement',
    subVertical: 'subscription-rsvp',
    label: 'Upgrade to recurring tier',
    description: 'Visitor upgrades to a higher-commitment tier',
    turns: [T('i want to upgrade my membership'), T('tell me about the patron tier'), T('upgrade me to patron')],
  },
  {
    id: 'sub-03-event',
    engine: 'engagement',
    subVertical: 'subscription-rsvp',
    label: 'Event access as member',
    description: 'Member asks about member-only events',
    turns: [T('what events are members-only'), T('when is the next members meeting'), T('can i RSVP')],
  },
  {
    id: 'sub-04-benefits',
    engine: 'engagement',
    subVertical: 'subscription-rsvp',
    label: 'Member benefits inquiry',
    description: 'Visitor compares benefits across tiers',
    turns: [T('what benefits do members get'), T('compare the tiers'), T('what does patron get that friend doesnt')],
  },
  {
    id: 'sub-05-receipt',
    engine: 'engagement',
    subVertical: 'subscription-rsvp',
    label: 'Membership receipt lookup (service overlay)',
    description: 'Member checks membership status or receipt',
    turns: [T('whats my membership status'), T('did my payment go through'), T('when does my membership renew')],
  },
  {
    id: 'sub-06-cancel-recurring',
    engine: 'engagement',
    subVertical: 'subscription-rsvp',
    label: 'Cancel recurring membership (service overlay)',
    description: 'Member cancels auto-renewing subscription',
    turns: [T('cancel my membership'), T('i want to stop the recurring charge'), T('cancel auto-renew')],
  },
  {
    id: 'sub-07-anonymous-newsletter',
    engine: 'engagement',
    subVertical: 'subscription-rsvp',
    label: 'Newsletter-only signup (anonymous edge)',
    description: 'Visitor wants newsletter without full membership',
    turns: [T('just sign me up for the newsletter'), T('do i need to be a member'), T('free signup only please')],
  },
  {
    id: 'sub-08-gift-membership',
    engine: 'engagement',
    subVertical: 'subscription-rsvp',
    label: 'Gift membership edge case',
    description: 'Visitor gives a membership as a gift',
    turns: [T('can i gift a membership'), T('i want to give a membership to someone'), T('send gift membership')],
  },
];

// ── Registry ──────────────────────────────────────────────────────────

export const ENGAGEMENT_PREVIEW_SCRIPTS: readonly EngagementPreviewScript[] = [
  ...NONPROFIT_SCRIPTS,
  ...COMMUNITY_SCRIPTS,
  ...SUBSCRIPTION_RSVP_SCRIPTS,
];

export function getEngagementScriptsBySubVertical(
  subVertical: EngagementSubVertical,
): EngagementPreviewScript[] {
  return ENGAGEMENT_PREVIEW_SCRIPTS.filter((s) => s.subVertical === subVertical);
}

export function getEngagementScriptById(id: string): EngagementPreviewScript | undefined {
  return ENGAGEMENT_PREVIEW_SCRIPTS.find((s) => s.id === id);
}
