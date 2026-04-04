'use client';

import { useState } from 'react';
import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Star, Heart, ShoppingBag, Check, Truck, RotateCcw, Shield } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'ecom_product_detail',
  family: 'detail',
  label: 'Product Detail',
  description: 'Expanded product view with variants, specs, and purchase CTA',
  applicableCategories: ['ecommerce', 'retail', 'fashion', 'd2c', 'beauty'],
  intentTriggers: {
    keywords: ['detail', 'more about', 'tell me about', 'specs', 'features', 'ingredients'],
    queryPatterns: ['tell me about *', 'more info on *', '* details'],
    dataConditions: ['has_single_product'],
  },
  dataContract: {
    required: [
      { field: 'name', type: 'text', label: 'Product Name' },
      { field: 'price', type: 'currency', label: 'Price' },
      { field: 'description', type: 'textarea', label: 'Description' },
    ],
    optional: [
      { field: 'mrp', type: 'currency', label: 'MRP' },
      { field: 'brand', type: 'text', label: 'Brand' },
      { field: 'badge', type: 'text', label: 'Badge' },
      { field: 'rating', type: 'rating', label: 'Rating' },
      { field: 'reviews', type: 'number', label: 'Reviews' },
      { field: 'imageUrl', type: 'image', label: 'Image' },
      { field: 'sizes', type: 'tags', label: 'Sizes' },
      { field: 'colors', type: 'tags', label: 'Colors' },
      { field: 'features', type: 'tags', label: 'Features' },
      { field: 'specs', type: 'tags', label: 'Specifications' },
    ],
  },
  variants: ['fashion', 'electronics', 'beauty'],
  sampleData: {
    name: 'Block Print Kurta Set',
    brand: 'Aurelia',
    price: 2800,
    mrp: 4200,
    description: 'Indigo hand block print, Pure cotton, 3-piece set',
    rating: 4.2,
    reviews: 318,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Indigo', 'Rust', 'Sage'],
    features: ['Free delivery', '15-day returns', 'Genuine product'],
  },
  preloadable: false,
  streamable: true,
  cacheDuration: 300,
};

const COLOR_MAP: Record<string, string> = {
  Indigo: '#3F51B5',
  Rust: '#BF360C',
  Sage: '#7CB342',
  Black: '#212121',
  White: '#F5F5F5',
  Red: '#D32F2F',
  Blue: '#1976D2',
  Green: '#388E3C',
  Pink: '#E91E63',
  Navy: '#1A237E',
};

const FEATURE_ICONS = [Truck, RotateCcw, Shield];

function formatCurrency(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN');
}

export default function ProductDetailBlock({ data, theme }: BlockComponentProps) {
  const [selectedSize, setSelectedSize] = useState<string>(data.sizes?.[1] || '');
  const [selectedColor, setSelectedColor] = useState<string>(data.colors?.[0] || '');

  const discount = data.mrp && data.mrp > data.price ? Math.round(((data.mrp - data.price) / data.mrp) * 100) : 0;
  const sizes: string[] = data.sizes || [];
  const colors: string[] = data.colors || [];
  const features: string[] = data.features || [];

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{
        height: 140,
        background: `linear-gradient(135deg, ${theme.accentBg2}, ${theme.bg})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}>
        <ShoppingBag size={32} color={theme.t4} />
        <div style={{ position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: '50%', background: theme.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: `1px solid ${theme.bdr}` }}>
          <Heart size={14} color={theme.t3} />
        </div>
        {data.badge && (
          <div style={{ position: 'absolute', top: 10, left: 10, background: theme.accent, color: '#fff', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px' }}>
            {data.badge}
          </div>
        )}
      </div>

      <div style={{ padding: '14px' }}>
        {data.brand && <div style={{ fontSize: '11px', color: theme.accent, fontWeight: 600, marginBottom: '2px' }}>{data.brand}</div>}
        <div style={{ fontSize: '16px', fontWeight: 700, color: theme.t1, marginBottom: '4px' }}>{data.name}</div>
        {data.description && <div style={{ fontSize: '12px', color: theme.t2, lineHeight: 1.5, marginBottom: '10px' }}>{data.description}</div>}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <span style={{ fontSize: '18px', fontWeight: 700, color: theme.accent }}>{formatCurrency(data.price)}</span>
          {data.mrp && data.mrp > data.price && (
            <span style={{ fontSize: '13px', color: theme.t4, textDecoration: 'line-through' }}>{formatCurrency(data.mrp)}</span>
          )}
          {discount > 0 && (
            <span style={{ fontSize: '11px', fontWeight: 600, color: theme.green, background: theme.greenBg, padding: '2px 6px', borderRadius: '4px' }}>
              {discount}% off
            </span>
          )}
        </div>

        {data.rating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={12} fill={s <= Math.round(data.rating) ? theme.amber : 'none'} color={s <= Math.round(data.rating) ? theme.amber : theme.t4} strokeWidth={2} />
            ))}
            {data.reviews && <span style={{ fontSize: '11px', color: theme.t3, marginLeft: '4px' }}>{data.reviews} reviews</span>}
          </div>
        )}

        {sizes.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: theme.t2, marginBottom: '6px' }}>Size</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {sizes.map((size) => (
                <div
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: `1px solid ${selectedSize === size ? theme.accent : theme.bdr}`,
                    background: selectedSize === size ? theme.accentBg : theme.surface,
                    color: selectedSize === size ? theme.accent : theme.t2,
                  }}
                >
                  {size}
                </div>
              ))}
            </div>
          </div>
        )}

        {colors.length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: theme.t2, marginBottom: '6px' }}>Color</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {colors.map((color) => (
                <div
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: COLOR_MAP[color] || theme.t3,
                    cursor: 'pointer',
                    border: selectedColor === color ? `2px solid ${theme.accent}` : `2px solid transparent`,
                    boxShadow: selectedColor === color ? `0 0 0 2px ${theme.accentBg2}` : 'none',
                  }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <div style={{
            flex: 1,
            padding: '10px',
            borderRadius: '8px',
            border: `1px solid ${theme.bdr}`,
            fontSize: '12px',
            fontWeight: 600,
            color: theme.t2,
            textAlign: 'center',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}>
            <Heart size={14} /> Save
          </div>
          <div style={{
            flex: 2,
            padding: '10px',
            borderRadius: '8px',
            background: theme.accent,
            color: '#fff',
            fontSize: '12px',
            fontWeight: 700,
            textAlign: 'center',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}>
            <ShoppingBag size={14} /> Add to Bag
          </div>
        </div>

        {features.length > 0 && (
          <div style={{ display: 'flex', gap: '12px', paddingTop: '10px', borderTop: `1px solid ${theme.bdr}` }}>
            {features.map((feat, i) => {
              const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
              return (
                <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Icon size={11} color={theme.green} />
                  <span style={{ fontSize: '10px', color: theme.t3 }}>{feat}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
