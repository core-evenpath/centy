import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Relay | Pingbox',
  description: 'Configure and manage your embeddable Relay chat widget',
};

export default function RelayLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
