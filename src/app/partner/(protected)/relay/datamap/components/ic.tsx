'use client';

// ─── Inline SVG icon component ──────────────────────────────────
// Supports both short keys (box, tag, truck…) and PascalCase Lucide
// names (ShoppingBag, Truck…) so backend `icon` strings map cleanly.

const paths: Record<string, string> = {
    box: 'M21 16V8l-9-5-9 5v8l9 5 9-5zM3.3 7l8.7 5 8.7-5M12 22V12',
    tag: 'M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L2 12V2h10l8.6 8.6a2 2 0 010 2.8zM7 7h.01',
    truck: 'M1 3h15v13H1zM16 8h4l3 5v3h-7zM5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
    refresh: 'M23 4v6h-6M20.5 15a9 9 0 11-2.1-9.4L23 10',
    msg: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
    cart: 'M9 21a1 1 0 100-2 1 1 0 000 2zM20 21a1 1 0 100-2 1 1 0 000 2zM1 1h4l2.7 13.4a2 2 0 002 1.6h9.7a2 2 0 002-1.6L23 6H6',
    headset: 'M3 18v-6a9 9 0 0118 0v6M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z',
    check: 'M20 6L9 17l-5-5',
    x: 'M18 6L6 18M6 6l12 12',
    upload: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12',
    download: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
    link: 'M10 13a5 5 0 007.5.5l3-3a5 5 0 00-7-7l-1.7 1.7M14 11a5 5 0 00-7.5-.5l-3 3a5 5 0 007 7l1.7-1.7',
    db: 'M12 2C6.5 2 3 3.3 3 5s3.5 3 9 3 9-1.3 9-3-3.5-3-9-3zM3 5v14c0 1.7 3.5 3 9 3s9-1.3 9-3V5M3 12c0 1.7 3.5 3 9 3s9-1.3 9-3',
    api: 'M4 17l2-2m4-4l2-2m4-4l2-2M6 9a3 3 0 110-6 3 3 0 010 6zM18 21a3 3 0 110-6 3 3 0 010 6z',
    file: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6',
    plus: 'M12 5v14M5 12h14',
    arrowR: 'M5 12h14M12 5l7 7-7 7',
    arrowUp: 'M12 19V5M5 12l7-7 7 7',
    radio: 'M12 14a2 2 0 100-4 2 2 0 000 4zM16.2 7.8a6 6 0 010 8.5M7.8 16.2a6 6 0 010-8.5',
    zap: 'M13 2L3 14h9l-1 8 10-12h-9z',
    eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 100-6 3 3 0 000 6z',
    sparkle: 'M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z',
    users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
    clock: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
    bar: 'M18 20V10M12 20V4M6 20v-6',
    gift: 'M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z',
    columns: 'M12 3v18M3 3h18v18H3z',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    // PascalCase Lucide-name aliases
    ShoppingBag: 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0',
    ShoppingCart: 'M9 21a1 1 0 100-2 1 1 0 000 2zM20 21a1 1 0 100-2 1 1 0 000 2zM1 1h4l2.7 13.4a2 2 0 002 1.6h9.7a2 2 0 002-1.6L23 6H6',
    CreditCard: 'M1 4h22v16H1zM1 10h22',
    Calendar: 'M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18',
    Plug: 'M12 22v-4M7 6V2m10 4V2M7 6h10a2 2 0 012 2v3a7 7 0 01-14 0V8a2 2 0 012-2z',
    Tag: 'M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L2 12V2h10l8.6 8.6a2 2 0 010 2.8zM7 7h.01',
    Sparkles: 'M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z',
    Search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35',
    Zap: 'M13 2L3 14h9l-1 8 10-12h-9z',
    Heart: 'M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1.1L12 21.3l7.8-7.8 1-1.1a5.5 5.5 0 000-7.8z',
    BarChart: 'M18 20V10M12 20V4M6 20v-6',
    Headphones: 'M3 18v-6a9 9 0 0118 0v6M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z',
    BookOpen: 'M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z',
    FileText: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
    Users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
    Truck: 'M1 3h15v13H1zM16 8h4l3 5v3h-7zM5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
    Star: 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3-6.2 3.3 1.2-6.8-5-4.9 6.9-1z',
    Award: 'M12 15a7 7 0 100-14 7 7 0 000 14zM8.2 13.4L7 23l5-3 5 3-1.2-9.6',
    Shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    Clock: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
    Gift: 'M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z',
    Repeat: 'M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3',
    ClipboardList: 'M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2M12 11h4M12 16h4M8 11h.01M8 16h.01M9 2h6a1 1 0 011 1v2a1 1 0 01-1 1H9a1 1 0 01-1-1V3a1 1 0 011-1z',
    Radio: 'M12 14a2 2 0 100-4 2 2 0 000 4zM16.2 7.8a6 6 0 010 8.5M7.8 16.2a6 6 0 010-8.5',
    Eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 100-6 3 3 0 000 6z',
    MapPin: 'M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0zM12 13a3 3 0 100-6 3 3 0 000 6z',
    Home: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
    Utensils: 'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2l-5 5v7a2 2 0 002 2h3z',
    Bed: 'M2 4v16M2 8h20M22 4v16M6 8v4M2 12h20M18 8v4',
    Image: 'M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21',
    HelpCircle: 'M12 22a10 10 0 100-20 10 10 0 000 20zM9.1 9a3 3 0 015.8 1c0 2-3 3-3 3M12 17h.01',
    MessageSquare: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
    RotateCcw: 'M1 4v6h6M3.5 15a9 9 0 102.1-9.4L1 10',
    Upload: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12',
    Database: 'M12 2C6.5 2 3 3.3 3 5s3.5 3 9 3 9-1.3 9-3-3.5-3-9-3zM3 5v14c0 1.7 3.5 3 9 3s9-1.3 9-3V5M3 12c0 1.7 3.5 3 9 3s9-1.3 9-3',
    PenLine: 'M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z',
    Package: 'M21 16V8l-9-5-9 5v8l9 5 9-5zM3.3 7l8.7 5 8.7-5M12 22V12',
    Map: 'M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4zM8 2v16M16 6v16',
    RefreshCw: 'M23 4v6h-6M1 20v-6h6M20.5 9A9 9 0 005.6 5.6L1 10m22 4l-4.6 4.4A9 9 0 013.5 15',
};

interface IconProps {
    name: string;
    size?: number;
    color?: string;
}

export function Icon({ name, size = 16, color }: IconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            style={{
                width: size,
                height: size,
                display: 'inline-block',
                verticalAlign: 'middle',
                flexShrink: 0,
            }}
            fill="none"
            stroke={color || 'currentColor'}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d={paths[name] || paths.box} />
        </svg>
    );
}
