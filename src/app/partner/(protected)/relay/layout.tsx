import { Metadata } from 'next';

export const metadata: Metadata = { title: 'Relay' };

export default function RelayLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
