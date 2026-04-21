import type { Metadata } from 'next';
import IndustryPage from '../../components/IndustryPage';
import { HVAC_FLOWS } from '../../components/blocks';

export const metadata: Metadata = {
  title: 'Pingbox for HVAC',
  description: 'Every "my AC is out" becomes a scheduled service call. Pingbox handles every urgent call, quote request, and maintenance inquiry — triaging emergencies and booking service windows.',
};

export default function Page() {
  return (
    <IndustryPage
      eyebrow="For HVAC & home services"
      headline='Every "my AC is out" becomes a scheduled service call.'
      subheadline="Pingbox handles every urgent call, every quote request, every maintenance inquiry — triaging emergencies, qualifying leads, and booking service windows across every truck in every market. Zero leads lost to 'we'll call you back.'"
      problemStats="HVAC is the most urgency-sensitive service vertical. When someone's AC is out in July, they call 4 companies in 20 minutes. Whoever answers first, or responds fastest, wins. Companies still relying on 'we'll get back to you in 24 hours' lose 60–80% of emergency demand to faster competitors. For a mid-sized HVAC operation ($1M+ annual revenue) spending $15K/month on lead gen, a 10% improvement in lead response converts to $25K+/month in recovered revenue."
      blockFlows={HVAC_FLOWS}
      blockHeadword="HVAC"
      blockLabel="LIVE FLOWS FOR HVAC"
      blockNarrative="Emergency inquiries don't get a 'we'll call you back.' They get a Service Card with today's dispatch window and a Booking Flow that reserves the next truck. The same system handles quote requests for new installs, maintenance plan sign-ups, and service contract renewals."
      blocks={[
        'Emergency Triage — urgency classification (no cooling, leak, no heat), auto-prioritize dispatch',
        'Service Call Request — type of issue, system age, address, availability windows',
        'Quote Builder — for installs (new AC, new furnace, heat pump)',
        'Maintenance Plan Enroll — recurring service contracts',
        'Parts Lookup — technician can check inventory mid-conversation',
        'Payment Link — after service, collect payment via secure link',
      ]}
      integrations={[
        { name: 'ServiceTitan', note: 'Dispatching, customer records, job scheduling' },
        { name: 'Housecall Pro', note: 'End-to-end field service' },
        { name: 'Jobber', note: 'Job management, invoicing' },
        { name: 'FieldEdge', note: 'Invoicing, payment collection' },
        { name: 'Google Local Services', note: 'Lead sync' },
        { name: 'QuickBooks', note: 'Accounting sync' },
      ]}
      roi="Avg HVAC service call: $300 (repair) to $8,000+ (full system install). A 3x lift on inquiry-to-appointment conversion at 20 inquiries/week per location = 14 extra appointments/week. At $500 average ticket, that's $7K/week per location. Pingbox Scale at $199/mo pays for itself in hours at a single location."
    />
  );
}
