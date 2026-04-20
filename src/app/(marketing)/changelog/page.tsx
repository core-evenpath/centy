import type { Metadata } from 'next';
import StubPage from '../components/StubPage';

export const metadata: Metadata = { title: 'Changelog' };

export default function Page() {
  return <StubPage title="Changelog" description="What's new in Pingbox — features, fixes, and improvements." />;
}
