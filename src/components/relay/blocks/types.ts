export interface RelayTheme {
  bg: string;
  surface: string;
  warm: string;
  sand: string;
  accent: string;
  accentHi: string;
  accentDk: string;
  accentBg: string;
  accentBg2: string;
  text: string;
  t2: string;
  t3: string;
  t4: string;
  t5: string;
  bdr: string;
  bdrL: string;
  green: string;
  greenBg: string;
  greenBdr: string;
  wa: string;
  blue: string;
  red: string;
  sh: string;
  shM: string;
  shL: string;
  fontFamily: string;
  headingFont: string;
}

export const DEFAULT_THEME: RelayTheme = {
  bg: "#FAFAF6",
  surface: "#FFFFFF",
  warm: "#F4F1EA",
  sand: "#EBE7DE",
  accent: "#A2845B",
  accentHi: "#BFA07A",
  accentDk: "#8A6E45",
  accentBg: "rgba(162,132,91,0.06)",
  accentBg2: "rgba(162,132,91,0.13)",
  text: "#1A2632",
  t2: "#4A5E6F",
  t3: "#7B8E9E",
  t4: "#A8B8C4",
  t5: "#CDD5DC",
  bdr: "#E4DFD4",
  bdrL: "#EDE9E0",
  green: "#3A9B70",
  greenBg: "rgba(58,155,112,0.06)",
  greenBdr: "rgba(58,155,112,0.15)",
  wa: "#25D366",
  blue: "#3478F6",
  red: "#D94839",
  sh: "0 1px 3px rgba(26,38,50,0.04), 0 4px 12px rgba(26,38,50,0.03)",
  shM: "0 2px 8px rgba(26,38,50,0.06), 0 8px 24px rgba(26,38,50,0.04)",
  shL: "0 4px 12px rgba(26,38,50,0.08), 0 16px 48px rgba(26,38,50,0.06)",
  fontFamily: "'Outfit', system-ui, sans-serif",
  headingFont: "'Playfair Display', serif",
};

export interface CatalogItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  currency: string;
  unit?: string;
  subtitle?: string;
  tagline?: string;
  emoji?: string;
  color?: string;
  colorEnd?: string;
  rating?: number;
  reviewCount?: number;
  badges?: string[];
  features?: string[];
  specs?: Array<{ label: string; value: string }>;
  maxCapacity?: number;
}

export interface ActivityItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  price: string;
  duration: string;
  category: string;
  bookable: boolean;
}

export interface InfoItem {
  label: string;
  value: string;
}

export interface ContactMethod {
  type: "whatsapp" | "phone" | "email" | "website" | "chat";
  label: string;
  value: string;
  icon: string;
}

export interface GalleryItem {
  emoji: string;
  label: string;
  span?: number;
}

export interface ConversionPath {
  id: string;
  label: string;
  icon: string;
  type: "primary" | "secondary";
  color?: string;
  action: "direct" | "whatsapp" | "callback" | "save" | "share" | "ask" | "external";
  externalUrl?: string;
  inputPlaceholder?: string;
}

export interface LocationData {
  name: string;
  address: string;
  area: string;
  emoji?: string;
  mapGradient?: [string, string];
  directions?: Array<{ icon: string; label: string; detail: string }>;
  actions?: string[];
}

export interface BlockCartItemRef {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  variant?: string;
  image?: string;
}

export interface BlockCartContext {
  items: BlockCartItemRef[];
  subtotal: number;
  total: number;
  discountCode?: string;
  discountAmount?: number;
}

export interface BlockAddToCartArgs {
  itemId: string;
  moduleSlug: string;
  name: string;
  price: number;
  quantity?: number;
  variant?: string;
  image?: string;
}

export interface BlockReserveSlotArgs {
  slotId: string;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  staffId?: string;
  staffName?: string;
}

export interface BlockCallbacks {
  onSendMessage?: (text: string) => void;
  onCaptureContact?: (data: {
    name: string;
    contact: string;
    contactType: string;
    conversionType: string;
    itemId?: string;
  }) => void;
  onExternalLink?: (url: string) => void;
  onLeadSubmit?: (data: Record<string, string>) => void;
  onHandoff?: (option: { type: string; value?: string }) => void;
  onPromoClick?: (promoId: string) => void;
  onScheduleBook?: (slotId: string) => void;

  // ── Session-aware actions (Phase 2) ──
  // Implementations should resolve once the server has accepted the
  // mutation. Callers may show optimistic UI before the promise settles.
  onAddToCart?: (item: BlockAddToCartArgs) => Promise<unknown> | void;
  onUpdateCartItem?: (itemId: string, quantity: number) => Promise<unknown> | void;
  onRemoveFromCart?: (itemId: string) => Promise<unknown> | void;
  onClearCart?: () => Promise<unknown> | void;
  onApplyDiscount?: (code: string) => Promise<unknown> | void;
  onReserveSlot?: (slot: BlockReserveSlotArgs) => Promise<unknown> | void;
  onCancelSlot?: (slotId: string) => Promise<unknown> | void;
  onConfirmBooking?: () => Promise<unknown> | void;

  // Checkout — opens the host's checkout flow (address form + payment).
  // Resolved when the order is created or the user cancels.
  onCheckout?: () => Promise<unknown> | void;

  // Live cart snapshot for blocks that need to render it (e.g. CartBlock).
  cart?: BlockCartContext;
}

export interface PricingTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  unit?: string;
  features: string[];
  isPopular?: boolean;
  emoji?: string;
  color?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  text: string;
  rating?: number;
  date?: string;
  avatar?: string;
  source?: string;
}

export interface QuickAction {
  id: string;
  label: string;
  emoji: string;
  prompt: string;
  description?: string;
  color?: string;
}

export interface ScheduleSlot {
  id: string;
  time: string;
  endTime?: string;
  title: string;
  instructor?: string;
  spots?: number;
  price?: string;
  emoji?: string;
  isAvailable: boolean;
}

export interface PromoOffer {
  id: string;
  title: string;
  description: string;
  discount?: string;
  code?: string;
  validUntil?: string;
  emoji?: string;
  color?: string;
  colorEnd?: string;
  ctaLabel?: string;
  ctaPrompt?: string;
}

export interface LeadField {
  id: string;
  label: string;
  type: 'text' | 'phone' | 'email' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

export interface HandoffOption {
  id: string;
  type: 'whatsapp' | 'phone' | 'callback' | 'chat';
  label: string;
  value?: string;
  icon: string;
  description?: string;
}
