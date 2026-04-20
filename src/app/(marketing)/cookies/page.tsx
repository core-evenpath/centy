import type { Metadata } from 'next';
import StubPage from '../components/StubPage';

export const metadata: Metadata = { title: 'Cookie Policy' };

export default function Page() {
  return <StubPage title="Cookie Policy" description="How we use cookies and similar tracking technologies." />;
}
