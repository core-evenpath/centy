import type { Metadata } from 'next';
import PingboxHomepage from './components/PingboxHomepage';

export const metadata: Metadata = {
  title: 'Pingbox — Conversational Lead Conversion for Service Brands',
  description:
    'Turn every inquiry into a decision, not just a reply. Pingbox catches every inbound and converts it with interactive UI blocks. Built for multi-location service brands.',
};

export default function HomePage() {
  return <PingboxHomepage />;
}
