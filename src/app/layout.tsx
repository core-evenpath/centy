import type { Metadata, Viewport } from 'next';
import { Inter, Poppins } from 'next/font/google';
import { Toaster } from "../components/ui/toaster";
import FirebaseErrorListener from '../components/FirebaseErrorListener';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#f43f5e',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://pingbox.io'),
  title: {
    default: 'PingBox - AI-Powered Customer Messaging Platform | Instant Replies from Your Business Data',
    template: '%s | PingBox',
  },
  description: 'PingBox unifies WhatsApp, Telegram & SMS into one AI-powered inbox. Get instant, accurate customer replies powered by your actual business documents, catalogs, and pricing. Setup in 10 minutes.',
  keywords: [
    'AI customer messaging',
    'WhatsApp business automation',
    'Telegram business bot',
    'SMS automation',
    'unified inbox',
    'AI-powered replies',
    'customer support automation',
    'lead conversion',
    'business messaging platform',
    'automated customer service',
    'multi-channel messaging',
    'AI chatbot for business',
    'WhatsApp API',
    'business communication platform',
    'customer engagement platform',
  ],
  authors: [{ name: 'PingBox' }],
  creator: 'PingBox',
  publisher: 'PingBox',
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
    type: 'website',
    locale: 'en_US',
    url: 'https://pingbox.io',
    siteName: 'PingBox',
    title: 'PingBox - AI-Powered Customer Messaging Platform',
    description: 'Unify WhatsApp, Telegram & SMS into one AI-powered inbox. Instant, accurate replies from your business documents. Setup in 10 minutes.',
    images: [
      {
        url: '/images/hero.svg',
        width: 1200,
        height: 630,
        alt: 'PingBox - AI-Powered Customer Messaging Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PingBox - AI-Powered Customer Messaging Platform',
    description: 'Unify WhatsApp, Telegram & SMS into one AI-powered inbox. Instant, accurate replies from your business documents.',
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
      <body className={`${inter.variable} ${poppins.variable} font-sans antialiased`}>
        {children}
        <Toaster />
        <FirebaseErrorListener />
      </body>
    </html>
  );
}
