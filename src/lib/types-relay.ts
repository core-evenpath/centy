// ============================================================================
// RELAY FEATURE — TYPE DEFINITIONS
// ============================================================================

// === BLOCK TYPES ===
export type RelayBlockType =
  | 'rooms'        // Expandable room/product cards
  | 'book'         // Multi-step booking flow
  | 'compare'      // Side-by-side comparison table
  | 'activities'   // Filterable activity/service grid
  | 'location'     // Map card with directions
  | 'contact'      // Multi-channel contact options
  | 'gallery'      // Photo grid
  | 'info'         // Structured data card (key-value)
  | 'menu'         // Restaurant menu with cart
  | 'services'     // Service catalog with pricing
  | 'text';        // Plain text with suggestions

// === RELAY THEME ===
export interface RelayTheme {
  accentColor: string;
  accentDarkColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  fontFamily: string;
  borderRadius: 'sharp' | 'rounded' | 'pill';
  mode: 'light' | 'dark';
}

// === RELAY INTENT ===
export interface RelayIntent {
  id: string;
  icon: string;          // Emoji
  label: string;         // Display text (max 12 chars)
  prompt: string;        // What gets sent to AI when tapped
  uiBlock: RelayBlockType;
  enabled: boolean;
  order: number;
}

// === RELAY BLOCK DATA SCHEMA ===
export interface RelayBlockDataSchema {
  sourceCollection: string;       // 'modules' or 'vaultFiles'
  sourceModuleSlug?: string;      // Exact module slug this block reads from
  sourceFields: string[];         // Actual field IDs from the module schema
  displayTemplate: string;
  maxItems?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// === RELAY BLOCK CONFIG (Admin-managed, co-generated with modules) ===
export interface RelayBlockConfig {
  id: string;
  blockType: RelayBlockType;
  label: string;
  description: string;

  // Taxonomy linkage — SAME values as the SystemModule it was generated with
  applicableIndustries: string[];
  applicableFunctions: string[];

  // Link back to the module that generated this block (null for functional blocks like 'book', 'contact', 'location')
  sourceModuleId?: string;
  sourceModuleSlug?: string;

  // Schema for data retrieval — uses REAL field IDs from the linked module
  dataSchema: RelayBlockDataSchema;

  // AI prompt fragment injected into Relay system prompt
  aiPromptFragment: string;

  // Default intent chip for the widget
  defaultIntent?: Partial<RelayIntent>;

  status: 'active' | 'draft';
  createdAt: string;
  updatedAt: string;
}

// === RELAY CONFIGURATION (stored per partner) ===
export interface RelayConfig {
  id: string;
  partnerId: string;
  enabled: boolean;
  widgetId: string;

  theme: RelayTheme;
  brandName: string;
  brandTagline?: string;
  brandLogo?: string;
  avatarEmoji?: string;
  avatarInitials?: string;

  welcomeMessage: string;
  intents: RelayIntent[];
  systemPrompt?: string;
  responseFormat: 'generative_ui' | 'text_only';

  embedDomain?: string;
  whatsappEnabled: boolean;
  callbackEnabled: boolean;
  directBookingEnabled: boolean;
  externalBookingUrl?: string;

  totalConversations: number;
  totalLeads: number;
  lastActiveAt?: string;

  createdAt: string;
  updatedAt: string;
}

// === RELAY UI BLOCK (AI response payload) ===
export interface RelayUIBlock {
  type: RelayBlockType;
  text: string;
  items?: Record<string, unknown>[];
  suggestions?: string[];
}

// === RELAY MESSAGE ===
export interface RelayMessage {
  id: string;
  role: 'visitor' | 'bot';
  text?: string;
  block?: RelayUIBlock;
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

  intentSignals: string[];
  leadScore: 'cold' | 'warm' | 'hot';
  convertedAt?: string;
  conversionType?: 'direct_book' | 'whatsapp' | 'callback' | 'save_quote' | 'share';

  sourceUrl?: string;
  sourceDomain?: string;
  userAgent?: string;

  startedAt: string;
  lastMessageAt: string;
  status: 'active' | 'converted' | 'abandoned';
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

// === DEFAULTS ===
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

export const DEFAULT_RELAY_INTENTS: RelayIntent[] = [
  { id: 'explore', icon: '🔍', label: 'Explore', prompt: 'Show me what you offer', uiBlock: 'info', enabled: true, order: 0 },
  { id: 'pricing', icon: '💰', label: 'Pricing', prompt: 'What are your prices?', uiBlock: 'services', enabled: true, order: 1 },
  { id: 'book', icon: '📅', label: 'Book Now', prompt: 'I want to make a booking', uiBlock: 'book', enabled: true, order: 2 },
  { id: 'contact', icon: '💬', label: 'Contact', prompt: 'How can I reach you?', uiBlock: 'contact', enabled: true, order: 3 },
  { id: 'location', icon: '📍', label: 'Location', prompt: 'Where are you located?', uiBlock: 'location', enabled: true, order: 4 },
];
