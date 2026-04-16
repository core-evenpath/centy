// ─── Content Studio theme tokens ────────────────────────────────

export const ACCENT = '#c2410c'; // orange-700

export const theme = {
    accentBg: 'rgba(194,65,12,0.05)',
    accentBg2: 'rgba(194,65,12,0.10)',
    bg: '#faf8f5',
    surface: '#ffffff',
    t1: '#1c1917',
    t2: '#44403c',
    t3: '#78716c',
    t4: '#a8a29e',
    bdrL: '#e7e5e4',
    bdrM: '#d6d3d1',
    green: '#16a34a',
    greenBg: 'rgba(22,163,74,0.06)',
    greenBdr: 'rgba(22,163,74,0.14)',
    greenBdr2: 'rgba(22,163,74,0.35)',
    red: '#dc2626',
    redBg: 'rgba(220,38,38,0.05)',
    amber: '#d97706',
    amberBg: 'rgba(217,119,6,0.06)',
    amberBdr: 'rgba(217,119,6,0.14)',
    amberBdr2: 'rgba(217,119,6,0.35)',
} as const;

// ─── Vertical preview content (Bug 1 fix) ───────────────────────

export interface PreviewItem {
    name: string;
    price: string;
    oldPrice?: string;
    code: string;
}

export interface VerticalPreview {
    greeting: string;
    items: PreviewItem[];
    shippingLabel?: string;
    shippingDetail?: string;
    actions: string[];
}

const ecomPreview: VerticalPreview = {
    greeting: 'Here are our top picks:',
    items: [
        { name: 'Classic Linen Shirt', price: '2,490', oldPrice: '3,200', code: 'LS' },
        { name: 'Organic Cotton Tee', price: '1,290', code: 'CT' },
    ],
    shippingLabel: 'Shipping',
    shippingDetail: 'Free above ₹1,999 · 3-5 days',
    actions: ['View all', 'Compare'],
};

const hospitalityPreview: VerticalPreview = {
    greeting: 'Here are our available rooms:',
    items: [
        { name: 'Deluxe Lake View', price: '4,500', oldPrice: '5,800', code: 'DL' },
        { name: 'Standard Garden', price: '2,800', code: 'SG' },
    ],
    shippingLabel: 'Check-in',
    shippingDetail: '2 PM · Early check-in on request',
    actions: ['Book now', 'View all rooms'],
};

const healthcarePreview: VerticalPreview = {
    greeting: 'Our available services:',
    items: [
        { name: 'General Consultation', price: '500', code: 'GC' },
        { name: 'Dental Check-up', price: '800', code: 'DC' },
    ],
    shippingLabel: 'Appointments',
    shippingDetail: 'Same-day slots available',
    actions: ['Book slot', 'View all'],
};

const foodPreview: VerticalPreview = {
    greeting: 'Our menu highlights:',
    items: [
        { name: 'Farm-to-Table Thali', price: '350', code: 'FT' },
        { name: 'Artisan Sourdough Pizza', price: '490', code: 'AP' },
    ],
    shippingLabel: 'Delivery',
    shippingDetail: '30 min · Free above ₹499',
    actions: ['Order now', 'Full menu'],
};

const automotivePreview: VerticalPreview = {
    greeting: 'Services we offer:',
    items: [
        { name: 'Full Car Service', price: '3,999', oldPrice: '4,999', code: 'FS' },
        { name: 'AC Gas Top-up', price: '1,200', code: 'AC' },
    ],
    shippingLabel: 'Pickup',
    shippingDetail: 'Free doorstep pickup & drop',
    actions: ['Book service', 'Get quote'],
};

const travelPreview: VerticalPreview = {
    greeting: 'Top packages for you:',
    items: [
        { name: 'Ooty Weekend Escape', price: '8,999', oldPrice: '11,500', code: 'OW' },
        { name: 'Coonoor Heritage Walk', price: '1,500', code: 'CH' },
    ],
    shippingLabel: 'Includes',
    shippingDetail: 'Stay · Meals · Transport',
    actions: ['Book now', 'Customize'],
};

const financialPreview: VerticalPreview = {
    greeting: 'Our advisory services:',
    items: [
        { name: 'Portfolio Review', price: 'Free', code: 'PR' },
        { name: 'Tax Planning Session', price: '2,000', code: 'TP' },
    ],
    shippingLabel: 'Next slot',
    shippingDetail: 'Today, 4 PM · Video call',
    actions: ['Book call', 'View plans'],
};

const defaultPreview: VerticalPreview = {
    greeting: "Here's what we offer:",
    items: [
        { name: 'Premium Service', price: '1,999', code: 'PS' },
        { name: 'Standard Package', price: '999', code: 'SP' },
    ],
    actions: ['Learn more', 'Contact us'],
};

const previewMap: Record<string, VerticalPreview> = {
    hospitality: hospitalityPreview,
    hotel: hospitalityPreview,
    resort: hospitalityPreview,
    healthcare: healthcarePreview,
    medical: healthcarePreview,
    dental: healthcarePreview,
    clinic: healthcarePreview,
    food: foodPreview,
    restaurant: foodPreview,
    cafe: foodPreview,
    catering: foodPreview,
    automotive: automotivePreview,
    garage: automotivePreview,
    mechanic: automotivePreview,
    travel: travelPreview,
    tourism: travelPreview,
    tour: travelPreview,
    financial: financialPreview,
    investment: financialPreview,
    advisory: financialPreview,
    insurance: financialPreview,
    ecommerce: ecomPreview,
    retail: ecomPreview,
    shop: ecomPreview,
    store: ecomPreview,
};

/**
 * Get preview content for a vertical. Matches against verticalId substrings
 * so it works for "hospitality_boutique_hotel", "food_cafe", etc.
 */
export function getPreviewForVertical(verticalId: string): VerticalPreview {
    const lower = (verticalId || '').toLowerCase();
    for (const [key, preview] of Object.entries(previewMap)) {
        if (lower.includes(key)) return preview;
    }
    return defaultPreview;
}
