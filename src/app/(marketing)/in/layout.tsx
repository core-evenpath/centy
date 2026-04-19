import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://pingbox.io'),
  alternates: {
    canonical: 'https://pingbox.io/in',
    languages: {
      'en-us': 'https://pingbox.io/',
      'en-in': 'https://pingbox.io/in',
      'x-default': 'https://pingbox.io/',
    },
  },
};

export default function IndiaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
