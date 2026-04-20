import type { Metadata } from 'next';
import PricingClient from '../components/PricingClient';

export const metadata: Metadata = {
  title: 'Pricing — Pingbox',
  description: 'Simple, transparent pricing that anchors to your ad budget, not your headcount. Free, Growth ($79/mo), and Scale ($199/mo) tiers for service brands of every size.',
  alternates: {
    canonical: 'https://pingbox.io/pricing',
    languages: {
      'en-us': 'https://pingbox.io/pricing',
      'en-in': 'https://pingbox.io/in/pricing',
      'x-default': 'https://pingbox.io/pricing',
    },
  },
};

export default function PricingPage() {
  return <PricingClient />;
}
