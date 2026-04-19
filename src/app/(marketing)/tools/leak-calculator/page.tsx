import type { Metadata } from 'next';
import StubPage from '../../components/StubPage';

export const metadata: Metadata = { title: 'Lead Leak Calculator' };

export default function Page() {
  return <StubPage title="Lead Leak Calculator" description="Find out how many leads your current setup is losing." />;
}
