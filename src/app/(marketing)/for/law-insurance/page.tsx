import type { Metadata } from 'next';
import IndustryPage from '../../components/IndustryPage';

export const metadata: Metadata = {
  title: 'Pingbox for Law Firms & Insurance',
  description: 'Intake every inquiry. Qualify before you spend a minute. Pingbox handles legal and insurance intake with structured qualification, document collection, and case-specific routing.',
};

export default function Page() {
  return (
    <IndustryPage
      eyebrow="For law firms & insurance agencies"
      headline="Intake every inquiry. Qualify before you spend a minute."
      subheadline="Pingbox handles legal and insurance intake with structured qualification, document collection, and case-specific routing. No more 20-minute intake calls that go nowhere — prospects qualify themselves before anyone on your team picks up the phone."
      problemStats="Legal and insurance inbound is notoriously noisy. Half the inquiries are outside your practice area or scope. The rest need 20+ minutes of qualification before anyone knows if it's worth a consultation. Attorneys end up doing intake work instead of billable work; agents end up re-qualifying leads the receptionist misunderstood. Every hour of attorney time spent on unqualified intake represents $300–$800 in lost billable time."
      blocks={[
        'Case Intake — structured questions by practice area',
        'Consultation Booking — calendar with case-type-specific timing',
        'Document Upload — secure, encrypted file intake',
        'Practice Area Router — auto-routes by case type',
        'Coverage Verifier — quote eligibility pre-check (insurance)',
        'Claim Intake — structured first-notice-of-loss (insurance)',
      ]}
      integrations={[
        { name: 'Clio', note: 'Legal CRM, case management' },
        { name: 'MyCase', note: 'Case management, client communication' },
        { name: 'PracticePanther', note: 'Law firm operations' },
        { name: 'Applied Epic', note: 'Insurance agency management' },
        { name: 'AMS360', note: 'Insurance agency platform' },
      ]}
      roi="One personal injury case: $5K–$500K+. One new insurance policy: $300–$3,000 annual premium with lifetime renewals. Pingbox pays for itself with a fraction of a case or a handful of policies. For firms handling 100+ inquiries per month, the qualification filter alone recovers 5–10 hours of attorney time weekly."
      complianceNote="Pingbox supports attorney-client privilege via encrypted conversation storage, signed BAA for HIPAA contexts (insurance health claims), and audit logs required for legal and regulatory compliance. Scale tier includes role-based access for paralegals, attorneys, and admin staff with different visibility."
    />
  );
}
