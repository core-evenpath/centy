import type { Metadata } from 'next';
import ContactSalesClient from '../../components/ContactSalesClient';

export const metadata: Metadata = {
  title: 'Talk to Sales — Pingbox',
  description: 'Get a personalized walkthrough of Pingbox for your team. Book a demo and get a custom rollout plan.',
  alternates: {
    canonical: 'https://pingbox.io/contact/sales',
    languages: {
      'en-us': 'https://pingbox.io/contact/sales',
      'en-in': 'https://pingbox.io/in/contact/sales',
      'x-default': 'https://pingbox.io/contact/sales',
    },
  },
};

export default function Page() {
  return <ContactSalesClient />;
}
