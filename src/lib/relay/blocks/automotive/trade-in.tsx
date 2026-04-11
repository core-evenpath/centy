'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { TrendingUp, Clock } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'auto_trade_in',
  family: 'valuation',
  label: 'Trade-In Estimator',
  description: 'Vehicle valuation with KBB range bar, dealer offer, validity period',
  applicableCategories: ['automotive', 'dealership', 'cars', 'vehicles'],
  intentTriggers: {
    keywords: ['trade-in', 'trade in', 'value', 'worth', 'appraisal', 'sell my car'],
    queryPatterns: ['what is my * worth', 'trade-in value', 'how much for my *', 'appraise my *'],
    dataConditions: ['has_trade_in'],
  },
  dataContract: {
    required: [
      { field: 'vehicleLabel', type: 'text', label: 'Vehicle' },
    ],
    optional: [
      { field: 'kbbLow', type: 'currency', label: 'KBB Low' },
      { field: 'kbbHigh', type: 'currency', label: 'KBB High' },
      { field: 'dealerOffer', type: 'currency', label: 'Dealer Offer' },
      { field: 'condition', type: 'select', label: 'Condition', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
      { field: 'mileage', type: 'number', label: 'Mileage' },
      { field: 'validUntil', type: 'date', label: 'Offer Valid Until' },
    ],
  },
  variants: ['default'],
  sampleData: {
    vehicleLabel: '2021 Honda Accord Sport', mileage: 34500, condition: 'Good',
    kbbLow: 22400, kbbHigh: 25800, dealerOffer: 24200, validUntil: '2026-04-25',
  },
  preloadable: false,
  streamable: false,
  cacheDuration: 0,
};

function fmt(n: number) { return '$' + n.toLocaleString(); }

export default function TradeInBlock({ data, theme }: BlockComponentProps) {
  const low = data.kbbLow || 0;
  const high = data.kbbHigh || 1;
  const offer = data.dealerOffer || 0;
  const pct = high > low ? Math.min(((offer - low) / (high - low)) * 100, 100) : 50;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
        <TrendingUp size={11} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.t1 }}>Trade-In Estimate</span>
      </div>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}` }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: theme.t1 }}>{data.vehicleLabel}</div>
        <div style={{ fontSize: 9, color: theme.t3, marginTop: 1 }}>
          {data.mileage ? `${data.mileage.toLocaleString()} mi` : ''}{data.condition ? ` · ${data.condition}` : ''}
        </div>
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 8, fontWeight: 600, color: theme.t4, marginBottom: 4, textTransform: 'uppercase' }}>KBB Range</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: theme.t3, marginBottom: 3 }}>
          <span>{fmt(low)}</span><span>{fmt(high)}</span>
        </div>
        <div style={{ height: 6, background: theme.bg, borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: `linear-gradient(90deg, ${theme.amberBg}, ${theme.greenBg})`, borderRadius: 3 }} />
          <div style={{ position: 'absolute', top: -2, left: `${pct}%`, width: 10, height: 10, borderRadius: '50%', background: theme.accent, border: `2px solid ${theme.surface}`, transform: 'translateX(-50%)' }} />
        </div>
      </div>
      <div style={{ padding: '10px 12px', background: theme.accentBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 8, color: theme.t3, textTransform: 'uppercase' }}>Dealer Offer</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: theme.accent }}>{fmt(offer)}</div>
        </div>
        {data.validUntil && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 8, color: theme.t4 }}>
            <Clock size={8} />Valid until {data.validUntil}
          </div>
        )}
      </div>
    </div>
  );
}
