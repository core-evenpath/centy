import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import { Toaster } from "../components/ui/toaster";
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

export const metadata: Metadata = {
  title: 'centy.dev - AI-Powered Marketing Platform',
  description: 'Marketing Made Effortless',
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
      </body>
    </html>
  );
}
