import type { Metadata } from 'next';
import IntelligenceClient from '../components/IntelligenceClient';

export const metadata: Metadata = {
  title: 'Intelligence — Pingbox',
  description: 'Know which message made you money. Intelligence tracks every conversation as pipeline for full revenue attribution.',
  alternates: {
    canonical: 'https://pingbox.io/intelligence',
  },
};

export default function Page() {
  return <IntelligenceClient />;
}
