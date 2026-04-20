import type { Metadata } from 'next';
import StubPage from '../components/StubPage';

export const metadata: Metadata = { title: 'United States' };

export default function Page() {
  return <StubPage title="United States" description="Pingbox for US-based service brands." />;
}
