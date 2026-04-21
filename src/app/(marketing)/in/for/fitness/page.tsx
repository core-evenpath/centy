import type { Metadata } from 'next';
import IndustryPage from '../../../components/IndustryPage';
import { FITNESS_FLOWS_IN } from '../../../components/blocks';

export const metadata: Metadata = {
  title: 'Pingbox for Fitness Studios — India',
  description: 'Turn every WhatsApp batch inquiry into a trial booking, and every trial into a long-term member. Built for Indian boutique fitness, yoga, and CrossFit studios.',
};

export default function Page() {
  return (
    <IndustryPage
      eyebrow="For boutique fitness studios — India"
      headline="Turn every WhatsApp inquiry into a trial, and every trial into a member."
      subheadline="Pingbox helps Indian fitness studios convert WhatsApp inquiries into first-class bookings, and first-class bookings into memberships. Class schedules, free trial booking, membership tiers — all sent as interactive WhatsApp cards."
      blockFlows={FITNESS_FLOWS_IN}
      blockHeadword="prospect"
      blockLabel="LIVE FLOWS FOR FITNESS — INDIA"
      blockNarrative="When someone WhatsApps 'gym ka schedule kya hai?', Pingbox replies with a Class Schedule card, then a Free Trial Booking block with one-tap date selection, then an Intro Offer card with Razorpay inline. Member converts before anyone on your team sees the message."
      problemStats="Mumbai, Bangalore, and Pune have intense boutique fitness competition. Prospects WhatsApp 4–6 studios before deciding. Studios that reply with a schedule, pricing, and trial booking link in 2 minutes convert 3x more than those who respond hours later. Most studios lose 40–60% of inquiries to this delay alone. A 50-member studio losing one batch per month (30 members × ₹4,000 = ₹1.2 lakh/year) to a faster competitor is losing more than 12x the cost of Pingbox."
      blocks={[
        'Class Schedule — interactive WhatsApp list by time, instructor, class type',
        'Free Trial Booking — one-tap claim with date/time selection',
        'Membership Compare — starter, monthly, quarterly, annual side-by-side',
        'Instructor Profiles — photos, bios, speciality (yoga, HIIT, pilates, CrossFit)',
        'Intro Offer — promo code + Razorpay payment inline',
        'Cancellation Hold — retention flow for members pausing or leaving',
      ]}
      integrations={[
        { name: 'Fitbudd', note: 'Indian fitness app + member management' },
        { name: 'GymPoint', note: 'Gym management, billing' },
        { name: 'Mindbody', note: 'Class booking, membership management' },
        { name: 'Razorpay', note: 'Membership fees, UPI payment collection' },
        { name: 'Zoho CRM', note: 'Lead tracking, re-engagement campaigns' },
        { name: 'WhatsApp Business API', note: 'Meta BSP-verified via Pingbox' },
      ]}
      roi="Avg Indian boutique fitness membership: ₹3,000–₹6,000/month. Member LTV over 12 months: ₹36,000–₹72,000. One recovered trial-to-member conversion covers Growth plan for 5–10 months. For studios with 100+ members, a 10% improvement in WhatsApp response converts to ₹3–6 lakh/year in recovered LTV."
    />
  );
}
