import { Timestamp } from 'firebase/firestore';

// ============================================
// BROADCAST & CAMPAIGN TYPES
// Firestore collection: broadcasts
// ============================================

export type BroadcastChannel = 'whatsapp' | 'telegram' | 'email';
export type BroadcastStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled';
export type RecipientStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'replied' | 'failed';

export interface BroadcastTemplate {
  id: string;
  icon: string;
  title: string;
  desc: string;
  category: 'engagement' | 'property' | 'promotional' | 'event';
  popular: boolean;
  message: string;
  tips: string[];
}

export interface BroadcastButton {
  text: string;
  type: 'quick_reply' | 'url' | 'phone';
  value?: string; // URL or phone number for those types
}

export interface BroadcastRecipient {
  id: string;
  contactId: string;
  name: string;
  phone: string;
  platform: BroadcastChannel;
  status: RecipientStatus;
  sentAt?: Date | Timestamp | null;
  deliveredAt?: Date | Timestamp | null;
  readAt?: Date | Timestamp | null;
  repliedAt?: Date | Timestamp | null;
  failedAt?: Date | Timestamp | null;
  failureReason?: string;
  messageId?: string; // WhatsApp/Telegram message ID
}

export interface BroadcastMetrics {
  totalRecipients: number;
  sent: number;
  delivered: number;
  read: number;
  replied: number;
  failed: number;
  deliveryRate: number;
  readRate: number;
  replyRate: number;
}

export interface Broadcast {
  id: string;
  partnerId: string;

  // Campaign details
  title: string;
  channel: BroadcastChannel;
  status: BroadcastStatus;

  // Message content
  message: string;
  hasImage: boolean;
  imageUrl?: string;
  buttons: BroadcastButton[];
  templateId?: string; // If created from a template

  // Recipients - stored as subcollection for large lists
  recipientCount: number;
  recipientGroupId?: string; // Reference to contact group

  // Metrics (updated in real-time)
  metrics: BroadcastMetrics;

  // Scheduling
  scheduledFor?: Date | Timestamp | null;

  // Timestamps
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  sentAt?: Date | Timestamp | null;
  completedAt?: Date | Timestamp | null;

  // Created by
  createdBy: string; // User ID
  createdByName?: string;
}

// For creating a new broadcast
export interface CreateBroadcastInput {
  partnerId: string;
  title: string;
  channel: BroadcastChannel;
  message: string;
  hasImage?: boolean;
  imageUrl?: string;
  buttons?: BroadcastButton[];
  templateId?: string;
  recipientContactIds: string[];
  recipientGroupId?: string;
  scheduledFor?: Date | null;
  createdBy: string;
  createdByName?: string;
}

// For updating a broadcast
export interface UpdateBroadcastInput {
  broadcastId: string;
  partnerId: string;
  title?: string;
  message?: string;
  hasImage?: boolean;
  imageUrl?: string;
  buttons?: BroadcastButton[];
  scheduledFor?: Date | null;
}

// Result types
export interface BroadcastResult {
  success: boolean;
  message: string;
  broadcastId?: string;
  broadcast?: Broadcast;
}

export interface SendBroadcastResult {
  success: boolean;
  message: string;
  totalSent: number;
  totalFailed: number;
  errors?: string[];
}

// Contact group for recipient selection
export interface ContactGroup {
  id: string;
  partnerId: string;
  name: string;
  description?: string;
  filterCriteria?: {
    tags?: string[];
    stage?: string[];
    lastContactedDays?: number;
    hasPhone?: boolean;
  };
  contactCount: number;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Default metrics
export const DEFAULT_BROADCAST_METRICS: BroadcastMetrics = {
  totalRecipients: 0,
  sent: 0,
  delivered: 0,
  read: 0,
  replied: 0,
  failed: 0,
  deliveryRate: 0,
  readRate: 0,
  replyRate: 0,
};

// Predefined templates
export const BROADCAST_TEMPLATES: BroadcastTemplate[] = [
  {
    id: 'intro',
    icon: '👋',
    title: 'Introduce Yourself',
    desc: 'First message to new clients',
    category: 'engagement',
    popular: true,
    message: `Hi {{name}}! 👋\n\nI'm {{agent_name}} from *{{business_name}}*.\n\nI specialize in helping clients find their perfect property. Whether you're looking to buy, sell, or invest — I'm here to help.\n\nFeel free to reach out anytime!\n\nBest regards,\n{{agent_name}}`,
    tips: ['Great for new leads', 'Sets professional tone', 'Builds trust early'],
  },
  {
    id: 'listing',
    icon: '🏠',
    title: 'Property Alert',
    desc: 'Announce new listings',
    category: 'property',
    popular: true,
    message: `Hi {{name}}! 🏠\n\nNew listing matching your criteria:\n\n📍 *{{property_name}}*\n💰 {{price}}\n\n✓ Prime location\n✓ Ready to move\n✓ Loan approved\n\nInterested in a visit this week?`,
    tips: ['Include key specs upfront', 'Add image for 3x engagement', 'End with clear CTA'],
  },
  {
    id: 'event',
    icon: '📅',
    title: 'Event Invitation',
    desc: 'Open house & launches',
    category: 'event',
    popular: true,
    message: `Hi {{name}}!\n\nYou're invited to an exclusive property showcase:\n\n📅 *{{date}}*\n🕐 10 AM - 4 PM\n📍 {{venue}}\n\n50+ buyers already confirmed.\n\nReply YES to reserve your spot.`,
    tips: ['Social proof increases signups 45%', 'Clear date/time/venue', 'Simple RSVP mechanism'],
  },
  {
    id: 'festive',
    icon: '🎉',
    title: 'Festive Greetings',
    desc: 'Seasonal wishes',
    category: 'engagement',
    popular: false,
    message: `Happy {{festival}}, {{name}}! 🎉\n\nWishing you and your family joy, prosperity, and new beginnings.\n\nMay this year bring you closer to your dream home!\n\nWarm regards,\n{{agent_name}}\n*{{business_name}}*`,
    tips: ['Send in morning for best engagement', 'Personal touch matters', 'Great for re-engagement'],
  },
  {
    id: 'offer',
    icon: '🏷️',
    title: 'Special Offer',
    desc: 'Deals with urgency',
    category: 'promotional',
    popular: true,
    message: `Hi {{name}}! 🎯\n\n*Limited Time Offer*\n\nBook before *{{deadline}}* and get:\n\n✓ Zero brokerage (Save ₹2L+)\n✓ Free registration\n✓ Priority support\n\n⏰ Only 5 slots left!\n\nInterested?`,
    tips: ['Deadlines boost conversions 32%', 'Clear value proposition', 'Scarcity drives action'],
  },
  {
    id: 'followup',
    icon: '🔄',
    title: 'Follow-up',
    desc: 'Re-engage leads',
    category: 'engagement',
    popular: false,
    message: `Hi {{name}}!\n\nJust checking in — still exploring property options?\n\nI have some new listings that might interest you:\n\n🏠 New projects in your preferred areas\n💰 Better financing options available\n\nWhen's a good time for a quick chat?\n\n{{agent_name}}`,
    tips: ['Non-pushy tone works best', 'Provide value/updates', 'Easy response path'],
  },
  {
    id: 'pricedrop',
    icon: '📉',
    title: 'Price Drop',
    desc: 'Price reduction alerts',
    category: 'property',
    popular: false,
    message: `Hi {{name}}! 📉\n\nGreat news! A property you viewed has a *price drop*:\n\n🏠 *{{property_name}}*\n~~₹2.2 Cr~~ → *{{price}}*\n\nThat's ₹40 Lakhs savings!\n\nInterested in revisiting?`,
    tips: ['Reference past interest', 'Show clear savings', 'Create urgency'],
  },
  {
    id: 'review',
    icon: '⭐',
    title: 'Request Review',
    desc: 'Get testimonials',
    category: 'engagement',
    popular: false,
    message: `Hi {{name}}! 🙏\n\nThank you for choosing *{{business_name}}*!\n\nYour feedback helps us improve. Would you mind sharing your experience?\n\n⭐ Takes just 2 minutes\n⭐ Helps other buyers decide\n\nThank you!\n{{agent_name}}`,
    tips: ['Best sent post-transaction', 'Make it easy', 'Express gratitude'],
  },
];

// Template categories
export const BROADCAST_TEMPLATE_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'property', label: 'Property' },
  { id: 'promotional', label: 'Promotional' },
  { id: 'event', label: 'Events' },
] as const;

// Personalization variables
export const BROADCAST_VARIABLES = [
  { token: '{{name}}', label: 'Client Name', preview: 'Rajesh', field: 'name' },
  { token: '{{agent_name}}', label: 'Your Name', preview: 'Priya', field: 'agentName' },
  { token: '{{business_name}}', label: 'Business', preview: 'Prime Properties', field: 'businessName' },
  { token: '{{property_name}}', label: 'Property', preview: '3BHK Sea View, Powai', field: 'propertyName' },
  { token: '{{price}}', label: 'Price', preview: '₹1.8 Cr', field: 'price' },
  { token: '{{date}}', label: 'Date', preview: 'Sunday, Jan 12', field: 'date' },
  { token: '{{venue}}', label: 'Venue', preview: 'Powai, Mumbai', field: 'venue' },
  { token: '{{deadline}}', label: 'Deadline', preview: 'Jan 31', field: 'deadline' },
  { token: '{{festival}}', label: 'Festival', preview: 'New Year', field: 'festival' },
] as const;

// Helper to substitute variables in a message
export function substituteVariables(
  message: string,
  values: Record<string, string>
): string {
  let result = message;
  for (const variable of BROADCAST_VARIABLES) {
    const value = values[variable.field] || variable.preview;
    result = result.replace(new RegExp(variable.token.replace(/[{}]/g, '\\$&'), 'g'), value);
  }
  return result;
}
