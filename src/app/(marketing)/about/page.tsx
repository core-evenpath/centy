import type { Metadata } from 'next';
import StubPage from '../components/StubPage';

export const metadata: Metadata = { title: 'About' };

export default function Page() {
  return <StubPage title="About" description="The story behind Pingbox and the team building it." />;
}
