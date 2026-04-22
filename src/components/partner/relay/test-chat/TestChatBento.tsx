'use client';

import { MessageCircle, Search, Eye, Star, ShoppingBag, Phone, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { RelayTheme } from '@/components/relay/blocks/types';

// ── Test Chat v1 home screen (bento) ─────────────────────────────────
//
// Placeholder homescreen — there will be more homescreen versions; this
// bento grid is v1. Keep the tile set fixed for now so the visual can be
// iterated independently of the scenario/block wiring.

interface BentoTile {
    id: string;
    label: string;
    sub: string;
    icon: LucideIcon;
    size: 'large' | 'medium';
    iconFg: string;
    iconBg: string;
}

const DEFAULT_TILES = (theme: RelayTheme): BentoTile[] => {
    const peachBg = theme.accentBg;
    const peachFg = theme.accent;
    const rose = '#be185d';
    const roseBg = 'rgba(190,24,93,0.08)';
    const teal = '#0d9488';
    const tealBg = 'rgba(13,148,136,0.08)';
    return [
        { id: 'greeting', label: 'Greeting', sub: 'Get started', icon: MessageCircle, size: 'large', iconFg: peachFg, iconBg: peachBg },
        { id: 'menu_item', label: 'Menu Item Card', sub: 'Explore options', icon: Search, size: 'medium', iconFg: peachFg, iconBg: peachBg },
        { id: 'order_customizer', label: 'Order Customizer', sub: 'View details', icon: Eye, size: 'medium', iconFg: peachFg, iconBg: peachBg },
        { id: 'diner_reviews', label: 'Diner Reviews', sub: 'What customers say', icon: Star, size: 'medium', iconFg: rose, iconBg: roseBg },
        { id: 'cart', label: 'Cart', sub: 'Take action', icon: ShoppingBag, size: 'medium', iconFg: teal, iconBg: tealBg },
        { id: 'contact', label: 'Contact Card', sub: 'Talk to our team', icon: Phone, size: 'medium', iconFg: peachFg, iconBg: peachBg },
    ];
};

interface Props {
    theme: RelayTheme;
    onTileTap: (tile: { id: string; label: string }) => void;
}

export default function TestChatBento({ theme, onTileTap }: Props) {
    const tiles = DEFAULT_TILES(theme);

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
            {tiles.map((tile) => {
                const Icon = tile.icon;
                const isLarge = tile.size === 'large';
                return (
                    <button
                        key={tile.id}
                        type="button"
                        onClick={() => onTileTap({ id: tile.id, label: tile.label })}
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
