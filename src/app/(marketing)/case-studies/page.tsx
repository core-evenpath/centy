import type { Metadata } from 'next';
import StubPage from '../components/StubPage';

export const metadata: Metadata = { title: 'Case Studies' };

export default function Page() {
  return <StubPage title="Case Studies" description="Deep-dives into how operators win with Pingbox." />;
}
