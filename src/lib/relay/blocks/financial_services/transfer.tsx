'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { ArrowRightLeft, Clock } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fin_transfer',
  family: 'payments',
  label: 'Money Transfer',
  description: 'Send/receive amounts with live exchange rate display, fee, delivery time',
  applicableCategories: ['financial_services', 'banking', 'remittance', 'fintech'],
  intentTriggers: {
    keywords: ['transfer', 'send money', 'exchange rate', 'wire', 'remittance'],
    queryPatterns: ['send money to *', 'transfer funds *', 'what is the exchange rate *'],
    dataConditions: ['has_transfer_params'],
  },
  dataContract: {
    required: [
      { field: 'sendAmount', type: 'currency', label: 'Send Amount' },
      { field: 'sendCurrency', type: 'text', label: 'Send Currency' },
    ],
    optional: [
      { field: 'receiveAmount', type: 'currency', label: 'Receive Amount' },
      { field: 'receiveCurrency', type: 'text', label: 'Receive Currency' },
      { field: 'exchangeRate', type: 'number', label: 'Exchange Rate' },
      { field: 'fee', type: 'currency', label: 'Fee' },
      { field: 'deliveryTime', type: 'text', label: 'Delivery Time' },
    ],
  },
  variants: ['default'],
  sampleData: {
    sendAmount: 1000, sendCurrency: 'USD', receiveAmount: 920.50, receiveCurrency: 'EUR',
    exchangeRate: 0.9205, fee: 4.99, deliveryTime: '1-2 business days',
  },
  preloadable: false,
  streamable: false,
  cacheDuration: 30,
};

function fmt(n: number, c: string) { return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + c; }

export default function TransferBlock({ data, theme }: BlockComponentProps) {
  const { sendAmount = 0, sendCurrency = 'USD', receiveAmount = 0, receiveCurrency = 'EUR', exchangeRate = 0, fee = 0, deliveryTime } = data;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
        <ArrowRightLeft size={11} color={theme.t1} />
        <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>Money Transfer</span>
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ flex: 1, padding: '8px 10px', background: theme.bg, borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 8, color: theme.t4, textTransform: 'uppercase' }}>You Send</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: theme.t1, marginTop: 2 }}>{fmt(sendAmount, sendCurrency)}</div>
          </div>
          <ArrowRightLeft size={14} color={theme.accent} />
          <div style={{ flex: 1, padding: '8px 10px', background: theme.accentBg, borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 8, color: theme.t4, textTransform: 'uppercase' }}>They Receive</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: theme.accent, marginTop: 2 }}>{fmt(receiveAmount, receiveCurrency)}</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: `1px solid ${theme.bdr}`, fontSize: 9 }}>
          <span style={{ color: theme.t3 }}>Exchange Rate</span>
          <span style={{ fontWeight: 600, color: theme.t1 }}>1 {sendCurrency} = {exchangeRate} {receiveCurrency}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 9 }}>
          <span style={{ color: theme.t3 }}>Fee</span>
          <span style={{ fontWeight: 600, color: theme.t1 }}>${fee.toFixed(2)}</span>
        </div>
        {deliveryTime && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '4px 0', fontSize: 9 }}>
            <Clock size={8} color={theme.t4} />
            <span style={{ color: theme.t3 }}>{deliveryTime}</span>
          </div>
        )}
        <button style={{ width: '100%', padding: 9, borderRadius: 8, border: 'none', background: theme.accent, color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer', marginTop: 6 }}>Send Money</button>
      </div>
    </div>
  );
}
