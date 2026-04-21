import type { Metadata } from 'next';
import IndustryPage from '../../components/IndustryPage';
import { FITNESS_FLOWS } from '../../components/blocks';

export const metadata: Metadata = {
  title: 'Pingbox for Boutique Fitness Studios',
  description: 'Turn every class inquiry into a trial, and every trial into a member. Pingbox helps boutique studios convert more prospects into first-class-trials and long-term memberships.',
};

export default function Page() {
  return (
    <IndustryPage
      eyebrow="For boutique fitness studios"
      headline="Turn every class inquiry into a trial, and every trial into a member."
      subheadline="Pingbox helps boutique studios convert more prospects into first-class-trials, and more trials into long-term memberships. Class schedules, free trial bookings, membership comparisons — all via interactive chat."
      problemStats="Boutique fitness has the highest inbound-to-trial drop-off of any service vertical. Prospects explore 3–6 studios before committing. Most studios convert 10–15% of inquiries into free trials, and 20–30% of trials into memberships. Tiny improvements here compound into real revenue. A 15-member membership (at $180/mo) is $32K in annual revenue. Losing one 'on-the-fence' prospect to a competitor costs $32K/year in LTV."
      blockFlows={FITNESS_FLOWS}
      blockHeadword="fitness"
      blockLabel="LIVE FLOWS FOR FITNESS"
      blockNarrative="Prospects comparing studios don't type three times to see your schedule. Relay sends a class schedule block, then a Free Trial Booking block, then a membership comparison — all inside the chat, all tappable. Drop-off goes from 70% to single digits."
      blocks={[
        'Class Schedule — browsable by time, instructor, class type',
        'Free Trial Booking — one-tap claim, auto-reminder sequence',
        'Membership Compare — side-by-side tiers, per-visit vs unlimited',
        'Instructor Profiles — photos, bios, teaching style',
        'Intro Offer — promo code application inline',
        'Cancellation Hold — retention flow for churning members',
      ]}
      integrations={[
        { name: 'Mindbody', note: 'Class schedule, booking, membership management' },
        { name: 'ClassPass', note: 'Partnership inquiry handling' },
        { name: 'Zen Planner', note: 'Membership management, billing' },
        { name: 'Glofox', note: 'Class booking, payment' },
        { name: 'WellnessLiving', note: 'Member engagement' },
      ]}
      roi="Member LTV in boutique fitness: $2,000–$4,000. One recovered prospect per month covers Pingbox Scale for 10–20 months. Most multi-location fitness brands see payback inside the first week. Pingbox's interactive class browsing and frictionless free trial booking typically lifts inquiry-to-trial by 2–3x."
    />
  );
}
