import type { Metadata } from 'next';
import StubPage from '../components/StubPage';

export const metadata: Metadata = { title: 'Documentation' };

export default function Page() {
  return <StubPage title="Documentation" description="Everything you need to integrate and extend Pingbox." />;
}
