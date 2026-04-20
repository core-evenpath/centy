import type { Metadata } from 'next';
import StubPage from '../components/StubPage';

export const metadata: Metadata = { title: 'Careers' };

export default function Page() {
  return <StubPage title="Careers" description="Join the team building the future of conversational lead conversion." />;
}
