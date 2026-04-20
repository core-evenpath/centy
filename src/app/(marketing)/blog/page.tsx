import type { Metadata } from 'next';
import StubPage from '../components/StubPage';

export const metadata: Metadata = { title: 'Blog' };

export default function Page() {
  return <StubPage title="Blog" description="Insights, guides, and news from the Pingbox team." />;
}
