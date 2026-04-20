import type { Metadata } from 'next';
import EngageClient from '../components/EngageClient';

export const metadata: Metadata = {
  title: 'Engage — Pingbox',
  description: 'Every channel. Every location. One view. Engage unifies inbound from all channels into a single operator console.',
  alternates: {
    canonical: 'https://pingbox.io/engage',
  },
};

export default function Page() {
  return <EngageClient />;
}
