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
    default: 'Pingbox — AI That Responds to Your Customers in 30 Seconds',
    template: '%s | Pingbox',
  },
  description: 'Pingbox reads your business documents and responds to customers in 30 seconds — real answers, real pricing, real bookings. Works on website chat, SMS, WhatsApp, and Telegram. Free 14-day trial.',
  keywords: [
    'AI customer messaging',
    'AI chatbot for business',
    'customer response automation',
    'service business software',
    'AI appointment booking',
    'multi-channel messaging platform',
    'AI sales agent',
    'document AI for business',
    'lead response automation',
    'business messaging platform',
    'HVAC software',
    'med spa software',
    'law firm intake automation',
    'AI receptionist',
  ],
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
    title: 'Pingbox — AI That Responds to Your Customers in 30 Seconds',
    description: 'Pingbox reads your business documents and responds to customers in 30 seconds — real answers, real pricing, real bookings. Works on website chat, SMS, WhatsApp, and Telegram. Free 14-day trial.',
    url: 'https://pingbox.io',
    siteName: 'Pingbox',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/images/brand/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Pingbox — AI-powered messaging for service businesses',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pingbox — AI That Responds to Your Customers in 30 Seconds',
    description: 'Pingbox reads your business documents and responds to customers in 30 seconds — real answers, real pricing, real bookings. Works on website chat, SMS, WhatsApp, and Telegram. Free 14-day trial.',
    images: ['/images/brand/og-image.png'],
    creator: '@pingbox',
  },
  alternates: {
    canonical: 'https://pingbox.io',
  },
  applicationName: 'Pingbox',
  category: 'technology',
  classification: 'Business Software',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/images/brand/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        {children}
        <Toaster />
        <FirebaseErrorListener />
      </body>
    </html>
  );
}
