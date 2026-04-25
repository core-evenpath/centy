'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Star, ShoppingBag, Heart, Bell } from 'lucide-react';
import { formatMoney } from '@/lib/currency';

export const definition: BlockDefinition = {
  id: 'ecom_product_card',
  family: 'catalog',
  label: 'Product Card',
  description: 'Browsable product with price, rating, badge, and CTA',
  applicableCategories: ['ecommerce', 'retail', 'fashion', 'd2c', 'beauty'],
  intentTriggers: {
    keywords: ['show', 'browse', 'products', 'catalog', 'shop', 'buy', 'collection', 'available'],
    queryPatterns: ['show me *', 'do you have *', 'what * do you sell', '* under *'],
    dataConditions: ['has_products'],
  },
  dataContract: {
    required: [
      { field: 'name', type: 'text', label: 'Product Name' },
      { field: 'price', type: 'currency', label: 'Price' },
    ],
    optional: [
      { field: 'mrp', type: 'currency', label: 'MRP' },
      { field: 'brand', type: 'text', label: 'Brand' },
      { field: 'badge', type: 'text', label: 'Badge' },
      { field: 'badgeColor', type: 'text', label: 'Badge Color' },
      { field: 'stock', type: 'select', label: 'Stock Status', options: ['In Stock', 'Low Stock', 'Out of Stock'] },
      { field: 'rating', type: 'rating', label: 'Rating' },
      { field: 'reviews', type: 'number', label: 'Review Count' },
      { field: 'tags', type: 'tags', label: 'Tags' },
      { field: 'imageUrl', type: 'image', label: 'Image' },
      { field: 'description', type: 'text', label: 'Description' },
    ],
  },
  variants: ['default', 'low_stock', 'out_of_stock', 'pre_order', 'subscription', 'compact'],
  sampleData: {
    items: [
      { name: 'Block Print Kurta Set', price: 2800, mrp: 4200, brand: 'Aurelia', badge: 'Bestseller', stock: 'In Stock', rating: 4.5, reviews: 234, tags: ['Pure Cotton', 'Handwoven'] },
      { name: 'Mirror Work Anarkali', price: 3800, mrp: 5200, badge: '3 Left', stock: 'Low Stock', rating: 4.2, reviews: 89 },
    ],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 300,
};

function formatCurrency(amount: number, currency: string): string {
  return formatMoney(amount, currency);
}

function RatingStars({ rating, theme }: { rating: number; theme: BlockComponentProps['theme'] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={10}
          fill={s <= Math.round(rating) ? theme.amber : 'none'}
          color={s <= Math.round(rating) ? theme.amber : theme.t4}
          strokeWidth={2}
        />
      ))}
    </div>
  );
}

export default function ProductCardBlock({ data, theme }: BlockComponentProps) {
  const items: Array<Record<string, any>> = data.items || [];
  // Currency comes from the data envelope (partner-level). Falls back
  // to INR for legacy data shapes that haven't been region-tagged yet.
  const currency: string = data.currency ?? 'INR';

  if (items.length === 0) {
    return (
      <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
        <ShoppingBag size={24} color={theme.t4} />
        <div style={{ fontSize: '12px', color: theme.t3, marginTop: '8px' }}>No products to show</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {items.map((item, i) => {
        const isOutOfStock = item.stock === 'Out of Stock';
        const isLowStock = item.stock === 'Low Stock';
        const discount = item.mrp && item.mrp > item.price ? Math.round(((item.mrp - item.price) / item.mrp) * 100) : 0;

        return (
          <div
            key={i}
            style={{
              background: theme.surface,
              border: `1px solid ${theme.bdr}`,
              borderRadius: '12px',
              overflow: 'hidden',
              opacity: isOutOfStock ? 0.65 : 1,
              display: 'flex',
              gap: '12px',
              padding: '12px',
            }}
          >
            <div style={{
              width: 72,
              height: 72,
              borderRadius: '8px',
              background: `linear-gradient(135deg, ${theme.accentBg2}, ${theme.bg})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              position: 'relative',
            }}>
              <ShoppingBag size={20} color={theme.t4} />
              {item.badge && (
                <div style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  background: isLowStock ? theme.amber : theme.accent,
                  color: '#fff',
                  fontSize: '8px',
                  fontWeight: 700,
                  padding: '2px 5px',
                  borderRadius: '6px',
                }}>
                  {item.badge}
                </div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {item.brand && <div style={{ fontSize: '10px', color: theme.t3, marginBottom: '2px' }}>{item.brand}</div>}
              <div style={{ fontSize: '13px', fontWeight: 600, color: theme.t1, marginBottom: '4px' }}>{item.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: theme.accent }}>{formatCurrency(item.price, currency)}</span>
                {item.mrp && item.mrp > item.price && (
                  <span style={{ fontSize: '11px', color: theme.t4, textDecoration: 'line-through' }}>{formatCurrency(item.mrp, currency)}</span>
                )}
                {discount > 0 && (
                  <span style={{ fontSize: '10px', fontWeight: 600, color: theme.green, background: theme.greenBg, padding: '1px 5px', borderRadius: '4px' }}>
                    {discount}% off
                  </span>
                )}
              </div>
              {item.rating && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                  <RatingStars rating={item.rating} theme={theme} />
                  {item.reviews && <span style={{ fontSize: '10px', color: theme.t3 }}>({item.reviews})</span>}
                </div>
              )}
              {isLowStock && <div style={{ fontSize: '10px', color: theme.amber, fontWeight: 600 }}>Low Stock</div>}
              {isOutOfStock && <div style={{ fontSize: '10px', color: theme.red, fontWeight: 600 }}>Out of Stock</div>}
              {item.tags && item.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {item.tags.map((tag: string) => (
                    <span key={tag} style={{ fontSize: '9px', color: theme.t3, background: theme.bg, padding: '2px 6px', borderRadius: '4px', border: `1px solid ${theme.bdr}` }}>{tag}</span>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Heart size={12} color={theme.t4} />
              </div>
              {isOutOfStock ? (
                <div style={{ fontSize: '10px', fontWeight: 600, color: theme.accent, background: theme.accentBg, padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Bell size={10} /> Notify
                </div>
              ) : (
                <div style={{ fontSize: '10px', fontWeight: 600, color: '#fff', background: theme.accent, padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' }}>
                  Add
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
