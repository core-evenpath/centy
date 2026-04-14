// Optional data shapes forwarded to admin preview components. Each
// `data` prop is optional: when omitted the preview falls back to its
// hardcoded design sample, keeping the admin flow visualizer stable.
// The Relay chat route fills these at runtime from partner doc + module
// items so the Test Chat shows real data inside the admin designs.

export interface GreetingPreviewData {
  brandName?: string;
  initial?: string;
  tagline?: string;
  welcomeMessage?: string;
  quickActions?: Array<{ label: string; icon?: string }>;
}

export interface ProductCardPreviewData {
  items?: Array<{
    name: string;
    desc?: string;
    price?: number;
    priceLabel?: string;
    badge?: string;
    rating?: number;
    reviews?: number;
    bg?: string;
  }>;
}

export interface ContactPreviewData {
  items?: Array<{ label: string; value: string; icon?: string }>;
}

export interface BlockPreviewProps {
  data?: GreetingPreviewData | ProductCardPreviewData | ContactPreviewData | Record<string, unknown>;
}
