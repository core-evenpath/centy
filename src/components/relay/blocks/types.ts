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

export interface QuizOption {
  label: string;
  selected?: boolean;
}

export interface QuizStep {
  question: string;
  hint?: string;
  options: QuizOption[];
  currentStep: number;
  totalSteps: number;
}

export interface ConcernOption {
  id: string;
  label: string;
  icon: string;
}

export interface ProductDetailData {
  id: string;
  name: string;
  brand?: string;
  description: string;
  price: number;
  currency: string;
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  badge?: string;
  emoji?: string;
  color?: string;
  colorEnd?: string;
  sizes?: string[];
  selectedSize?: number;
  features?: string[];
  ctaLabel?: string;
}

export interface IngredientItem {
  name: string;
  role: string;
  concentration?: string;
}

export interface ShadeOption {
  label: string;
  gradient: string;
  selected?: boolean;
}

export interface ShadeMatch {
  name: string;
  subtitle: string;
  swatchGradient: string;
}

export interface RoutineStep {
  name: string;
  price: number;
}

export interface RoutineData {
  amSteps: RoutineStep[];
  pmSteps: RoutineStep[];
  totalPrice: number;
  discountPercent?: number;
  skinProfile?: string;
}

export interface BundleItem {
  name: string;
  price: number;
}

export interface BundleData {
  title: string;
  subtitle?: string;
  items: BundleItem[];
  originalTotal: number;
  bundlePrice: number;
  badge?: string;
  color?: string;
  colorEnd?: string;
}

export interface GiftCardData {
  amounts: number[];
  selectedIndex?: number;
  currency: string;
  brandName?: string;
  color?: string;
  colorEnd?: string;
}

export interface CartItem {
  name: string;
  variant?: string;
  price: number;
  emoji?: string;
}

export interface CartData {
  items: CartItem[];
  subtotal: number;
  discount?: number;
  discountLabel?: string;
  shippingThreshold?: number;
  shipping?: number;
  total: number;
  promoCode?: string;
}

export interface PaymentMethod {
  label: string;
  subtitle: string;
  selected?: boolean;
  bgColor?: string;
}

export interface CheckoutData {
  total: number;
  currency: string;
  methods: PaymentMethod[];
}

export interface ConfirmationItem {
  name: string;
  price: string;
}

export interface ConfirmationData {
  orderId: string;
  items: ConfirmationItem[];
  total: number;
  currency: string;
  shipping?: string;
  estimatedDelivery?: string;
}

export interface OrderTrackerData {
  orderId: string;
  orderDate?: string;
  steps: string[];
  currentStep: string;
  carrier?: string;
  estimatedArrival?: string;
}

export interface ReturnReason {
  label: string;
  selected?: boolean;
}

export interface ReturnOption {
  label: string;
  subtitle: string;
  selected?: boolean;
}

export interface ReturnData {
  productName: string;
  orderId: string;
  deliveredDate?: string;
  reasons: ReturnReason[];
  options: ReturnOption[];
  policyNote?: string;
}

export interface ReorderItem {
  name: string;
  price: number;
  emoji?: string;
}

export interface ReorderData {
  items: ReorderItem[];
  total: number;
  currency: string;
  daysSinceOrder?: number;
}

export interface SubscriptionFrequency {
  label: string;
  discount: string;
  price: string;
  selected?: boolean;
}

export interface SubscriptionData {
  productName: string;
  productDesc?: string;
  oneTimePrice: number;
  currency: string;
  frequencies: SubscriptionFrequency[];
  emoji?: string;
  color?: string;
}

export interface LoyaltyData {
  tierName: string;
  points: number;
  nextTier?: string;
  pointsToNext?: number;
  progressPercent: number;
  redeemableValue?: string;
  perks?: Array<{ label: string; value: string; emoji?: string; color?: string }>;
}

export interface WishlistItem {
  name: string;
  price: number;
  originalPrice?: number;
  flag?: string;
  flagColor?: string;
  emoji?: string;
}

export interface ReferralData {
  givesAmount: string;
  getsAmount: string;
  code: string;
  currency: string;
  friendsJoined?: number;
  totalEarned?: string;
}

export interface SocialProofStat {
  value: string;
  label: string;
}

export interface SocialProofData {
  stats: SocialProofStat[];
  badges?: string[];
  certifications?: string[];
}

export interface FeedbackData {
  productName: string;
  deliveredAgo?: string;
  rewardPoints?: number;
  maxStars?: number;
}

export interface BookingSlot {
  time: string;
  selected?: boolean;
}

export interface BookingData {
  title: string;
  subtitle?: string;
  slots: BookingSlot[];
  includes?: string[];
  ctaLabel?: string;
  price?: string;
  color?: string;
}
