import type { Metadata } from 'next';
import StubPage from '../components/StubPage';

export const metadata: Metadata = { title: 'Security' };

export default function Page() {
  return <StubPage title="Security" description="How Pingbox keeps your data and your customers data safe." />;
}
