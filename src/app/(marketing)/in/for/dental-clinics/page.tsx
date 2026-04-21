import type { Metadata } from 'next';
import IndustryPage from '../../../components/IndustryPage';
import { DENTAL_FLOWS_IN } from '../../../components/blocks';

export const metadata: Metadata = {
  title: 'Pingbox for Dental Clinics — India',
  description: 'WhatsApp-first dental lead conversion for Indian clinics. Convert every consultation inquiry into a booked appointment — in Hindi, Tamil, or English.',
};

export default function Page() {
  return (
    <IndustryPage
      eyebrow="For dental & aesthetic clinics — India"
      headline="Convert every WhatsApp inquiry into a booked consultation."
      subheadline="Indian patients research 3–5 clinics on WhatsApp before deciding. Pingbox replies in 30 seconds with interactive treatment menus, consultation booking, and insurance verification — in Hindi, Tamil, Marathi, or English."
      problemStats="Dental leads in India arrive primarily via WhatsApp and Google. Most clinics have one receptionist checking one phone. Leads arrive at odd hours, on weekends, during surgeries. Every unanswered WhatsApp is a patient who walked into a competitor. Average consultation value: ₹500–₹2,000. Implant/orthodontic case: ₹50,000–₹2 lakh. One lost implant case per week costs a 5-clinic chain ₹60+ lakh annually."
      blockFlows={DENTAL_FLOWS_IN}
      blockHeadword="patient"
      blockLabel="LIVE FLOWS FOR DENTAL — INDIA"
      blockNarrative="When a patient asks about whitening on WhatsApp, Pingbox replies with a Service Card in ₹ pricing and a Booking Flow with your calendar slots. Patient books in three taps. Same flow works in Hindi, Tamil, or English — no human needed."
      blocks={[
        'Treatment Menu — browsable cards in Hindi and English for cleanings, whitening, implants, aligners',
        'Insurance Verifier — upload insurance card, check coverage eligibility',
        'New Patient Booking — WhatsApp calendar with doctor preference, first-available slots',
        'Consultation Request — for implants, smile design, orthodontics',
        'EMI Explainer — Razorpay EMI options for high-ticket treatment plans',
        'Reactivation — WhatsApp outreach to lapsed patients',
      ]}
      integrations={[
        { name: 'Dental360', note: 'Indian practice management' },
        { name: 'Clinic Softwares India', note: 'Appointment booking, patient records' },
        { name: 'Zoho CRM', note: 'Lead management, follow-up automation' },
        { name: 'Razorpay', note: 'Consultation deposits, EMI for treatment plans' },
        { name: 'LeadSquared', note: 'Lead capture, nurture automation' },
        { name: 'WhatsApp Business API', note: 'Via Meta BSP (Pingbox is verified)' },
      ]}
      roi="Avg new dental patient LTV in India: ₹8,000–₹40,000 (basic to cosmetic). Growth plan at ₹6,999/mo pays for itself with less than one new implant patient per month. Most multi-clinic dental brands in Bangalore, Mumbai, and Pune recover Pingbox cost in the first week of deployment."
      complianceNote="All patient data is processed in compliance with the DPDP Act 2023. Consent workflows are built into every conversation flow. Signed data processing agreements available for Scale plan customers."
    />
  );
}
