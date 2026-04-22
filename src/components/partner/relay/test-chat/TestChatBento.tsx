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
    BarChart3,
    Shield,
    Clock,
    Utensils,
    Calendar,
    Package,
    Tag,
    Heart,
    Wrench,
    CreditCard,
    FileText,
    MapPin,
    Award,
    Users,
    Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { RelayTheme } from '@/components/relay/blocks/types';
import type { TestChatBlockInfo } from '@/actions/relay-test-chat-actions';

// ── Test Chat v1 home screen (bento) ─────────────────────────────────
//
// v1 = the placeholder home screen. Later versions can render something
// else entirely. Tiles are built from the real block registry (via the
// backend server action) so adding a block to a vertical automatically
// shows up here without touching this component.

export interface BentoTile {
    id: string;
    label: string;
    sub: string;
    icon: LucideIcon;
    size: 'large' | 'medium';
    iconFg: string;
    iconBg: string;
    sectionId?: string;
}

// Map block family → (icon, tint colour). Falls back to accent + Layers.
interface TintPalette {
    accent: { fg: string; bg: string };
    rose: { fg: string; bg: string };
    teal: { fg: string; bg: string };
    blue: { fg: string; bg: string };
    violet: { fg: string; bg: string };
}

function paletteFor(theme: RelayTheme): TintPalette {
    return {
        accent: { fg: theme.accent, bg: theme.accentBg },
        rose: { fg: '#be185d', bg: 'rgba(190,24,93,0.08)' },
        teal: { fg: '#0d9488', bg: 'rgba(13,148,136,0.08)' },
        blue: { fg: '#2563eb', bg: 'rgba(37,99,235,0.08)' },
        violet: { fg: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
    };
}

// Block id → icon (preferred when available). Falls back to family → icon,
// then stage → icon, then Layers. Covers the Beverage-Focused set plus
// the shared blocks that show up across verticals.
const BLOCK_ICON_BY_ID: Record<string, LucideIcon> = {
    // Shared
    greeting: MessageCircle,
    cart: ShoppingBag,
    contact: Phone,
    promo: Tag,
    nudge: Sparkles,
    // Beverage-Focused
    menu_item: Search,
    drink_menu: Coffee,
    daily_specials: Star,
    dietary_filter: Leaf,
    order_customizer: Sliders,
    nutrition: Activity,
    category_browser: Layers,
    diner_review: Star,
    // Common across verticals
    product_card: Package,
    product_detail: Eye,
    service_card: Wrench,
    review: Star,
    booking: Calendar,
    availability: Calendar,
    finance_calc: CreditCard,
    intake_form: FileText,
    location: MapPin,
    loyalty_progress: Award,
    class_schedule: Calendar,
    stylist_profile: Users,
    membership_tier: Heart,
};

const FAMILY_ICON: Record<string, LucideIcon> = {
    menu: Search,
    beverage: Coffee,
    ordering: Sliders,
    preferences: Leaf,
    marketing: Star,
    info: Activity,
    social_proof: Star,
    shared: MessageCircle,
    catalog: Package,
    service: Wrench,
    booking: Calendar,
    pricing: CreditCard,
    valuation: BarChart3,
    parts: Package,
    safety: Shield,
};

const STAGE_ICON: Record<string, LucideIcon> = {
    greeting: MessageCircle,
    discovery: Search,
    showcase: Eye,
    comparison: BarChart3,
    social_proof: Star,
    conversion: ShoppingBag,
    objection: Shield,
    handoff: Phone,
    followup: Clock,
};

function pickIcon(block: TestChatBlockInfo): LucideIcon {
    return (
        BLOCK_ICON_BY_ID[block.id] ||
        FAMILY_ICON[block.family] ||
        STAGE_ICON[block.stage] ||
        Utensils
    );
}

const FAMILY_TINT: Record<string, keyof TintPalette> = {
    social_proof: 'rose',
    marketing: 'rose',
    beverage: 'accent',
    preferences: 'teal',
    shared: 'accent',
    menu: 'accent',
    ordering: 'accent',
    info: 'blue',
    catalog: 'accent',
    booking: 'violet',
    pricing: 'accent',
    safety: 'teal',
};

function pickTint(block: TestChatBlockInfo, palette: TintPalette) {
    const key = FAMILY_TINT[block.family] ?? 'accent';
    return palette[key];
}

// Build tiles from a list of blocks — first block becomes the large tile.
// Section ids come via an optional lookup so the page can inject the
// block-data-guide section mapping without this component knowing about
// the guide structure.
export function buildTilesFromBlocks(
    blocks: TestChatBlockInfo[],
    theme: RelayTheme,
    getSectionIdForBlock?: (blockId: string) => string | undefined,
): BentoTile[] {
    const palette = paletteFor(theme);
    return blocks.map((b, idx) => {
        const tint = pickTint(b, palette);
        return {
            id: b.id,
            label: b.label,
            sub: shortSub(b),
            icon: pickIcon(b),
            size: idx === 0 ? ('large' as const) : ('medium' as const),
            iconFg: tint.fg,
            iconBg: tint.bg,
            sectionId: getSectionIdForBlock?.(b.id),
        };
    });
}

// Short, human-friendly caption derived from the block's desc / stage.
function shortSub(b: TestChatBlockInfo): string {
    // Use first clause of the desc up to 28 chars; fall back to stage label.
    const raw = (b.desc ?? '').split(/[.,]/)[0]?.trim();
    if (raw && raw.length > 0 && raw.length < 40) return raw;
    const STAGE_LABEL: Record<string, string> = {
        greeting: 'Get started',
        discovery: 'Explore options',
        showcase: 'View details',
        comparison: 'Side by side',
        social_proof: 'What customers say',
        conversion: 'Take action',
        objection: 'Answer concerns',
        handoff: 'Talk to our team',
        followup: 'Track & revisit',
    };
    return STAGE_LABEL[b.stage] ?? 'Open preview';
}

// Fallback v1 tiles — reference-design mock used when the page has no
// backend blocks yet (initial load) or for taxonomies without entries.
export function defaultV1Tiles(theme: RelayTheme): BentoTile[] {
    const p = paletteFor(theme);
    return [
        { id: 'greeting', label: 'Greeting', sub: 'Get started', icon: MessageCircle, size: 'large', iconFg: p.accent.fg, iconBg: p.accent.bg },
        { id: 'menu_item', label: 'Menu Item Card', sub: 'Explore options', icon: Search, size: 'medium', iconFg: p.accent.fg, iconBg: p.accent.bg },
        { id: 'order_customizer', label: 'Order Customizer', sub: 'View details', icon: Eye, size: 'medium', iconFg: p.accent.fg, iconBg: p.accent.bg },
        { id: 'diner_review', label: 'Diner Reviews', sub: 'What customers say', icon: Star, size: 'medium', iconFg: p.rose.fg, iconBg: p.rose.bg },
        { id: 'cart', label: 'Cart', sub: 'Take action', icon: ShoppingBag, size: 'medium', iconFg: p.teal.fg, iconBg: p.teal.bg },
        { id: 'contact', label: 'Contact Card', sub: 'Talk to our team', icon: Phone, size: 'medium', iconFg: p.accent.fg, iconBg: p.accent.bg },
    ];
}

interface Props {
    theme: RelayTheme;
    tiles: BentoTile[];
    onTileTap: (tile: { id: string; label: string; sectionId?: string }) => void;
}

export default function TestChatBento({ theme, tiles, onTileTap }: Props) {
    if (tiles.length === 0) {
        return (
            <div
                style={{
                    flex: 1,
                    padding: 24,
                    background: theme.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme.t3,
                    fontSize: 13,
                    textAlign: 'center',
                }}
            >
                Loading your blocks…
            </div>
        );
    }

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
