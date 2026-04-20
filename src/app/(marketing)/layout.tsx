import type { Metadata } from 'next';
import { Karla, Fraunces, JetBrains_Mono } from 'next/font/google';
import './animations.css';

const karla = Karla({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
  variable: '--font-karla',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['italic'],
  axes: ['opsz'],
  variable: '--font-fraunces',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://pingbox.io'),
  title: {
    default: 'Pingbox — Conversational Lead Conversion for Service Brands',
    template: '%s — Pingbox',
  },
  description:
    'Turn every inquiry into a decision, not just a reply. Pingbox catches every inbound and converts it with interactive UI blocks. Built for multi-location service brands.',
  openGraph: {
    type: 'website',
    siteName: 'Pingbox',
    locale: 'en_US',
  },
  twitter: { card: 'summary_large_image', site: '@pingbox' },
  // Individual pages set their own canonical. Hreflang for paired US/India URLs:
  alternates: {
    languages: {
      'en-us': 'https://pingbox.io/',
      'en-in': 'https://pingbox.io/in',
      'x-default': 'https://pingbox.io/',
    },
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${karla.variable} ${fraunces.variable} ${mono.variable}`}>
      {children}
    </div>
  );
}
