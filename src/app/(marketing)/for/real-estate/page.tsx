import type { Metadata } from 'next';
import IndustryPage from '../../components/IndustryPage';
import { REAL_ESTATE_FLOWS } from '../../components/blocks';

export const metadata: Metadata = {
  title: 'Pingbox for Real Estate',
  description: 'Qualify leads while they are still on the listing. Pingbox handles every listing inquiry with interactive qualification, viewing scheduling, and mortgage pre-check.',
};

export default function Page() {
  return (
    <IndustryPage
      eyebrow="For real estate brokerages & agents"
      headline="Qualify leads while they're still on the listing."
      subheadline="Pingbox handles every listing inquiry — from Zillow, Redfin, Realtor, your website, social — with interactive qualification, viewing scheduling, and mortgage pre-check. Convert leads while they're hot, not 6 hours later."
      problemStats="Zillow leads lose 78% of value within the first 5 minutes. Most agents respond in 30–90 minutes, or never. The agent who replies in 2 minutes books the viewing. The one who replies in 45 minutes gets ghosted. For brokerages of 10+ agents, the math becomes compounding — shared brokerage leads distributed slowly represent millions in lost commissions annually."
      blockFlows={REAL_ESTATE_FLOWS}
      blockHeadword="real estate"
      blockLabel="LIVE FLOWS FOR REAL ESTATE"
      blockNarrative="When a lead pings about a listing, Pingbox ships a Listing Card with photos and key specs, then a Viewing Scheduler with your calendar, then a Pre-Qualification block to capture budget and timeline. No 6-hour reply gap. No 'we'll send you the info.'"
      blocks={[
        'Listing Card — photo gallery, beds/baths, pricing, next action',
        'Viewing Scheduler — agent calendar, property availability windows',
        'Pre-Qualification — budget range, timeline, financing status',
        'Mortgage Pre-Check — partner lender handoff with context',
        'Neighborhood Guide — commute times, schools, amenities',
        'Offer Preparation — quick sheet of required documents',
      ]}
      integrations={[
        { name: 'BoomTown', note: 'CRM, lead distribution' },
        { name: 'Chime', note: 'CRM, transaction management' },
        { name: 'Follow Up Boss', note: 'Real estate-specific CRM' },
        { name: 'Zillow Premier Agent', note: 'Direct lead routing' },
        { name: 'Realtor.com', note: 'Listing and lead sync' },
        { name: 'MLS feeds', note: 'Live listing data' },
      ]}
      roi="One residential commission: $5,000–$20,000+. One closed deal covers Pingbox Scale for 2+ years. For brokerages of 10+ agents, even a 10% improvement in lead response on shared brokerage leads pays for enterprise Pingbox many times over."
    />
  );
}
