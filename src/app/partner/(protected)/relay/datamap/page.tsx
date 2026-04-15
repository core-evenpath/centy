'use client';

/**
 * Partner: Content Studio — `/partner/relay/datamap`
 *
 * Shows partners every block their AI storefront can render, what data
 * each needs, and exactly how to provide it. Pulls live data from:
 *
 *   - Generated config from `contentStudioConfigs/{verticalId}`
 *   - Partner's per-block data-provision state
 *   - Platform-enabled API integrations applicable to this partner's vertical
 *
 * Visual design: warm orange theme with phone preview, inline SVG icons,
 * three-state layout (empty / in-progress / full).
 */

import React, { useState, useEffect, useCallback } from 'react';

import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';

import type {
    ContentStudioConfig,
    ContentStudioBlockEntry,
    PartnerContentStudioState,
} from '@/lib/types-content-studio';
import {
    getContentStudioConfigAction,
    getPartnerContentStudioStateAction,
    getEnabledApiIntegrationsForPartnerAction,
    getPartnerVerticalIdAction,
    regenerateContentStudioConfigAction,
} from '@/actions/content-studio-actions';
import { refreshPartnerContentStudioStateAction } from '@/actions/content-studio-refresh-actions';

// ── Theme ────────────────────────────────────────────────────────────

const A = '#c2410c';
const TH = {
    accent: A,
    accentHi: '#ea580c',
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
    red: '#dc2626',
    redBg: 'rgba(220,38,38,0.05)',
    amber: '#d97706',
    amberBg: 'rgba(217,119,6,0.06)',
    amberBdr: 'rgba(217,119,6,0.14)',
};

// ── Inline SVG Icons ─────────────────────────────────────────────────

function Ic({ n, sz = 16, c }: { n: string; sz?: number; c?: string }) {
    const cl = c || 'currentColor';
    const d: Record<string, string> = {
        box: 'M21 16V8l-9-5-9 5v8l9 5 9-5zM3.3 7l8.7 5 8.7-5M12 22V12',
        tag: 'M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L2 12V2h10l8.6 8.6a2 2 0 010 2.8zM7 7h.01',
        truck: 'M1 3h15v13H1zM16 8h4l3 5v3h-7zM5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
        refresh: 'M23 4v6h-6M20.5 15a9 9 0 11-2.1-9.4L23 10',
        msg: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
        cart: 'M9 21a1 1 0 100-2 1 1 0 000 2zM20 21a1 1 0 100-2 1 1 0 000 2zM1 1h4l2.7 13.4a2 2 0 002 1.6h9.7a2 2 0 002-1.6L23 6H6',
        headset:
            'M3 18v-6a9 9 0 0118 0v6M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z',
        check: 'M20 6L9 17l-5-5',
        x: 'M18 6L6 18M6 6l12 12',
        upload: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12',
        download:
            'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
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
        sparkle:
            'M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z',
        users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
        clock: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
        bar: 'M18 20V10M12 20V4M6 20v-6',
        gift: 'M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z',
        columns: 'M12 3v18M3 3h18v18H3z',
        shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
        // Lucide-name aliases so backend icon strings map cleanly
        ShoppingBag:
            'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0',
        ShoppingCart:
            'M9 21a1 1 0 100-2 1 1 0 000 2zM20 21a1 1 0 100-2 1 1 0 000 2zM1 1h4l2.7 13.4a2 2 0 002 1.6h9.7a2 2 0 002-1.6L23 6H6',
        CreditCard:
            'M1 4h22v16H1zM1 10h22',
        Calendar:
            'M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18',
        Plug: 'M12 22v-4M7 6V2m10 4V2M7 6h10a2 2 0 012 2v3a7 7 0 01-14 0V8a2 2 0 012-2z',
        Tag: 'M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L2 12V2h10l8.6 8.6a2 2 0 010 2.8zM7 7h.01',
        Sparkles:
            'M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z',
        Search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35',
        Zap: 'M13 2L3 14h9l-1 8 10-12h-9z',
        Heart: 'M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1.1L12 21.3l7.8-7.8 1-1.1a5.5 5.5 0 000-7.8z',
        BarChart: 'M18 20V10M12 20V4M6 20v-6',
        Headphones:
            'M3 18v-6a9 9 0 0118 0v6M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z',
        BookOpen:
            'M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z',
        FileText:
            'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
        Users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
        Truck: 'M1 3h15v13H1zM16 8h4l3 5v3h-7zM5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
        Star: 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3-6.2 3.3 1.2-6.8-5-4.9 6.9-1z',
        Award: 'M12 15a7 7 0 100-14 7 7 0 000 14zM8.2 13.4L7 23l5-3 5 3-1.2-9.6',
        Shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
        Clock: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
        Gift: 'M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z',
        Repeat: 'M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3',
        ClipboardList:
            'M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2M12 11h4M12 16h4M8 11h.01M8 16h.01M9 2h6a1 1 0 011 1v2a1 1 0 01-1 1H9a1 1 0 01-1-1V3a1 1 0 011-1z',
        Radio: 'M12 14a2 2 0 100-4 2 2 0 000 4zM16.2 7.8a6 6 0 010 8.5M7.8 16.2a6 6 0 010-8.5',
        Eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 100-6 3 3 0 000 6z',
        MapPin: 'M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0zM12 13a3 3 0 100-6 3 3 0 000 6z',
        Home: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
        Utensils:
            'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2l-5 5v7a2 2 0 002 2h3z',
        Bed: 'M2 4v16M2 8h20M22 4v16M6 8v4M2 12h20M18 8v4',
        Image: 'M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21',
        HelpCircle:
            'M12 22a10 10 0 100-20 10 10 0 000 20zM9.1 9a3 3 0 015.8 1c0 2-3 3-3 3M12 17h.01',
        MessageSquare:
            'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
        RotateCcw:
            'M1 4v6h6M3.5 15a9 9 0 102.1-9.4L1 10',
        Upload: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12',
        Database:
            'M12 2C6.5 2 3 3.3 3 5s3.5 3 9 3 9-1.3 9-3-3.5-3-9-3zM3 5v14c0 1.7 3.5 3 9 3s9-1.3 9-3V5M3 12c0 1.7 3.5 3 9 3s9-1.3 9-3',
        PenLine: 'M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z',
        Package:
            'M21 16V8l-9-5-9 5v8l9 5 9-5zM3.3 7l8.7 5 8.7-5M12 22V12',
        Map: 'M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4zM8 2v16M16 6v16',
        RefreshCw:
            'M23 4v6h-6M1 20v-6h6M20.5 9A9 9 0 005.6 5.6L1 10m22 4l-4.6 4.4A9 9 0 013.5 15',
    };
    return (
        <svg
            viewBox="0 0 24 24"
            style={{
                width: sz,
                height: sz,
                display: 'inline-block',
                verticalAlign: 'middle',
                flexShrink: 0,
            }}
            fill="none"
            stroke={cl}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d={d[n] || d.box} />
        </svg>
    );
}

// ── Map backend icon names to inline SVG icon keys ───────────────────

/** Map the Lucide icon name from the backend config into an Ic key. */
function iconKey(name: string): string {
    // The Ic component supports both short keys (box, tag, truck…) and
    // PascalCase Lucide names (ShoppingBag, Truck…). If the backend sends
    // a Lucide name we have a path for, use it; otherwise fall back to
    // the short-key equivalent or 'box'.
    return name || 'box';
}

// ── Feature shape (UI layer) ─────────────────────────────────────────

interface Feature {
    id: string;
    icon: string;
    customer: string;
    you: string;
    priority: number;
    items: number;
    source: string | null;
    ready: boolean;
    auto: boolean;
    depends: string | null;
    missReason?: string | null;
    backend?: boolean;
    templateCols?: string[] | null;
}

/** Convert a backend ContentStudioBlockEntry + partner state into the Feature shape used by the UI. */
function blockToFeature(
    block: ContentStudioBlockEntry,
    blockState: PartnerContentStudioState['blockStates'][string] | undefined
): Feature {
    const dataProvided = blockState?.dataProvided === true;
    const isAuto = block.autoConfigured;
    return {
        id: block.blockId,
        icon: iconKey(block.icon),
        customer: block.customerLabel,
        you: block.partnerAction,
        priority: block.priority,
        items: blockState?.itemCount ?? 0,
        source: blockState?.sourceRef ?? (blockState?.sourceType ?? null),
        ready: dataProvided || isAuto,
        auto: isAuto,
        depends: block.dependsOn,
        missReason: block.missReason,
        backend: block.backendRequired,
        templateCols: block.templateColumns,
    };
}

// ── Enabled API integrations (type from action) ──────────────────────

type EnabledIntegration = {
    id: string;
    name: string;
    category: string;
    iconName: string;
};

// ── PhonePreview ─────────────────────────────────────────────────────

function PhonePreview({
    features,
    verticalName,
}: {
    features: Feature[];
    verticalName: string;
}) {
    const ready = features.filter(f => f.ready && !f.depends);
    const hasProducts = features.find(
        f => f.id.includes('product') || f.id.includes('catalog')
    )?.ready;
    const hasShipping = features.find(
        f => f.id.includes('shipping')
    )?.ready;
    const hasPromos = features.find(
        f => f.id.includes('promo')
    )?.ready;

    const products = [
        {
            name: 'Classic Linen Shirt',
            price: '2,490',
            old: '3,200',
            tag: hasPromos ? '20% off' : null,
            code: 'LS',
        },
        { name: 'Organic Cotton Tee', price: '1,290', code: 'CT' },
    ];

    return (
        <div
            style={{
                width: '100%',
                maxWidth: 250,
                borderRadius: 20,
                border: `3px solid ${TH.t1}`,
                overflow: 'hidden',
                position: 'relative',
                height: hasProducts ? 340 : 260,
                margin: '0 auto',
                transition: 'height 0.3s ease',
            }}
        >
            {/* Notch */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 56,
                    height: 13,
                    background: TH.t1,
                    borderRadius: '0 0 8px 8px',
                    zIndex: 5,
                }}
            />
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    borderRadius: 17,
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: '15px 8px 4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        borderBottom: `1px solid ${TH.bdrL}`,
                        background: '#fff',
                        flexShrink: 0,
                    }}
                >
                    <div
                        style={{
                            width: 16,
                            height: 16,
                            borderRadius: 4,
                            background: A,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Ic n="radio" sz={8} c="#fff" />
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 600, color: TH.t1 }}>
                        {verticalName}
                    </span>
                    {ready.length > 0 && (
                        <div
                            style={{
                                marginLeft: 'auto',
                                fontSize: 7,
                                color: TH.green,
                                background: TH.greenBg,
                                padding: '1px 5px',
                                borderRadius: 99,
                                fontWeight: 600,
                            }}
                        >
                            {ready.length} live
                        </div>
                    )}
                </div>
                {/* Body */}
                <div
                    style={{
                        flex: 1,
                        overflow: 'auto',
                        background: TH.bg,
                        padding: 5,
                    }}
                >
                    {!hasProducts ? (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                                gap: 5,
                                opacity: 0.3,
                            }}
                        >
                            <Ic n="msg" sz={22} c={TH.t4} />
                            <div
                                style={{
                                    fontSize: 9,
                                    color: TH.t4,
                                    textAlign: 'center',
                                    lineHeight: 1.4,
                                }}
                            >
                                Add your products to
                                <br />
                                see a live preview
                            </div>
                        </div>
                    ) : (
                        <>
                            <div
                                style={{
                                    display: 'flex',
                                    gap: 4,
                                    alignItems: 'flex-start',
                                    marginBottom: 3,
                                }}
                            >
                                <div
                                    style={{
                                        width: 14,
                                        height: 14,
                                        borderRadius: 99,
                                        background: A,
                                        flexShrink: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginTop: 1,
                                    }}
                                >
                                    <Ic n="radio" sz={5} c="#fff" />
                                </div>
                                <div
                                    style={{
                                        background: '#fff',
                                        border: `1px solid ${TH.bdrL}`,
                                        borderRadius: 5,
                                        padding: '3px 6px',
                                        fontSize: 8,
                                        color: TH.t1,
                                    }}
                                >
                                    Here are our top picks:
                                </div>
                            </div>
                            {products.map(p => (
                                <div
                                    key={p.name}
                                    style={{
                                        background: '#fff',
                                        border: `1px solid ${TH.bdrL}`,
                                        borderRadius: 5,
                                        padding: '5px 7px',
                                        marginBottom: 2,
                                        display: 'flex',
                                        gap: 5,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: 4,
                                            background: TH.accentBg2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 7,
                                            fontWeight: 600,
                                            color: A,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {p.code}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div
                                            style={{
                                                fontSize: 8,
                                                fontWeight: 500,
                                                color: TH.t1,
                                            }}
                                        >
                                            {p.name}
                                        </div>
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 3,
                                                marginTop: 1,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: 8,
                                                    fontWeight: 600,
                                                    color: A,
                                                }}
                                            >
                                                ₹{p.price}
                                            </span>
                                            {p.old && (
                                                <span
                                                    style={{
                                                        fontSize: 7,
                                                        color: TH.t4,
                                                        textDecoration: 'line-through',
                                                    }}
                                                >
                                                    ₹{p.old}
                                                </span>
                                            )}
                                            {p.tag && (
                                                <span
                                                    style={{
                                                        fontSize: 6,
                                                        fontWeight: 600,
                                                        color: '#fff',
                                                        background: A,
                                                        padding: '0 3px',
                                                        borderRadius: 2,
                                                    }}
                                                >
                                                    {p.tag}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {hasShipping && (
                                <div
                                    style={{
                                        background: '#fff',
                                        border: `1px solid ${TH.bdrL}`,
                                        borderRadius: 5,
                                        padding: '5px 7px',
                                        marginBottom: 2,
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 7,
                                            fontWeight: 600,
                                            color: TH.green,
                                            textTransform: 'uppercase',
                                            marginBottom: 1,
                                        }}
                                    >
                                        Shipping
                                    </div>
                                    <div style={{ fontSize: 8, color: TH.t2 }}>
                                        Free above ₹1,999 · 3-5 days
                                    </div>
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: 3, marginTop: 3 }}>
                                {['View all', 'Compare'].map(s => (
                                    <span
                                        key={s}
                                        style={{
                                            fontSize: 7,
                                            padding: '2px 7px',
                                            borderRadius: 99,
                                            background: TH.accentBg,
                                            color: A,
                                            fontWeight: 500,
                                            border: `1px solid ${TH.accentBg2}`,
                                        }}
                                    >
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </>
                    )}
                </div>
                {/* Input bar */}
                <div
                    style={{
                        padding: '4px 5px',
                        borderTop: `1px solid ${TH.bdrL}`,
                        background: '#fff',
                        flexShrink: 0,
                    }}
                >
                    <div style={{ display: 'flex', gap: 3 }}>
                        <div
                            style={{
                                flex: 1,
                                padding: '3px 6px',
                                background: TH.bg,
                                borderRadius: 4,
                                border: `1px solid ${TH.bdrL}`,
                                fontSize: 7,
                                color: TH.t4,
                            }}
                        >
                            Ask something...
                        </div>
                        <div
                            style={{
                                width: 16,
                                height: 16,
                                borderRadius: 3,
                                background: A,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Ic n="arrowUp" sz={7} c="#fff" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── DataSourceOptions ────────────────────────────────────────────────

function DataSourceOptions({
    feature,
    enabledApis,
}: {
    feature: Feature;
    enabledApis: string[];
}) {
    const [showUpload, setShowUpload] = useState(false);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {/* Upload */}
            <button
                onClick={() => setShowUpload(!showUpload)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 12px',
                    width: '100%',
                    borderRadius: 8,
                    border: `1px solid ${showUpload ? TH.accentBg2 : TH.bdrL}`,
                    background: showUpload ? TH.accentBg : TH.surface,
                    cursor: 'pointer',
                    textAlign: 'left',
                }}
            >
                <Ic n="upload" sz={14} c={A} />
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: TH.t1 }}>
                        Upload a document
                    </div>
                    <div style={{ fontSize: 10, color: TH.t4 }}>
                        PDF, CSV, Excel — AI reads and maps it
                    </div>
                </div>
                <Ic n="arrowR" sz={12} c={TH.t4} />
            </button>

            {showUpload && (
                <div
                    style={{
                        marginLeft: 18,
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: `1px solid ${TH.accentBg2}`,
                        background: TH.accentBg,
                    }}
                >
                    <div
                        style={{
                            border: `1px dashed ${TH.bdrM}`,
                            borderRadius: 6,
                            padding: '14px 10px',
                            textAlign: 'center',
                            marginBottom: 8,
                        }}
                    >
                        <Ic n="upload" sz={18} c={TH.t4} />
                        <div
                            style={{
                                fontSize: 10,
                                fontWeight: 500,
                                color: TH.t2,
                                marginTop: 4,
                            }}
                        >
                            Drop file or click to browse
                        </div>
                        <div style={{ fontSize: 9, color: TH.t4, marginTop: 2 }}>
                            PDF, CSV, XLSX, JSON, TXT
                        </div>
                    </div>
                    {feature.templateCols && feature.templateCols.length > 0 && (
                        <button
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '8px 10px',
                                width: '100%',
                                borderRadius: 6,
                                border: `1px solid ${TH.accentBg2}`,
                                background: TH.surface,
                                cursor: 'pointer',
                                textAlign: 'left',
                            }}
                        >
                            <Ic n="download" sz={12} c={A} />
                            <div style={{ flex: 1 }}>
                                <div
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: A,
                                    }}
                                >
                                    Download template
                                </div>
                                <div style={{ fontSize: 9, color: TH.t3 }}>
                                    {feature.templateCols.join(' · ')}
                                </div>
                            </div>
                        </button>
                    )}
                    <div
                        style={{
                            fontSize: 9,
                            color: TH.t3,
                            marginTop: 6,
                            lineHeight: 1.4,
                        }}
                    >
                        AI maps the content to the right fields. You review before
                        anything goes live.
                    </div>
                </div>
            )}

            {/* Core Memory */}
            <button
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 12px',
                    width: '100%',
                    borderRadius: 8,
                    border: `1px solid ${TH.bdrL}`,
                    background: TH.surface,
                    cursor: 'pointer',
                    textAlign: 'left',
                }}
            >
                <Ic n="db" sz={14} c={TH.t3} />
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: TH.t1 }}>
                        Use Core Memory documents
                    </div>
                    <div style={{ fontSize: 10, color: TH.t4 }}>
                        Extract from files already in your account
                    </div>
                </div>
                <Ic n="arrowR" sz={12} c={TH.t4} />
            </button>

            {/* API option */}
            {enabledApis.length > 0 && !feature.backend && (
                <button
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 12px',
                        width: '100%',
                        borderRadius: 8,
                        border: `1px solid ${TH.bdrL}`,
                        background: TH.surface,
                        cursor: 'pointer',
                        textAlign: 'left',
                    }}
                >
                    <Ic n="api" sz={14} c={TH.t3} />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: TH.t1 }}>
                            Fetch from an API
                        </div>
                        <div style={{ fontSize: 10, color: TH.t4 }}>
                            {enabledApis.join(', ')}
                        </div>
                    </div>
                    <Ic n="arrowR" sz={12} c={TH.t4} />
                </button>
            )}

            {/* Connect a service (backend-required blocks) */}
            {feature.backend && (
                <button
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 12px',
                        width: '100%',
                        borderRadius: 8,
                        border: `1px solid ${TH.bdrL}`,
                        background: TH.surface,
                        cursor: 'pointer',
                        textAlign: 'left',
                    }}
                >
                    <Ic n="link" sz={14} c={TH.t3} />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: TH.t1 }}>
                            Connect a service
                        </div>
                        <div style={{ fontSize: 10, color: TH.t4 }}>
                            Payment gateway, order system, or custom API
                        </div>
                    </div>
                    <Ic n="arrowR" sz={12} c={TH.t4} />
                </button>
            )}

            {/* Manual entry */}
            {!feature.backend && (
                <button
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 12px',
                        width: '100%',
                        borderRadius: 8,
                        border: `1px solid ${TH.bdrL}`,
                        background: TH.surface,
                        cursor: 'pointer',
                        textAlign: 'left',
                    }}
                >
                    <Ic n="plus" sz={14} c={TH.t3} />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: TH.t1 }}>
                            Enter manually
                        </div>
                        <div style={{ fontSize: 10, color: TH.t4 }}>
                            Type it in yourself
                        </div>
                    </div>
                    <Ic n="arrowR" sz={12} c={TH.t4} />
                </button>
            )}
        </div>
    );
}

// ── ReadinessRing ────────────────────────────────────────────────────

function ReadinessRing({ pct, size = 44 }: { pct: number; size?: number }) {
    const color = pct >= 80 ? TH.green : pct >= 40 ? TH.amber : TH.red;
    const r = 14;
    const circ = 2 * Math.PI * r;
    return (
        <div
            style={{
                width: size,
                height: size,
                position: 'relative',
                flexShrink: 0,
            }}
        >
            <svg
                viewBox="0 0 36 36"
                style={{ width: size, height: size, transform: 'rotate(-90deg)' }}
            >
                <circle
                    cx="18"
                    cy="18"
                    r={r}
                    fill="none"
                    stroke={TH.bdrL}
                    strokeWidth="3"
                />
                <circle
                    cx="18"
                    cy="18"
                    r={r}
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeDasharray={`${(pct / 100) * circ} ${circ}`}
                    strokeLinecap="round"
                />
            </svg>
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 700,
                    color,
                }}
            >
                {pct}%
            </div>
        </div>
    );
}

// ── Main Page Component ──────────────────────────────────────────────

export default function ContentStudioPage() {
    const { currentWorkspace, loading: authLoading } = useMultiWorkspaceAuth();
    const partnerId = currentWorkspace?.partnerId;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [config, setConfig] = useState<ContentStudioConfig | null>(null);
    const [partnerState, setPartnerState] =
        useState<PartnerContentStudioState | null>(null);
    const [enabledIntegrations, setEnabledIntegrations] = useState<
        EnabledIntegration[]
    >([]);
    const [refreshing, setRefreshing] = useState(false);
    const [lastRefresh, setLastRefresh] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<string | null>(null);

    // ── Reload partner state helper ──────────────────────────────────

    const reloadPartnerState = useCallback(
        async (pid: string) => {
            const stateRes = await getPartnerContentStudioStateAction(pid);
            if (stateRes.success && stateRes.state)
                setPartnerState(stateRes.state);
        },
        []
    );

    // ── Refresh button handler ───────────────────────────────────────

    const runRefresh = useCallback(
        async (pid: string) => {
            setRefreshing(true);
            try {
                const res = await refreshPartnerContentStudioStateAction(pid);
                if (res.success) {
                    await reloadPartnerState(pid);
                }
                setLastRefresh(
                    new Date().toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                    })
                );
            } finally {
                setRefreshing(false);
            }
        },
        [reloadPartnerState]
    );

    // ── Initial data load ────────────────────────────────────────────

    useEffect(() => {
        if (!partnerId) return;
        let cancelled = false;

        (async () => {
            setLoading(true);
            setError(null);

            try {
                // 1. Resolve vertical
                const vRes = await getPartnerVerticalIdAction(partnerId);
                if (cancelled) return;
                if (!vRes.success || !vRes.verticalId) {
                    setError(
                        vRes.error ||
                            'Could not resolve your business vertical.'
                    );
                    setLoading(false);
                    return;
                }

                // 2. Load config + state + integrations in parallel
                const [cfgRes, stateRes, apiRes] = await Promise.all([
                    getContentStudioConfigAction(vRes.verticalId),
                    getPartnerContentStudioStateAction(partnerId),
                    getEnabledApiIntegrationsForPartnerAction(partnerId),
                ]);
                if (cancelled) return;

                if (!cfgRes.success || !cfgRes.config) {
                    setError(
                        cfgRes.error ||
                            'Failed to load Content Studio config.'
                    );
                } else if (
                    !cfgRes.config.blocks ||
                    cfgRes.config.blocks.length === 0
                ) {
                    // Cached config has zero blocks but the resolved vertical
                    // is known — this is almost always a stale stub from when
                    // the vertical lacked a preview config. Force a
                    // regeneration now so the partner doesn't get stuck on
                    // the "not available yet" screen.
                    const regen = await regenerateContentStudioConfigAction(
                        vRes.verticalId
                    );
                    if (cancelled) return;
                    if (regen.success && regen.config) {
                        setConfig(regen.config);
                    } else {
                        setConfig(cfgRes.config);
                    }
                } else {
                    setConfig(cfgRes.config);
                }
                if (stateRes.success && stateRes.state)
                    setPartnerState(stateRes.state);
                if (apiRes.success && apiRes.integrations)
                    setEnabledIntegrations(apiRes.integrations);

                // 3. Auto-refresh on first visit when state is empty
                const stateIsEmpty =
                    !stateRes.state ||
                    !stateRes.state.blockStates ||
                    Object.keys(stateRes.state.blockStates).length === 0;
                const configHasBlocks =
                    cfgRes.success &&
                    (cfgRes.config?.blocks.length || 0) > 0;
                if (stateIsEmpty && configHasBlocks && !cancelled) {
                    const refreshRes =
                        await refreshPartnerContentStudioStateAction(
                            partnerId
                        );
                    if (cancelled) return;
                    if (refreshRes.success) {
                        const freshState =
                            await getPartnerContentStudioStateAction(
                                partnerId
                            );
                        if (cancelled) return;
                        if (freshState.success && freshState.state) {
                            setPartnerState(freshState.state);
                        }
                    }
                }
            } catch (e: any) {
                if (!cancelled)
                    setError(e?.message || 'Unexpected error');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [partnerId]);

    // ── Loading / Error / No-workspace states ────────────────────────

    if (authLoading || loading) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 256,
                    fontFamily:
                        "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 10,
                    }}
                >
                    <div
                        style={{
                            width: 28,
                            height: 28,
                            border: `3px solid ${TH.bdrL}`,
                            borderTopColor: A,
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite',
                        }}
                    />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <span style={{ fontSize: 12, color: TH.t3 }}>
                        Loading Content Studio…
                    </span>
                </div>
            </div>
        );
    }

    if (!partnerId) {
        return (
            <div
                style={{
                    textAlign: 'center',
                    padding: '64px 20px',
                    color: TH.t3,
                    fontFamily:
                        "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                }}
            >
                No workspace selected.
            </div>
        );
    }

    if (error) {
        return (
            <div
                style={{
                    maxWidth: 560,
                    margin: '0 auto',
                    padding: '32px 20px',
                    fontFamily:
                        "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                }}
            >
                <div
                    style={{
                        padding: 16,
                        borderRadius: 10,
                        border: `1px solid ${TH.red}33`,
                        background: TH.redBg,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                    }}
                >
                    <Ic n="x" sz={18} c={TH.red} />
                    <div>
                        <div
                            style={{
                                fontWeight: 600,
                                color: TH.red,
                                fontSize: 14,
                            }}
                        >
                            Couldn&apos;t load Content Studio
                        </div>
                        <div
                            style={{
                                fontSize: 12,
                                color: TH.t3,
                                marginTop: 4,
                            }}
                        >
                            {error}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!config || config.blocks.length === 0) {
        return (
            <div
                style={{
                    maxWidth: 560,
                    margin: '0 auto',
                    padding: '48px 20px',
                    textAlign: 'center',
                    fontFamily:
                        "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                }}
            >
                <div
                    style={{
                        width: 56,
                        height: 56,
                        borderRadius: 14,
                        background: TH.accentBg2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 14px',
                    }}
                >
                    <Ic n={iconKey(config?.iconName || 'box')} sz={26} c={A} />
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: TH.t1 }}>
                    {config?.verticalName || 'Content Studio'}
                </div>
                <div
                    style={{
                        fontSize: 13,
                        color: TH.t3,
                        marginTop: 8,
                        maxWidth: 400,
                        margin: '8px auto 0',
                        lineHeight: 1.5,
                    }}
                >
                    Content Studio isn&apos;t available for your vertical yet.
                    We&apos;re rolling it out vertical by vertical — check back
                    soon.
                </div>
            </div>
        );
    }

    // ── Derive features from backend data ────────────────────────────

    const features: Feature[] = config.blocks.map(block =>
        blockToFeature(block, partnerState?.blockStates?.[block.blockId])
    );

    const enabledApiNames = enabledIntegrations.map(ig => ig.name);

    const nonDep = features.filter(f => !f.depends);
    const readyCount = nonDep.filter(f => f.ready).length;
    const totalCount = nonDep.length;
    const pct =
        totalCount > 0 ? Math.round((readyCount / totalCount) * 100) : 100;
    const todo = nonDep.filter(f => !f.ready);
    const live = nonDep.filter(f => f.ready);

    const isFirst =
        pct === 0 || (readyCount <= 1 && live.every(f => f.auto));
    const isFull = pct === 100;

    const verticalName =
        config.verticalName ||
        currentWorkspace?.partnerName ||
        'Your Business';

    // Find the first "product" block for the onboarding CTA
    const productFeature =
        features.find(f => f.id.includes('product') || f.id.includes('catalog')) ||
        features[0];

    return (
        <div
            style={{
                fontFamily:
                    "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                color: TH.t1,
            }}
        >
            <h2 className="sr-only">
                Content Studio for {verticalName}
            </h2>

            {/* ── Header bar ──────────────────────────────────────── */}
            <div
                style={{
                    padding: '10px 20px',
                    borderBottom: `1px solid ${TH.bdrL}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    flexWrap: 'wrap',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                        style={{
                            width: 28,
                            height: 28,
                            borderRadius: 7,
                            background: A,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Ic n="radio" sz={13} c="#fff" />
                    </div>
                    <div>
                        <div
                            style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: A,
                                letterSpacing: 0.5,
                            }}
                        >
                            CONTENT STUDIO
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: TH.t1 }}>
                            {verticalName}{' '}
                            <span
                                style={{
                                    fontWeight: 400,
                                    color: TH.t4,
                                    fontSize: 11,
                                }}
                            >
                                {config.verticalId
                                    .replace(/_/g, ' ')
                                    .replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {lastRefresh && (
                        <span style={{ fontSize: 9, color: TH.t4 }}>
                            Synced {lastRefresh}
                        </span>
                    )}
                    <button
                        onClick={() => partnerId && runRefresh(partnerId)}
                        disabled={refreshing}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '4px 10px',
                            borderRadius: 6,
                            border: `1px solid ${TH.bdrL}`,
                            background: TH.surface,
                            cursor: refreshing ? 'wait' : 'pointer',
                            fontSize: 10,
                            fontWeight: 500,
                            color: TH.t3,
                            opacity: refreshing ? 0.5 : 1,
                        }}
                    >
                        <Ic n="refresh" sz={11} c={TH.t4} />
                        {refreshing ? 'Scanning...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {/* ── Body ────────────────────────────────────────────── */}
            <div
                style={{
                    overflowY: 'auto',
                    minHeight: 500,
                    paddingBottom: 30,
                }}
            >
                {isFirst ? (
                    /* ── EMPTY STATE ────────────────────────────────── */
                    <div
                        style={{
                            maxWidth: 620,
                            margin: '0 auto',
                            padding: '0 20px',
                        }}
                    >
                        <div
                            style={{
                                textAlign: 'center',
                                padding: '28px 0 18px',
                            }}
                        >
                            <div
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 11,
                                    background: TH.accentBg2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 10px',
                                }}
                            >
                                <Ic n="sparkle" sz={20} c={A} />
                            </div>
                            <div
                                style={{
                                    fontSize: 18,
                                    fontWeight: 700,
                                    color: TH.t1,
                                }}
                            >
                                Welcome to your AI storefront
                            </div>
                            <div
                                style={{
                                    fontSize: 13,
                                    color: TH.t3,
                                    marginTop: 5,
                                    lineHeight: 1.5,
                                    maxWidth: 420,
                                    margin: '5px auto 0',
                                }}
                            >
                                When customers message you, AI answers using
                                your real business data. Add your data below
                                and the storefront goes live.
                            </div>
                        </div>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 230px',
                                gap: 20,
                                alignItems: 'start',
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: TH.t2,
                                        marginBottom: 8,
                                    }}
                                >
                                    Your customers will be able to:
                                </div>
                                {nonDep.map(f => (
                                    <div
                                        key={f.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 10,
                                            padding: '9px 12px',
                                            marginBottom: 3,
                                            borderRadius: 8,
                                            border: `1px solid ${TH.bdrL}`,
                                            background: TH.surface,
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 28,
                                                height: 28,
                                                borderRadius: 7,
                                                background: f.auto
                                                    ? TH.greenBg
                                                    : TH.bg,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}
                                        >
                                            <Ic
                                                n={f.icon}
                                                sz={13}
                                                c={f.auto ? TH.green : TH.t4}
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    fontWeight: 500,
                                                    color: TH.t1,
                                                }}
                                            >
                                                {f.customer}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 10,
                                                    color: f.auto
                                                        ? TH.green
                                                        : TH.t4,
                                                    marginTop: 1,
                                                }}
                                            >
                                                {f.auto
                                                    ? 'Works automatically'
                                                    : f.you}
                                            </div>
                                        </div>
                                        {f.auto && (
                                            <Ic
                                                n="check"
                                                sz={14}
                                                c={TH.green}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div style={{ position: 'sticky', top: 16 }}>
                                <PhonePreview
                                    features={features}
                                    verticalName={verticalName}
                                />
                                <div
                                    style={{
                                        textAlign: 'center',
                                        marginTop: 8,
                                        fontSize: 9,
                                        color: TH.t4,
                                    }}
                                >
                                    This updates as you add data
                                </div>
                            </div>
                        </div>
                        {/* CTA: start with the first actionable block */}
                        {productFeature && (
                            <div
                                style={{
                                    margin: '20px 0',
                                    padding: '16px',
                                    borderRadius: 10,
                                    background: TH.accentBg,
                                    border: `1px solid ${TH.accentBg2}`,
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 700,
                                        color: A,
                                        marginBottom: 3,
                                    }}
                                >
                                    Start with your products
                                </div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: TH.t2,
                                        lineHeight: 1.5,
                                        marginBottom: 12,
                                    }}
                                >
                                    Add your products first — everything else
                                    builds on top of them.
                                </div>
                                <DataSourceOptions
                                    feature={productFeature}
                                    enabledApis={enabledApiNames}
                                />
                            </div>
                        )}
                    </div>
                ) : isFull ? (
                    /* ── FULL STATE ─────────────────────────────────── */
                    <div
                        style={{
                            maxWidth: 620,
                            margin: '0 auto',
                            padding: '0 20px',
                        }}
                    >
                        <div
                            style={{
                                textAlign: 'center',
                                padding: '28px 0 16px',
                            }}
                        >
                            <div
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 99,
                                    background: TH.greenBg,
                                    border: `2px solid ${TH.greenBdr}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 10px',
                                }}
                            >
                                <Ic n="check" sz={22} c={TH.green} />
                            </div>
                            <div
                                style={{
                                    fontSize: 18,
                                    fontWeight: 700,
                                    color: TH.t1,
                                }}
                            >
                                Your storefront is fully live
                            </div>
                            <div
                                style={{
                                    fontSize: 13,
                                    color: TH.t3,
                                    marginTop: 3,
                                }}
                            >
                                Every customer question is answered with your
                                real business data.
                            </div>
                        </div>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 230px',
                                gap: 20,
                                alignItems: 'start',
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        fontSize: 10,
                                        fontWeight: 700,
                                        color: TH.green,
                                        textTransform: 'uppercase',
                                        letterSpacing: 0.5,
                                        marginBottom: 8,
                                    }}
                                >
                                    All features live
                                </div>
                                {live.map(f => (
                                    <div
                                        key={f.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 9,
                                            padding: '8px 12px',
                                            marginBottom: 3,
                                            borderRadius: 8,
                                            border: `1px solid ${TH.greenBdr}`,
                                            background: TH.greenBg,
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 24,
                                                height: 24,
                                                borderRadius: 6,
                                                background:
                                                    'rgba(22,163,74,0.12)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}
                                        >
                                            <Ic
                                                n={f.icon}
                                                sz={11}
                                                c={TH.green}
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: 500,
                                                    color: TH.t1,
                                                }}
                                            >
                                                {f.customer}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 9,
                                                    color: TH.green,
                                                }}
                                            >
                                                {f.items > 0
                                                    ? `${f.items} items`
                                                    : f.auto
                                                      ? 'Automatic'
                                                      : 'Connected'}
                                                {f.source
                                                    ? ` · ${f.source}`
                                                    : ''}
                                            </div>
                                        </div>
                                        <Ic
                                            n="check"
                                            sz={13}
                                            c={TH.green}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div style={{ position: 'sticky', top: 16 }}>
                                <PhonePreview
                                    features={features}
                                    verticalName={verticalName}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ── IN-PROGRESS STATE ──────────────────────────── */
                    <div
                        style={{
                            maxWidth: 680,
                            margin: '0 auto',
                            padding: '0 20px',
                        }}
                    >
                        <div
                            style={{
                                padding: '16px 0 12px',
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                gap: 14,
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        fontSize: 17,
                                        fontWeight: 700,
                                        color: TH.t1,
                                    }}
                                >
                                    Your AI storefront
                                </div>
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: TH.t3,
                                        marginTop: 2,
                                    }}
                                >
                                    {readyCount} of {totalCount} features
                                    live. Complete {todo.length} more to
                                    handle every customer question.
                                </div>
                            </div>
                            <ReadinessRing pct={pct} />
                        </div>

                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 230px',
                                gap: 20,
                                alignItems: 'start',
                            }}
                        >
                            <div>
                                {/* Needs input */}
                                {todo.length > 0 && (
                                    <div style={{ marginBottom: 18 }}>
                                        <div
                                            style={{
                                                fontSize: 10,
                                                fontWeight: 700,
                                                color: TH.amber,
                                                textTransform: 'uppercase',
                                                letterSpacing: 0.5,
                                                marginBottom: 7,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 5,
                                            }}
                                        >
                                            <Ic
                                                n="clock"
                                                sz={11}
                                                c={TH.amber}
                                            />{' '}
                                            Needs your input ({todo.length})
                                        </div>
                                        {todo.map(f => {
                                            const isExp =
                                                expanded === f.id;
                                            return (
                                                <div
                                                    key={f.id}
                                                    style={{
                                                        borderRadius: 8,
                                                        border: `1px solid ${isExp ? TH.accentBg2 : TH.bdrL}`,
                                                        overflow: 'hidden',
                                                        background:
                                                            TH.surface,
                                                        marginBottom: 5,
                                                    }}
                                                >
                                                    <button
                                                        onClick={() =>
                                                            setExpanded(
                                                                isExp
                                                                    ? null
                                                                    : f.id
                                                            )
                                                        }
                                                        style={{
                                                            display: 'flex',
                                                            alignItems:
                                                                'center',
                                                            gap: 9,
                                                            padding:
                                                                '10px 12px',
                                                            width: '100%',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            textAlign:
                                                                'left',
                                                            background:
                                                                'transparent',
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                width: 28,
                                                                height: 28,
                                                                borderRadius: 7,
                                                                background:
                                                                    TH.amberBg,
                                                                display:
                                                                    'flex',
                                                                alignItems:
                                                                    'center',
                                                                justifyContent:
                                                                    'center',
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            <Ic
                                                                n={f.icon}
                                                                sz={13}
                                                                c={
                                                                    TH.amber
                                                                }
                                                            />
                                                        </div>
                                                        <div
                                                            style={{
                                                                flex: 1,
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    fontSize: 12,
                                                                    fontWeight: 600,
                                                                    color: TH.t1,
                                                                }}
                                                            >
                                                                {
                                                                    f.customer
                                                                }
                                                            </div>
                                                            {f.missReason && (
                                                                <div
                                                                    style={{
                                                                        fontSize: 10,
                                                                        color: TH.amber,
                                                                        marginTop: 1,
                                                                    }}
                                                                >
                                                                    {
                                                                        f.missReason
                                                                    }
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div
                                                            style={{
                                                                width: 7,
                                                                height: 7,
                                                                borderRadius: 99,
                                                                background:
                                                                    TH.amber,
                                                                flexShrink: 0,
                                                            }}
                                                        />
                                                    </button>
                                                    {isExp && (
                                                        <div
                                                            style={{
                                                                padding:
                                                                    '0 12px 12px',
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    padding:
                                                                        '7px 10px',
                                                                    background:
                                                                        TH.bg,
                                                                    borderRadius: 6,
                                                                    marginBottom: 10,
                                                                    fontSize: 11,
                                                                    color: TH.t3,
                                                                    lineHeight: 1.5,
                                                                }}
                                                            >
                                                                {f.you}
                                                            </div>
                                                            <DataSourceOptions
                                                                feature={
                                                                    f
                                                                }
                                                                enabledApis={
                                                                    enabledApiNames
                                                                }
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Live now */}
                                <div>
                                    <div
                                        style={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            color: TH.green,
                                            textTransform: 'uppercase',
                                            letterSpacing: 0.5,
                                            marginBottom: 7,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 5,
                                        }}
                                    >
                                        <Ic
                                            n="check"
                                            sz={11}
                                            c={TH.green}
                                        />{' '}
                                        Live now ({live.length})
                                    </div>
                                    {live.map(f => (
                                        <div
                                            key={f.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 9,
                                                padding: '8px 12px',
                                                marginBottom: 3,
                                                borderRadius: 8,
                                                border: `1px solid ${TH.greenBdr}`,
                                                background: TH.greenBg,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: 24,
                                                    height: 24,
                                                    borderRadius: 6,
                                                    background:
                                                        'rgba(22,163,74,0.12)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent:
                                                        'center',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <Ic
                                                    n={f.icon}
                                                    sz={11}
                                                    c={TH.green}
                                                />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div
                                                    style={{
                                                        fontSize: 11,
                                                        fontWeight: 500,
                                                        color: TH.t1,
                                                    }}
                                                >
                                                    {f.customer}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 9,
                                                        color: TH.green,
                                                    }}
                                                >
                                                    {f.items > 0
                                                        ? `${f.items} items`
                                                        : f.auto
                                                          ? 'Automatic'
                                                          : 'Connected'}
                                                    {f.source
                                                        ? ` · ${f.source}`
                                                        : ''}
                                                </div>
                                            </div>
                                            <Ic
                                                n="check"
                                                sz={13}
                                                c={TH.green}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Sidebar */}
                            <div style={{ position: 'sticky', top: 16 }}>
                                <PhonePreview
                                    features={features}
                                    verticalName={verticalName}
                                />
                                {todo.length > 0 && (
                                    <div
                                        style={{
                                            marginTop: 10,
                                            padding: '7px 9px',
                                            borderRadius: 7,
                                            background: TH.amberBg,
                                            border: `1px solid ${TH.amberBdr}`,
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: 9,
                                                fontWeight: 600,
                                                color: TH.amber,
                                                marginBottom: 2,
                                            }}
                                        >
                                            Not yet answered
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 10,
                                                color: TH.t2,
                                                lineHeight: 1.4,
                                            }}
                                        >
                                            Questions about{' '}
                                            {todo
                                                .slice(0, 2)
                                                .map(f =>
                                                    f.customer
                                                        .toLowerCase()
                                                        .replace(
                                                            /^(browse |check |read |see |get |add to |track )/,
                                                            ''
                                                        )
                                                )
                                                .join(' and ')}{' '}
                                            get a generic answer.
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
