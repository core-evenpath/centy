import type { Metadata } from 'next';
import IndustryPage from '../../../components/IndustryPage';

export const metadata: Metadata = {
  title: 'Pingbox for Real Estate — India',
  description: 'Qualify property inquiries while the buyer is still on WhatsApp. Pingbox handles listing inquiries from MagicBricks, 99acres, Housing.com, and direct WhatsApp leads.',
};

export default function Page() {
  return (
    <IndustryPage
      eyebrow="For real estate brokers & developers — India"
      headline="Qualify buyers while they're still on WhatsApp."
      subheadline="Pingbox handles every listing inquiry — from MagicBricks, 99acres, Housing.com, your website, and direct WhatsApp — with interactive listing cards, viewing scheduling, and pre-qualification. Convert leads while they're hot, not the next morning."
      problemStats="Indian real estate buyers contact 10–20 brokers before deciding. WhatsApp is the primary channel. Brokers who respond in 5 minutes book 3x more viewings than those who respond in 30 minutes. Most leads from property portals arrive at night or on weekends. Without automation, these leads either go cold or require the broker to be on WhatsApp 24/7. One missed flat sale in Gurgaon, Bangalore, or Mumbai = ₹1.5–₹5 lakh in lost commission."
      blocks={[
        'Listing Card — photo gallery, BHK, area, price, builder, possession date',
        'Viewing Scheduler — broker/agent calendar, site visit availability',
        'Pre-Qualification — budget range, timeline, loan requirement, existing property',
        'Home Loan Connect — partner bank/NBFC handoff with context',
        'Neighbourhood Guide — commute, schools, amenities, rera status',
        'Document Checklist — what the buyer needs for booking and registration',
      ]}
      integrations={[
        { name: 'MagicBricks', note: 'Lead sync via webhook or API' },
        { name: '99acres', note: 'Lead routing, property sync' },
        { name: 'Housing.com', note: 'Listing and lead sync' },
        { name: 'Zoho CRM', note: 'Pipeline management, follow-up sequences' },
        { name: 'LeadSquared', note: 'Real estate CRM, site visit tracking' },
        { name: 'Razorpay', note: 'Booking amount, token payment collection' },
      ]}
      roi="One closed residential transaction: ₹1.5–₹5 lakh commission (broker, Tier 1 city). One recovered lead per month covers Pingbox Scale for 3+ years. For developers and brokerages with 10+ agents, even a 10% improvement in portal lead response converts to crores in recovered pipeline annually."
    />
  );
}
