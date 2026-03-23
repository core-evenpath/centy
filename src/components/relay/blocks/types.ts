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
}
