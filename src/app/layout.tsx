import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Toaster } from "../components/ui/toaster";
import FirebaseErrorListener from '../components/FirebaseErrorListener';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
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
    default: 'Pingbox — AI-Powered WhatsApp Inbox for Service Businesses',
    template: '%s | Pingbox',
  },
  description: 'Pingbox reads your business documents and responds to customer messages on WhatsApp in 30 seconds. Unified inbox for WhatsApp, Telegram & SMS with AI-powered replies. Try free for 14 days.',
  keywords: ['WhatsApp Business', 'AI messaging', 'WhatsApp automation', 'business inbox', 'WhatsApp CRM', 'customer messaging platform', 'WhatsApp AI chatbot', 'unified inbox'],
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
    title: 'Pingbox — AI-Powered WhatsApp Inbox for Service Businesses',
    description: 'Stop losing leads to slow replies. Pingbox uses AI to respond on WhatsApp in 30 seconds using your own business documents.',
    url: 'https://pingbox.io',
    siteName: 'Pingbox',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/images/hero.svg',
        width: 1200,
        height: 630,
        alt: 'Pingbox — AI-Powered WhatsApp Inbox for Service Businesses',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pingbox — AI-Powered WhatsApp Inbox for Service Businesses',
    description: 'Stop losing leads to slow replies. Pingbox uses AI to respond on WhatsApp in 30 seconds using your own business documents.',
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
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        {children}
        <Toaster />
        <FirebaseErrorListener />
      </body>
    </html>
  );
}
