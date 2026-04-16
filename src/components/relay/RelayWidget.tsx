'use client';

import { useState, useEffect, useMemo } from 'react';
import { MessageSquare, LayoutGrid } from 'lucide-react';
import { loadRelaySessionAction } from '@/actions/relay-session-actions';
import { buildRelaySession, resolvePreloadData } from '@/lib/relay/preloader';
import { RelaySessionCache } from '@/lib/relay/session-cache';
import { DEFAULT_THEME } from '@/lib/relay/types';
import type { BlockTheme } from '@/lib/relay/types';
import type { PreloadedBlock } from '@/lib/relay/preloader';
import HomeScreenRenderer from './HomeScreenRenderer';
import ChatInterface from './ChatInterface';
import { useRelaySession } from '@/hooks/useRelaySession';
import type { BlockCallbacks } from './blocks/types';

interface RelayWidgetProps {
  partnerId: string;
}

type WidgetView = 'home' | 'chat';

export default function RelayWidget({ partnerId }: RelayWidgetProps) {
  const [view, setView] = useState<WidgetView>('home');
  const [cache, setCache] = useState<RelaySessionCache | null>(null);
  const [theme, setTheme] = useState<BlockTheme | null>(null);
  const [preloadedBlocks, setPreloadedBlocks] = useState<PreloadedBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stable per-mount conversation id so the runtime session document
  // ({partnerId}_{conversationId}) survives view tab switches.
  const [conversationId] = useState(
    () => `relay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  );

  const {
    cart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    applyDiscount,
    reserveSlot,
    cancelSlot,
    confirmBooking,
  } = useRelaySession({ conversationId, partnerId });

  const sessionCallbacks: BlockCallbacks = useMemo(
    () => ({
      onAddToCart: addToCart,
      onUpdateCartItem: updateCartItem,
      onRemoveFromCart: removeFromCart,
      onClearCart: clearCart,
      onApplyDiscount: applyDiscount,
      onReserveSlot: reserveSlot,
      onCancelSlot: cancelSlot,
      onConfirmBooking: confirmBooking,
      cart: {
        items: cart.items.map((i) => ({
          itemId: i.itemId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          variant: i.variant,
          image: i.image,
        })),
        subtotal: cart.subtotal,
        total: cart.total,
        discountCode: cart.discountCode,
        discountAmount: cart.discountAmount,
      },
    }),
    [
      cart,
      addToCart,
      updateCartItem,
      removeFromCart,
      clearCart,
      applyDiscount,
      reserveSlot,
      cancelSlot,
      confirmBooking,
    ],
  );

  useEffect(() => {
    initSession();
  }, [partnerId]);

  async function initSession() {
    setLoading(true);
    setError(null);

    const result = await loadRelaySessionAction(partnerId);

    if (!result.success || !result.data) {
      setError(result.error || 'Failed to load');
      setLoading(false);
      return;
    }

    const sessionCache = buildRelaySession(result.data);
    const preloaded = resolvePreloadData(sessionCache);
    const brand = sessionCache.getBrand();
    const builtTheme: BlockTheme = {
      ...DEFAULT_THEME,
      accent: brand.accentColor || DEFAULT_THEME.accent,
    };

    setCache(sessionCache);
    setTheme(builtTheme);
    setPreloadedBlocks(preloaded);
    setLoading(false);
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#faf8f5', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid #e7e5e4', borderTopColor: '#c2410c', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: '13px', color: '#78716c' }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !cache || !theme) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#faf8f5', padding: '24px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <div style={{ textAlign: 'center', maxWidth: '280px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917', marginBottom: '8px' }}>Unable to load</div>
          <div style={{ fontSize: '12px', color: '#78716c' }}>{error || 'Something went wrong'}</div>
          <button onClick={initSession} style={{ marginTop: '16px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#1c1917', color: '#fff', fontSize: '13px', cursor: 'pointer' }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const brand = cache.getBrand();

  const S = {
    widget: { display: 'flex', flexDirection: 'column' as const, height: '100%', background: theme.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', overflow: 'hidden' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: theme.surface, borderBottom: `1px solid ${theme.bdr}`, flexShrink: 0 },
    brandRow: { display: 'flex', alignItems: 'center', gap: '8px' },
    avatar: { width: '32px', height: '32px', borderRadius: '8px', background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', fontWeight: 700 },
    brandName: { fontSize: '14px', fontWeight: 700, color: theme.t1 },
    brandTag: { fontSize: '10px', color: theme.t4 },
    tabs: { display: 'flex', gap: '2px' },
    tab: (active: boolean) => ({ padding: '6px 10px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: active ? 600 : 400, background: active ? theme.accentBg2 : 'transparent', color: active ? theme.accent : theme.t3, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }),
    body: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' as const },
    homeBody: { flex: 1, overflowY: 'auto' as const, padding: '12px' },
  };

  return (
    <div style={S.widget}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={S.header}>
        <div style={S.brandRow}>
          <div style={S.avatar}>{brand.name.charAt(0)}</div>
          <div>
            <div style={S.brandName}>{brand.name}</div>
            {brand.tagline && <div style={S.brandTag}>{brand.tagline}</div>}
          </div>
        </div>
        <div style={S.tabs}>
          <button onClick={() => setView('home')} style={S.tab(view === 'home')}>
            <LayoutGrid size={14} /> Browse
          </button>
          <button onClick={() => setView('chat')} style={S.tab(view === 'chat')}>
            <MessageSquare size={14} /> Chat
          </button>
        </div>
      </div>

      <div style={S.body}>
        {view === 'home' ? (
          <div style={S.homeBody}>
            <HomeScreenRenderer
              preloadedBlocks={preloadedBlocks}
              theme={theme}
              onSuggestionTap={() => { setView('chat'); }}
              callbacks={sessionCallbacks}
            />
          </div>
        ) : (
          <ChatInterface
            cache={cache}
            theme={theme}
            partnerId={partnerId}
            conversationId={conversationId}
            callbacks={sessionCallbacks}
          />
        )}
      </div>
    </div>
  );
}
