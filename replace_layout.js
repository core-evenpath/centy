const fs = require('fs');
let content = fs.readFileSync('src/app/layout.tsx', 'utf-8');

// Title defaults
content = content.replace(
  "default: 'Pingbox — AI-Powered WhatsApp Inbox for Service Businesses'",
  "default: 'Pingbox — AI That Responds to Your Customers in 30 Seconds'"
);

// Description
const oldDescRegex = /description:\s*['"][^'"]*in 30 seconds[^'"]*['"]/;
const newDesc = "description: 'Pingbox reads your business documents and responds to customers in 30 seconds — real answers, real pricing, real bookings. Works on website chat, SMS, WhatsApp, and Telegram. Free 14-day trial.',";

content = content.replace(
  /description:\s*'Pingbox reads your business documents and responds to customer messages on WhatsApp in 30 seconds\. Unified inbox for WhatsApp, Telegram & SMS with AI-powered replies\. Try free for 14 days\.',/g,
  newDesc
);
content = content.replace(
  /description:\s*'Stop losing leads to slow replies\. Pingbox uses AI to respond on WhatsApp in 30 seconds using your own business documents\.',/g,
  newDesc
);

// Title OpenGraph and Twitter
content = content.replace(
  /title:\s*'Pingbox — AI-Powered WhatsApp Inbox for Service Businesses',/g,
  "title: 'Pingbox — AI That Responds to Your Customers in 30 Seconds',"
);

// Keywords
content = content.replace(
  /keywords:\s*\[[a-zA-Z0-9', \-\n]+\]/,
  `keywords: [
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
  ]`
);

// Images Array string replace
content = content.replace(
  /\/images\/hero\.svg/g,
  '/images/brand/og-image.png'
);

content = content.replace(
  /alt:\s*'Pingbox — AI-Powered WhatsApp Inbox for Service Businesses'/g,
  "alt: 'Pingbox — AI-powered messaging for service businesses'"
);

// add siteName if it somehow still had camel casing mismatch
content = content.replace(/siteName:\s*'Ping[bB]ox'/g, "siteName: 'Pingbox'");

// Icons
if (!content.includes('icons:')) {
  content = content.replace(
    /category: 'technology',/,
    `category: 'technology',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/images/brand/favicon.svg',
  },`
  );
}

if (!content.includes("applicationName: 'Pingbox'")) {
  content = content.replace(
    /category: 'technology',/,
    `applicationName: 'Pingbox',
  category: 'technology',
  classification: 'Business Software',`
  );
}

// Add className="scroll-smooth"
content = content.replace(
  /<html lang="en" suppressHydrationWarning>/,
  '<html lang="en" suppressHydrationWarning className="scroll-smooth">'
);

fs.writeFileSync('src/app/layout.tsx', content);
