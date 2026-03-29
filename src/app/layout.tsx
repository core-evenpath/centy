import type { Metadata, Viewport } from 'next';
import { DM_Sans, Instrument_Serif } from 'next/font/google';
import { Toaster } from "../components/ui/toaster";
import FirebaseErrorListener from '../components/FirebaseErrorListener';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
});

const instrumentSerif = Instrument_Serif({
  weight: '400',
  style: 'italic',
  subsets: ['latin'],
  variable: '--font-instrument-serif',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#faf8f5',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://pingbox.io'),
  title: {
    default: 'Pingbox — AI-Powered Messaging for Service Businesses',
    template: '%s | Pingbox',
  },
  description: 'The fastest reply wins the customer. Pingbox reads your documents and responds to customers in 30 seconds — with real answers, real pricing, and real bookings. On any channel.',
  keywords: ['AI messaging', 'business messaging', 'WhatsApp automation', 'SMS automation', 'AI chatbot', 'customer messaging platform', 'business inbox', 'AI customer service', 'automated booking', 'service business AI'],
  authors: [{ name: 'Pingbox' }],
  creator: 'Pingbox',
  publisher: 'Pingbox',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Pingbox — The Fastest Reply Wins the Customer',
    description: 'AI-powered messaging that reads your documents and responds to customers in 30 seconds with real answers, pricing, and bookings. Website chat, SMS, WhatsApp & Telegram.',
    url: 'https://pingbox.io',
    siteName: 'Pingbox',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/images/hero.svg',
        width: 1200,
        height: 630,
        alt: 'Pingbox — AI-Powered Messaging for Service Businesses',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pingbox — The Fastest Reply Wins the Customer',
    description: 'AI-powered messaging that reads your documents and responds to customers in 30 seconds with real answers, pricing, and bookings.',
    images: ['/images/hero.svg'],
    creator: '@pingbox',
  },
  alternates: {
    canonical: 'https://pingbox.io',
  },
  category: 'technology',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${instrumentSerif.variable} font-sans antialiased`}>
        {children}
        <Toaster />
        <FirebaseErrorListener />
      </body>
    </html>
  );
}
