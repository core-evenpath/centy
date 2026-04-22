'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import {
    getRelayConfigAction,
} from '@/actions/relay-actions';
import { getBusinessPersonaAction } from '@/actions/business-persona-actions';
import type { RelayConfig } from '@/actions/relay-actions';
import type { SelectedBusinessCategory } from '@/lib/business-taxonomy/types';
import TestChatPanel from '@/components/partner/relay/test-chat/TestChatPanel';
import TestChatFlowPanel, {
    type TestChatFlowMeta,
} from '@/components/partner/relay/test-chat/TestChatFlowPanel';
import CheckoutFlow from '@/components/relay/checkout/CheckoutFlow';
import { useRelaySession } from '@/hooks/useRelaySession';
import { useRelayCheckout } from '@/hooks/useRelayCheckout';
import { DEFAULT_THEME } from '@/components/relay/blocks/types';
import type { BlockCallbacks, RelayTheme } from '@/components/relay/blocks/types';
import type { RelayOrder } from '@/lib/relay/order-types';
import { Loader2, MessageSquare, ChevronRight, Plus, Play } from 'lucide-react';
import Link from 'next/link';
import { T } from '@/app/admin/relay/flows/flow-helpers';

const DEFAULT_CONFIG: RelayConfig = {
    enabled: false,
    brandName: '',
    tagline: '',
    brandEmoji: '💬',
    accentColor: '#6366f1',
    welcomeMessage: 'Hi! How can I help you today?',
};

const SCENARIO_SIDEBAR_FONT = "'Karla', -apple-system, sans-serif";

// ── Theme builder (mirrors /partner/relay) ───────────────────────────

function hexToRgb(hex: string): [number, number, number] {
    const h = hex.replace('#', '');
    return [
        parseInt(h.substring(0, 2), 16),
        parseInt(h.substring(2, 4), 16),
        parseInt(h.substring(4, 6), 16),
    ];
}

function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b]
        .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
        .join('');
}

function buildThemeFromAccent(accent: string): RelayTheme {
    const [r, g, b] = hexToRgb(accent);
    return {
        ...DEFAULT_THEME,
        accent,
        accentHi: rgbToHex(r + 30, g + 30, b + 30),
        accentDk: rgbToHex(r - 25, g - 25, b - 25),
        accentBg: `rgba(${r},${g},${b},0.06)`,
        accentBg2: `rgba(${r},${g},${b},0.13)`,
    };
}

// ── Chat message type ────────────────────────────────────────────────

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    blockId?: string;
    blockData?: Record<string, unknown>;
    suggestions?: string[];
    stageId?: string;
}

export default function PartnerRelayTestChatPage() {
    const { currentWorkspace, loading: authLoading } = useMultiWorkspaceAuth();
    const partnerId = currentWorkspace?.partnerId;

    const [config, setConfig] = useState<RelayConfig>(DEFAULT_CONFIG);
    const [configLoading, setConfigLoading] = useState(true);

    // Business categories drive the scenario sidebar — they come straight
    // from `businessPersona.identity.businessCategories`, the same source
    // the Business Taxonomy modal in /partner/settings writes to.
    const [categories, setCategories] = useState<SelectedBusinessCategory[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [activeCategoryKey, setActiveCategoryKey] = useState<string | null>(null);

    // Chat state
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatSending, setChatSending] = useState(false);
    const [conversationId] = useState(() => `test_${Date.now()}`);
    const [flowMeta, setFlowMeta] = useState<TestChatFlowMeta | null>(null);
    const [seeded, setSeeded] = useState(false);
    const [checkoutOpen, setCheckoutOpen] = useState(false);

    const relayTheme = useMemo(() => buildThemeFromAccent(config.accentColor), [config.accentColor]);

    const session = useRelaySession({
        conversationId,
        partnerId: partnerId || '',
    });

    const handleOrderCreated = useCallback((order: RelayOrder) => {
        setCheckoutOpen(false);
        setChatMessages((prev) => [
            ...prev,
            {
                role: 'assistant',
                content: `Your order ${order.id} has been confirmed.`,
                blockId: 'ecom_order_confirmation',
                blockData: { order },
            },
        ]);
    }, []);

    const checkout = useRelayCheckout({
        partnerId: partnerId || '',
        conversationId,
        onOrderCreated: handleOrderCreated,
    });
    void checkout;

    const sessionCallbacks: BlockCallbacks = useMemo(
        () => ({
            onAddToCart: session.addToCart,
            onUpdateCartItem: session.updateCartItem,
            onRemoveFromCart: session.removeFromCart,
            onClearCart: session.clearCart,
            onApplyDiscount: session.applyDiscount,
            onReserveSlot: session.reserveSlot,
            onCancelSlot: session.cancelSlot,
            onConfirmBooking: session.confirmBooking,
            onCheckout: () => {
                setCheckoutOpen(true);
            },
            cart: {
                items: session.cart.items.map((i) => ({
                    itemId: i.itemId,
                    name: i.name,
                    price: i.price,
                    quantity: i.quantity,
                    variant: i.variant,
                    image: i.image,
                })),
                subtotal: session.cart.subtotal,
                total: session.cart.total,
                discountCode: session.cart.discountCode,
                discountAmount: session.cart.discountAmount,
            },
        }),
        [session],
    );

    // ── Load relay config ────────────────────────────────────────────

    useEffect(() => {
        if (!partnerId) return;
        (async () => {
            try {
                const result = await getRelayConfigAction(partnerId);
                if (result.success && result.config) {
                    setConfig({ ...DEFAULT_CONFIG, ...result.config });
                }
            } catch (e) {
                console.error('Failed to load relay config:', e);
            } finally {
                setConfigLoading(false);
            }
        })();
    }, [partnerId]);

    // ── Load business categories ─────────────────────────────────────

    useEffect(() => {
        if (!partnerId) {
            setCategoriesLoading(false);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const result = await getBusinessPersonaAction(partnerId);
                if (cancelled) return;
                const identity = result.persona?.identity as
                    | { businessCategories?: SelectedBusinessCategory[] }
                    | undefined;
                const cats = Array.isArray(identity?.businessCategories)
                    ? identity!.businessCategories!
                    : [];
                setCategories(cats);
                if (cats.length > 0) {
                    setActiveCategoryKey(categoryKey(cats[0]));
                }
            } catch (e) {
                console.error('Failed to load business categories:', e);
            } finally {
                if (!cancelled) setCategoriesLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [partnerId]);

    // ── Seed: pull entry-stage blocks on chat open ────────────────────

    useEffect(() => {
        if (!partnerId || seeded) return;
        if (chatMessages.length > 0) {
            setSeeded(true);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch('/api/relay/chat/seed', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ partnerId }),
                });
                const data = await res.json();
                if (cancelled) return;
                if (data.success && Array.isArray(data.seedMessages)) {
                    const seeds: ChatMessage[] = data.seedMessages.map(
                        (sm: {
                            blockId?: string;
                            blockData?: Record<string, unknown>;
                            stageId?: string;
                        }) => ({
                            role: 'assistant' as const,
                            content: '',
                            blockId: sm.blockId,
                            blockData: sm.blockData,
                            stageId: sm.stageId,
                        }),
                    );
                    if (seeds.length > 0) setChatMessages(seeds);
                    if (data.entryStage) {
                        setFlowMeta({
                            stageId: data.entryStage.id,
                            stageLabel: data.entryStage.label,
                            stageType: data.entryStage.type,
                        });
                    }
                }
            } catch (err) {
                console.error('[relay] seed failed:', err);
            } finally {
                if (!cancelled) setSeeded(true);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [partnerId, seeded, chatMessages.length]);

    // ── Send chat message ────────────────────────────────────────────

    const sendChatMessage = async (messageText: string) => {
        const text = messageText.trim();
        if (!text || !partnerId || chatSending) return;

        const userMsg: ChatMessage = { role: 'user', content: text };
        const updatedMessages = [...chatMessages, userMsg];
        setChatMessages(updatedMessages);
        setChatSending(true);

        try {
            const res = await fetch('/api/relay/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    partnerId,
                    conversationId,
                    messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
                }),
            });

            const data = await res.json();

            if (data.success && data.response) {
                const assistantMsg: ChatMessage = {
                    role: 'assistant',
                    content: data.response.text || '',
                    blockId:
                        typeof data.response.blockId === 'string' ? data.response.blockId : undefined,
                    blockData:
                        data.response.blockData && typeof data.response.blockData === 'object'
                            ? data.response.blockData
                            : undefined,
                    suggestions: Array.isArray(data.response.suggestions)
                        ? data.response.suggestions
                        : undefined,
                    stageId: data.flowMeta?.stageId,
                };
                setChatMessages((prev) => [...prev, assistantMsg]);

                if (data.flowMeta) {
                    setFlowMeta({
                        stageId: data.flowMeta.stageId,
                        stageLabel: data.flowMeta.stageLabel,
                        stageType: data.flowMeta.stageType,
                        suggestedBlockTypes: data.flowMeta.suggestedBlockTypes,
                        leadTemperature: data.flowMeta.leadTemperature,
                        interactionCount: data.flowMeta.interactionCount,
                    });
                }
            } else {
                setChatMessages((prev) => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: `Error: ${data.error || 'Unknown error'}`,
                    },
                ]);
            }
        } catch (e: any) {
            setChatMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: `Network error: ${e.message}`,
                },
            ]);
        } finally {
            setChatSending(false);
        }
    };

    // ── Loading / auth guard ─────────────────────────────────────────

    if (authLoading || configLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!partnerId) {
        return (
            <div className="container mx-auto py-16 text-center">
                <p className="text-muted-foreground">No workspace selected.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-6 max-w-5xl">
            <link
                href="https://fonts.googleapis.com/css2?family=Karla:wght@300;400;500;600;700;800&display=swap"
                rel="stylesheet"
            />
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Play className="h-6 w-6" /> Test Chat
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Preview your Relay assistant. Scenarios mirror the Business Categories you selected in Settings.
                    </p>
                </div>
            </div>

            <div
                style={{
                    display: 'flex',
                    gap: 20,
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    fontFamily: SCENARIO_SIDEBAR_FONT,
                }}
            >
                <aside
                    style={{
                        width: 260,
                        flexShrink: 0,
                        borderRadius: 16,
                        border: `1px solid ${T.bdrL}`,
                        background: T.surface,
                        overflow: 'hidden',
                        alignSelf: 'stretch',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <div
                        style={{
                            padding: '14px 16px',
                            borderBottom: `1px solid ${T.bdrL}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div
                                style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 8,
                                    background: T.accent,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                }}
                            >
                                <MessageSquare size={14} strokeWidth={2.5} />
                            </div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: T.t1 }}>Scenarios</div>
                                <div style={{ fontSize: 11, color: T.t3 }}>
                                    {categoriesLoading
                                        ? 'Loading…'
                                        : `${categories.length} from your business`}
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            disabled
                            title="Create scenario (coming soon)"
                            style={{
                                width: 26,
                                height: 26,
                                borderRadius: 8,
                                background: T.accentBg,
                                border: `1px solid ${T.accentBg2}`,
                                color: T.accent,
                                cursor: 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0.7,
                            }}
                        >
                            <Plus size={14} strokeWidth={2.5} />
                        </button>
                    </div>
                    <div
                        style={{
                            padding: 10,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                        }}
                    >
                        {categoriesLoading ? (
                            <div
                                style={{
                                    padding: '24px 12px',
                                    textAlign: 'center',
                                    color: T.t4,
                                    fontSize: 12,
                                }}
                            >
                                <Loader2 className="h-4 w-4 animate-spin" style={{ margin: '0 auto 8px' }} />
                                Loading categories…
                            </div>
                        ) : categories.length === 0 ? (
                            <div
                                style={{
                                    padding: '16px 12px',
                                    borderRadius: 10,
                                    background: T.bg,
                                    border: `1px dashed ${T.bdrM}`,
                                    fontSize: 12,
                                    color: T.t3,
                                    lineHeight: 1.5,
                                }}
                            >
                                <div style={{ fontWeight: 700, color: T.t1, marginBottom: 4 }}>
                                    No categories selected
                                </div>
                                <div>
                                    Choose your Business Categories in{' '}
                                    <Link
                                        href="/partner/settings"
                                        style={{ color: T.accent, textDecoration: 'underline' }}
                                    >
                                        Settings
                                    </Link>{' '}
                                    to populate scenarios here.
                                </div>
                            </div>
                        ) : (
                            categories.map((cat) => {
                                const key = categoryKey(cat);
                                const active = key === activeCategoryKey;
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setActiveCategoryKey(key)}
                                        style={{
                                            textAlign: 'left',
                                            padding: '10px 12px',
                                            borderRadius: 10,
                                            border: `1px solid ${active ? T.accent : T.bdrL}`,
                                            background: active ? T.accentBg : T.surface,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: 8,
                                            transition: 'background 0.15s ease, border-color 0.15s ease',
                                        }}
                                    >
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    fontWeight: 700,
                                                    color: active ? T.accent : T.t1,
                                                    marginBottom: 3,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {cat.label}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 10,
                                                    color: T.t4,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {cat.industryId}
                                                {cat.functionId ? ` · ${cat.functionId}` : ''}
                                            </div>
                                        </div>
                                        <ChevronRight
                                            size={13}
                                            strokeWidth={2.5}
                                            style={{
                                                color: active ? T.accent : T.t4,
                                                flexShrink: 0,
                                                marginTop: 2,
                                            }}
                                        />
                                    </button>
                                );
                            })
                        )}
                    </div>
                </aside>
                <div style={{ flexShrink: 0 }}>
                    <TestChatPanel
                        brandName={config.brandName || 'Relay'}
                        brandEmoji={config.brandEmoji}
                        tagline={config.welcomeMessage || config.tagline}
                        theme={relayTheme}
                        messages={chatMessages}
                        sending={chatSending}
                        onSend={sendChatMessage}
                        onClear={() => {
                            setChatMessages([]);
                            setFlowMeta(null);
                            setSeeded(false);
                        }}
                        callbacks={sessionCallbacks}
                        currentStageLabel={flowMeta?.stageLabel}
                    />
                </div>
            </div>

            <div style={{ maxWidth: 420, margin: '24px auto 0' }}>
                <TestChatFlowPanel flowMeta={flowMeta} theme={relayTheme} />
            </div>

            {partnerId && (
                <CheckoutFlow
                    partnerId={partnerId}
                    conversationId={conversationId}
                    theme={relayTheme}
                    open={checkoutOpen}
                    onClose={() => setCheckoutOpen(false)}
                    onOrderCreated={handleOrderCreated}
                />
            )}
        </div>
    );
}

function categoryKey(cat: SelectedBusinessCategory): string {
    return [cat.industryId, cat.functionId, cat.specializationId].filter(Boolean).join(':');
}
