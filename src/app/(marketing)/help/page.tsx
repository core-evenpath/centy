import type { Metadata } from 'next';
import StubPage from '../components/StubPage';

export const metadata: Metadata = { title: 'Help Center' };

export default function Page() {
  return <StubPage title="Help Center" description="Guides, tutorials, and answers to common questions." />;
}
