import type { Metadata } from 'next';
import IndustryPage from '../../../components/IndustryPage';

export const metadata: Metadata = {
  title: 'Pingbox for AC & Home Services — India',
  description: 'Every WhatsApp service request becomes a confirmed booking. Pingbox handles AC repair, installation, and maintenance inquiries — triaging emergencies and booking service windows.',
};

export default function Page() {
  return (
    <IndustryPage
      eyebrow="For AC & home services — India"
      headline="Every WhatsApp 'AC not working' becomes a confirmed service call."
      subheadline="Pingbox handles every urgent inquiry, quote request, and AMC renewal — triaging emergencies, qualifying leads, and booking service windows across every technician in every city. Zero leads lost to missed WhatsApp messages."
      problemStats="In India, AC service inquiries peak in April–June and arrive exclusively on WhatsApp. Customers contact 3 providers simultaneously. The one who responds first with a price and availability wins. Most small AC service businesses lose 60–70% of emergency inquiries because the owner is on-site and can't respond. AMC renewals — worth ₹3,000–₹8,000/year each — are lost to competitors who send automated WhatsApp reminders."
      blocks={[
        'Emergency Triage — classify urgency (no cooling, gas leak, no heat), auto-dispatch',
        'Service Request — AC brand, problem type, city/area, availability slots',
        'Quote Builder — installation quotes for split ACs, cassettes, central AC',
        'AMC Enrollment — annual maintenance contract with Razorpay recurring billing',
        'Technician Dispatch — send technician details + ETA via WhatsApp',
        'Payment Link — collect payment after service via UPI or card',
      ]}
      integrations={[
        { name: 'Zoho CRM', note: 'Service tickets, customer history' },
        { name: 'LeadSquared', note: 'Lead routing, field team assignment' },
        { name: 'Razorpay', note: 'UPI + card payment collection' },
        { name: 'WhatsApp Business API', note: 'Meta BSP-verified via Pingbox' },
        { name: 'FieldPulse / Fixzy', note: 'Field service management' },
        { name: 'Google Sheets', note: 'Simple dispatch tracking via Zapier' },
      ]}
      roi="Avg AC service call: ₹800–₹3,000 (repair). AC installation: ₹8,000–₹25,000. AMC renewal: ₹3,000–₹8,000/year. A 3x lift on WhatsApp inquiry-to-booking at 30 inquiries/week per technician = 20 extra appointments/week. At ₹1,500 average, that's ₹30,000/week per team. Pingbox Growth tier at ₹6,999/mo pays for itself in under 3 days."
    />
  );
}
