import type { Metadata } from 'next';
import IndustryPage from '../../components/IndustryPage';
import { DENTAL_FLOWS } from '../../components/blocks';

export const metadata: Metadata = {
  title: 'Pingbox for Dental Clinics',
  description: 'Turn every patient inquiry into a booked appointment. Pingbox catches every inbound and converts them with interactive booking, insurance verification, and treatment consults.',
};

export default function Page() {
  return (
    <IndustryPage
      eyebrow="For dental & aesthetic clinics"
      headline="Turn every patient inquiry into a booked appointment."
      subheadline="Pingbox catches every inquiry — from your website, Google, social, or SMS — and converts them with interactive booking, insurance verification, and treatment consults. Dental practices using Pingbox book 3–5x more new patients from the traffic they already have."
      problemStats="78% of dental patients contact 3+ practices before choosing. The first practice to respond wins the majority of the time. Yet your front desk is on calls, at the chair, or in meetings — meaning inquiries sit unanswered for hours. The math: if you spend $8K/month on Google Ads driving dental inquiries and only 5% convert to first appointments, you're leaving $7,600/month in patient LTV on the table."
      blockFlows={DENTAL_FLOWS}
      blockHeadword="patient"
      blockLabel="LIVE FLOWS FOR DENTAL"
      blockNarrative="When a patient asks about whitening on WhatsApp or chats from your site, Pingbox doesn't reply with text — it ships a Service Card showing the actual treatment and price, then a Booking Flow with your calendar. Patient books in three taps. No typing. No phone tag."
      blocks={[
        'Treatment Menu — browsable cards for cleanings, whitening, implants, clear aligners',
        'Insurance Verifier — upload insurance card, auto-check coverage',
        'New Patient Booking — calendar with doctor preference, first-available slots',
        'Consultation Request — for higher-ticket services (implants, smile design)',
        'Treatment Plan Follow-up — patients who got plans but haven\'t booked',
        'Reactivation — outreach to lapsed patients',
      ]}
      integrations={[
        { name: 'DentalIntel', note: 'Patient records, production reporting' },
        { name: 'Open Dental', note: 'Practice management, appointment booking' },
        { name: 'NexHealth', note: 'Patient communication, online booking sync' },
        { name: 'Dentrix', note: 'Electronic health records integration' },
        { name: 'Eaglesoft', note: 'Scheduling and patient data' },
        { name: 'Weave', note: 'Communication consolidation' },
      ]}
      roi="Avg new dental patient LTV: $1,800 (basic practices) to $3,500 (high-end cosmetic). Pingbox Growth plan at $79/mo pays for itself with 0.5 new patients per month. Scale plan at $199/mo pays for itself with 1.2 new patients per month. Most multi-location dental brands recover Pingbox cost in the first week of deployment."
      complianceNote="Pingbox is HIPAA-ready. Scale plan includes a signed BAA. Patient PHI is encrypted at rest and in transit. Staff access can be restricted by role and location."
    />
  );
}
