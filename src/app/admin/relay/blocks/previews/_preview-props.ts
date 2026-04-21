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

// P2.M03: order_tracker reads recent orders for the session's
// resolved contactId. Anon sessions (no identity) see empty orders;
// the preview renders its hardcoded design sample for them.
export interface OrderTrackerPreviewData {
  orders?: Array<{
    id: string;
    shortId: string;                       // display-friendly (e.g. #ORD-847291)
    status: string;                        // existing OrderStatus enum values
    statusLabel: string;                   // human-readable (e.g. "Shipped")
    total: number;
    currency: string;
    itemCount: number;
    createdAt: string;
    trackingUrl?: string;
  }>;
}

// M03 follow-up: booking_confirmation + space_confirmation. Wide
// shapes — preview reads first item, falls back to design sample
// when absent.

export interface BookingConfirmationPreviewData {
  bookings?: Array<{
    bookingId?: string;
    status?: string;
    createdAt?: string;
    hold?: { resourceId?: string; startAt?: string; endAt?: string };
    slots?: Array<{ serviceName?: string; date?: string; time?: string }>;
  }>;
}

export interface SpaceConfirmationPreviewData {
  reservations?: Array<{
    reservationId?: string;
    status?: string;
    createdAt?: string;
    hold?: { resourceId?: string; checkIn?: string; checkOut?: string };
  }>;
}

export interface BlockPreviewProps {
  data?:
    | GreetingPreviewData
    | ProductCardPreviewData
    | ContactPreviewData
    | OrderTrackerPreviewData
    | BookingConfirmationPreviewData
    | SpaceConfirmationPreviewData
    | Record<string, unknown>;
}
