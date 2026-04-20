import type { Metadata } from 'next';
import StubPage from '../../components/StubPage';

export const metadata: Metadata = { title: 'API Reference' };

export default function Page() {
  return <StubPage title="API Reference" description="Full reference for the Pingbox REST and webhook APIs." />;
}
