'use client';

import {
    MessageCircle,
    Search,
    Eye,
    Star,
    ShoppingBag,
    Phone,
    ChevronRight,
    Coffee,
    Leaf,
    Sliders,
    Activity,
    Layers,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { RelayTheme } from '@/components/relay/blocks/types';

// ── Test Chat v1 home screen (bento) ─────────────────────────────────
//
// v1 = the placeholder home screen. Later versions can render something
// else entirely (flow map, rich hero, etc). Tiles for this version are
// a mix of function-specific block tiles + a neutral fallback set.

export interface BentoTile {
    id: string;
    label: string;
    sub: string;
    icon: LucideIcon;
    size: 'large' | 'medium';
    iconFg: string;
    iconBg: string;
    /** Data-guide section that backs this tile (when the partner taps
     * it, we surface that section in the checklist below). */
    sectionId?: string;
}

function palette(theme: RelayTheme) {
    return {
        accent: { fg: theme.accent, bg: theme.accentBg },
        rose: { fg: '#be185d', bg: 'rgba(190,24,93,0.08)' },
        teal: { fg: '#0d9488', bg: 'rgba(13,148,136,0.08)' },
    };
}

// Fallback v1 tiles — mirror the reference design exactly. Used when we
// don't have a taxonomy-specific tile set yet.
function defaultTiles(theme: RelayTheme): BentoTile[] {
    const p = palette(theme);
    return [
        { id: 'greeting', label: 'Greeting', sub: 'Get started', icon: MessageCircle, size: 'large', iconFg: p.accent.fg, iconBg: p.accent.bg },
        { id: 'menu_item', label: 'Menu Item Card', sub: 'Explore options', icon: Search, size: 'medium', iconFg: p.accent.fg, iconBg: p.accent.bg },
        { id: 'order_customizer', label: 'Order Customizer', sub: 'View details', icon: Eye, size: 'medium', iconFg: p.accent.fg, iconBg: p.accent.bg },
        { id: 'diner_review', label: 'Diner Reviews', sub: 'What customers say', icon: Star, size: 'medium', iconFg: p.rose.fg, iconBg: p.rose.bg },
        { id: 'cart', label: 'Cart', sub: 'Take action', icon: ShoppingBag, size: 'medium', iconFg: p.teal.fg, iconBg: p.teal.bg },
        { id: 'contact', label: 'Contact Card', sub: 'Talk to our team', icon: Phone, size: 'medium', iconFg: p.accent.fg, iconBg: p.accent.bg },
    ];
}

// Beverage-Focused taxonomy tiles — every tile is tied to a DataSection
// id in src/lib/relay/block-data-guide.ts so tapping surfaces the right
// upload step.
function beverageCafeTiles(theme: RelayTheme): BentoTile[] {
    const p = palette(theme);
    return [
        { id: 'menu_item', label: 'Menu Item Card', sub: 'Signature drinks & food', icon: Search, size: 'large', iconFg: p.accent.fg, iconBg: p.accent.bg, sectionId: 'food_menu' },
        { id: 'drink_menu', label: 'Drink Menu', sub: 'Hot, iced, juices', icon: Coffee, size: 'medium', iconFg: p.accent.fg, iconBg: p.accent.bg, sectionId: 'food_menu' },
        { id: 'daily_specials', label: "Today's Specials", sub: "What's new today", icon: Star, size: 'medium', iconFg: p.rose.fg, iconBg: p.rose.bg, sectionId: 'food_menu' },
        { id: 'dietary_filter', label: 'Dietary Filter', sub: 'Vegan · Gluten-free', icon: Leaf, size: 'medium', iconFg: p.teal.fg, iconBg: p.teal.bg, sectionId: 'dietary_tags' },
        { id: 'order_customizer', label: 'Order Customizer', sub: 'Size, milk, syrup', icon: Sliders, size: 'medium', iconFg: p.accent.fg, iconBg: p.accent.bg, sectionId: 'order_customizer' },
        { id: 'nutrition', label: 'Nutrition Info', sub: 'Calories & allergens', icon: Activity, size: 'medium', iconFg: p.accent.fg, iconBg: p.accent.bg, sectionId: 'nutrition' },
        { id: 'category_browser', label: 'Categories', sub: 'Coffee · Tea · Pastries', icon: Layers, size: 'medium', iconFg: p.accent.fg, iconBg: p.accent.bg, sectionId: 'menu_categories' },
        { id: 'diner_review', label: 'Diner Reviews', sub: 'What customers say', icon: Star, size: 'medium', iconFg: p.rose.fg, iconBg: p.rose.bg, sectionId: 'diner_reviews' },
    ];
}

export function tilesForFunction(
    functionId: string | null | undefined,
    theme: RelayTheme,
): BentoTile[] {
    if (functionId === 'beverage_cafe') return beverageCafeTiles(theme);
    return defaultTiles(theme);
}

interface Props {
    theme: RelayTheme;
    tiles?: BentoTile[];
    functionId?: string | null;
    onTileTap: (tile: { id: string; label: string; sectionId?: string }) => void;
}

export default function TestChatBento({ theme, tiles, functionId, onTileTap }: Props) {
    const resolvedTiles = tiles ?? tilesForFunction(functionId ?? null, theme);

    return (
        <div
            style={{
                flex: 1,
                overflowY: 'auto',
                padding: 12,
                background: theme.bg,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gridAutoRows: 'min-content',
                gap: 10,
                alignContent: 'start',
                scrollbarWidth: 'none',
            }}
        >
            {resolvedTiles.map((tile) => {
                const Icon = tile.icon;
                const isLarge = tile.size === 'large';
                return (
                    <button
                        key={tile.id}
                        type="button"
                        onClick={() =>
                            onTileTap({
                                id: tile.id,
                                label: tile.label,
                                sectionId: tile.sectionId,
                            })
                        }
                        style={{
                            gridColumn: isLarge ? '1 / -1' : 'auto',
                            background: theme.surface,
                            border: `1px solid ${theme.bdrL}`,
                            borderRadius: 14,
                            padding: isLarge ? '14px 16px' : 14,
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: isLarge ? 'row' : 'column',
                            alignItems: isLarge ? 'center' : 'flex-start',
                            gap: isLarge ? 14 : 10,
                            textAlign: 'left',
                            position: 'relative',
                            minHeight: isLarge ? 0 : 120,
                            transition: 'border-color 0.15s ease, background 0.15s ease',
                        }}
                    >
                        <div
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 10,
                                background: tile.iconBg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: tile.iconFg,
                                flexShrink: 0,
                            }}
                        >
                            <Icon size={20} strokeWidth={1.75} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
                            <div
                                style={{
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: theme.text,
                                    lineHeight: 1.25,
                                }}
                            >
                                {tile.label}
                            </div>
                            <div
                                style={{
                                    fontSize: 11,
                                    color: theme.t3,
                                    marginTop: 3,
                                    lineHeight: 1.3,
                                }}
                            >
                                {tile.sub}
                            </div>
                        </div>
                        {!isLarge && (
                            <ChevronRight
                                size={14}
                                color={theme.t4}
                                style={{
                                    position: 'absolute',
                                    left: 16,
                                    bottom: 12,
                                }}
                            />
                        )}
                        {isLarge && <ChevronRight size={14} color={theme.t4} />}
                    </button>
                );
            })}
        </div>
    );
}
