'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Building2, ShieldCheck } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fs_supplier_profile',
  family: 'trust',
  label: 'Supplier Profile',
  description: 'Farm/distributor card with certifications, product categories, buyer count',
  applicableCategories: ['food_supply', 'wholesale', 'distributor', 'farm'],
  intentTriggers: {
    keywords: ['supplier', 'farm', 'distributor', 'vendor', 'about', 'who'],
    queryPatterns: ['who is *', 'tell me about * supplier', 'supplier profile *'],
    dataConditions: ['has_supplier'],
  },
  dataContract: {
    required: [
      { field: 'name', type: 'text', label: 'Supplier Name' },
    ],
    optional: [
      { field: 'type', type: 'select', label: 'Type', options: ['Farm', 'Distributor', 'Processor', 'Co-op'] },
      { field: 'location', type: 'text', label: 'Location' },
      { field: 'certifications', type: 'tags', label: 'Certifications' },
      { field: 'categories', type: 'tags', label: 'Product Categories' },
      { field: 'buyerCount', type: 'number', label: 'Active Buyers' },
      { field: 'since', type: 'text', label: 'Operating Since' },
      { field: 'rating', type: 'rating', label: 'Rating' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    name: 'Green Valley Farms', type: 'Farm', location: 'Salinas, CA',
    certifications: ['USDA Organic', 'GAP', 'Fair Trade'], categories: ['Leafy Greens', 'Tomatoes', 'Herbs'],
    buyerCount: 340, since: '2012', rating: 4.7,
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

export default function SupplierProfileBlock({ data, theme }: BlockComponentProps) {
  const certs: string[] = data.certifications || [];
  const cats: string[] = data.categories || [];

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, padding: 12 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: theme.accentBg2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Building2 size={20} color={theme.accent} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: theme.t1 }}>{data.name}</div>
          <div style={{ fontSize: 10, color: theme.t3 }}>{data.type}{data.location ? ` · ${data.location}` : ''}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10, paddingTop: 8, borderTop: `1px solid ${theme.bdr}` }}>
        {data.since && <div style={{ flex: 1, textAlign: 'center' }}><div style={{ fontSize: 12, fontWeight: 700, color: theme.accent }}>Est. {data.since}</div><div style={{ fontSize: 7, color: theme.t4 }}>Founded</div></div>}
        {data.buyerCount && <div style={{ flex: 1, textAlign: 'center' }}><div style={{ fontSize: 12, fontWeight: 700, color: theme.accent }}>{data.buyerCount}</div><div style={{ fontSize: 7, color: theme.t4 }}>Buyers</div></div>}
        {data.rating && <div style={{ flex: 1, textAlign: 'center' }}><div style={{ fontSize: 12, fontWeight: 700, color: theme.amber }}>{data.rating}</div><div style={{ fontSize: 7, color: theme.t4 }}>Rating</div></div>}
      </div>
      {certs.length > 0 && (
        <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
          {certs.map(c => <span key={c} style={{ fontSize: 8, padding: '2px 5px', borderRadius: 4, background: theme.greenBg, color: theme.green, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}><ShieldCheck size={7} /> {c}</span>)}
        </div>
      )}
      {cats.length > 0 && (
        <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
          {cats.map(c => <span key={c} style={{ fontSize: 8, padding: '2px 6px', borderRadius: 4, background: theme.bg, color: theme.t3 }}>{c}</span>)}
        </div>
      )}
    </div>
  );
}
