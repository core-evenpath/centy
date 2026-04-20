import type { Metadata } from 'next';
import RelayClient from '../components/RelayClient';

export const metadata: Metadata = {
  title: 'Relay — Pingbox',
  description: 'The chat widget that replies in interactive UI. Relay converts website inbound into decisions with interactive blocks.',
  alternates: {
    canonical: 'https://pingbox.io/relay',
  },
};

export default function Page() {
  return <RelayClient />;
}
