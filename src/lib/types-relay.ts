// === RELAY TYPE DEFINITIONS ===
// All types for the Pingbox Relay embeddable widget system

export type RelayBlockType =
  | 'rooms'       // Expandable room/product cards
  | 'book'        // Multi-step booking flow
  | 'compare'     // Side-by-side comparison table
  | 'activities'  // Filterable activity/service grid
  | 'location'    // Map card with directions
  | 'contact'     // Multi-channel contact options
  | 'gallery'     // Photo grid
  | 'info'        // Structured data card (key-value)
  | 'menu'        // Restaurant menu with cart
  | 'services'    // Service catalog with pricing
  | 'text';       // Plain text with suggestions

// === RELAY THEME ===
export interface RelayTheme {
  accentColor: string;      // Primary brand color
  accentDarkColor: string;  // Darker variant
  backgroundColor: string; // Widget background
  surfaceColor: string;     // Card/bubble background
  textColor: string;        // Primary text
  fontFamily: string;       // 'Outfit' | 'Inter' | 'DM Sans' | etc.
  borderRadius: 'sharp' | 'rounded' | 'pill';
  mode: 'light' | 'dark';
}

// === RELAY INTENT ===
export interface RelayIntent {
  id: string;
  icon: string;     // Emoji
  label: string;    // Display text (max 12 chars)
  prompt: string;   // What gets sent to AI when tapped
  uiBlock: RelayBlockType;
  enabled: boolean;
  order: number;
}

// === RELAY CONFIGURATION (stored per partner) ===
export interface RelayConfig {
  id: string;
  partnerId: string;
  enabled: boolean;
  widgetId: string; // Unique public ID for embed (e.g., "the-tides-goa")

  // Appearance
  theme: RelayTheme;
  brandName: string;
  brandTagline?: string;
  brandLogo?: string;       // Firebase Storage URL
  avatarEmoji?: string;     // Fallback if no logo
  avatarInitials?: string;  // Fallback if no logo

  // Behavior
  welcomeMessage: string;
  intents: RelayIntent[];
  systemPrompt?: string;   // Custom system prompt override
  responseFormat: 'generative_ui' | 'text_only';

  // Integration
  embedDomain?: string;
  whatsappEnabled: boolean;
  callbackEnabled: boolean;
  directBookingEnabled: boolean;
  externalBookingUrl?: string;

  // Analytics
  totalConversations: number;
  totalLeads: number;
  lastActiveAt?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// === RELAY UI BLOCK ===
export interface RelayUIBlock {
  type: RelayBlockType;
  text: string;            // AI's text response
  items?: Record<string, unknown>[];  // Structured data for the block
  suggestions?: string[];  // Follow-up prompts
}

// === RELAY MESSAGE ===
export interface RelayMessage {
  id: string;
  role: 'visitor' | 'bot';
  text?: string;           // For visitor messages
  block?: RelayUIBlock;    // For bot messages (generative UI)
  timestamp: string;
  reactions?: string[];
  replyToId?: string;
}

// === RELAY CONVERSATION ===
export interface RelayConversation {
  id: string;
  partnerId: string;
  widgetId: string;
  visitorId: string;
  visitorName?: string;
  visitorContact?: string;
  visitorContactType?: 'whatsapp' | 'phone' | 'email';

  messages: RelayMessage[];
  messageCount: number;

  // Lead scoring
  intentSignals: string[];
  leadScore: 'cold' | 'warm' | 'hot';
  convertedAt?: string;
  conversionType?: 'direct_book' | 'whatsapp' | 'callback' | 'save_quote' | 'share';

  // Source tracking
  sourceUrl?: string;
  sourceDomain?: string;
  userAgent?: string;

  // Metadata
  startedAt: string;
  lastMessageAt: string;
  status: 'active' | 'converted' | 'abandoned';
}

// === RELAY BLOCK DATA SCHEMA ===
export interface RelayBlockDataSchema {
  sourceCollection: string;
  sourceFields: string[];
  displayTemplate: string;
  maxItems?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// === RELAY BLOCK CONFIG (Admin-managed per business category) ===
export interface RelayBlockConfig {
  id: string;
  blockType: RelayBlockType;
  label: string;
  description: string;

  applicableIndustries: string[];
  applicableFunctions: string[];

  dataSchema: RelayBlockDataSchema;
  aiPromptFragment: string;

  defaultIntent?: Partial<RelayIntent>;

  status: 'active' | 'draft';
  createdAt: string;
  updatedAt: string;
}

// === RELAY DIAGNOSTICS ===
export interface RelayDiagnosticCheck {
  id: string;
  name: string;
  description: string;
  status: 'pass' | 'warn' | 'fail';
  details?: string;
  fix?: string;
}

export interface RelayDiagnostics {
  widgetId: string;
  partnerId: string;
  checks: RelayDiagnosticCheck[];
  lastCheckedAt: string;
  overallStatus: 'healthy' | 'warning' | 'error';
}

// === DEFAULT THEME ===
export const DEFAULT_RELAY_THEME: RelayTheme = {
  accentColor: '#4F46E5',
  accentDarkColor: '#3730A3',
  backgroundColor: '#FFFFFF',
  surfaceColor: '#F9FAFB',
  textColor: '#111827',
  fontFamily: 'Inter',
  borderRadius: 'rounded',
  mode: 'light',
};

// === DEFAULT INTENTS ===
export const DEFAULT_RELAY_INTENTS: RelayIntent[] = [
  { id: 'rooms', icon: '🛏️', label: 'Our Rooms', prompt: 'Show me your available rooms and pricing', uiBlock: 'rooms', enabled: true, order: 0 },
  { id: 'book', icon: '📅', label: 'Book Now', prompt: 'I want to make a booking', uiBlock: 'book', enabled: true, order: 1 },
  { id: 'activities', icon: '🏄', label: 'Activities', prompt: 'What activities and experiences do you offer?', uiBlock: 'activities', enabled: true, order: 2 },
  { id: 'location', icon: '📍', label: 'Location', prompt: 'Where are you located and how do I get there?', uiBlock: 'location', enabled: true, order: 3 },
  { id: 'contact', icon: '💬', label: 'Contact Us', prompt: 'I want to speak with someone directly', uiBlock: 'contact', enabled: true, order: 4 },
];
