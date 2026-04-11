'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Calendar } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'hosp_availability',
  family: 'form',
  label: 'Availability Calendar',
  description: 'Date picker with nightly rates and stay total',
  applicableCategories: ['hospitality', 'hotels', 'accommodation', 'resorts', 'bnb', 'vacation_rental'],
  intentTriggers: {
    keywords: ['dates', 'available', 'when', 'calendar', 'check availability', 'book dates'],
    queryPatterns: ['is * available', 'dates for *', 'availability for *'],
    dataConditions: [],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'checkIn', type: 'date', label: 'Check-in Date' },
      { field: 'checkOut', type: 'date', label: 'Check-out Date' },
      { field: 'nightlyRate', type: 'currency', label: 'Nightly Rate' },
      { field: 'nights', type: 'number', label: 'Number of Nights' },
      { field: 'total', type: 'currency', label: 'Total' },
      { field: 'monthLabel', type: 'text', label: 'Month' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: { checkIn: '2026-04-15', checkOut: '2026-04-18', nightlyRate: 289, nights: 3, total: 867, monthLabel: 'April 2026' },
  preloadable: false,
  streamable: false,
  cacheDuration: 60,
};

function fmt(n: number) { return '$' + n.toLocaleString(); }

export default function AvailabilityBlock({ data, theme }: BlockComponentProps) {
  const days = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  const month = data.monthLabel || 'April 2026';
  const nights = data.nights || 3;
  const rate = data.nightlyRate || 289;
  const total = data.total || nights * rate;

  return (
    <div style={{ background: theme.surface, border: `2px solid ${theme.accent}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', background: theme.accentBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Calendar size={12} color={theme.accent} />
          <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>Check Availability</span>
        </div>
        <span style={{ fontSize: 9, color: theme.t3 }}>{month}</span>
      </div>
      <div style={{ padding: '8px 12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 8 }}>
          {days.map(d => <div key={d} style={{ fontSize: 8, color: theme.t4, textAlign: 'center', fontWeight: 600 }}>{d}</div>)}
          {Array.from({ length: 21 }, (_, i) => {
            const day = i < 4 ? null : i - 3;
            const isSelected = day && day >= 15 && day <= 17;
            return (
              <div key={i} style={{ fontSize: 9, textAlign: 'center', padding: '4px 0', borderRadius: 4, color: isSelected ? '#fff' : day ? theme.t1 : 'transparent', background: isSelected ? theme.accent : 'transparent', fontWeight: isSelected ? 600 : 400 }}>
                {day || '.'}
              </div>
            );
          })}
        </div>
        <div style={{ padding: '8px 0', borderTop: `1px solid ${theme.bdr}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: theme.t2, marginBottom: 4 }}>
            <span>{fmt(rate)} × {nights} nights</span>
            <span style={{ fontWeight: 600 }}>{fmt(total)}</span>
          </div>
          <button style={{ width: '100%', padding: 8, borderRadius: 8, border: 'none', background: theme.accent, color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>
            Check Availability
          </button>
        </div>
      </div>
    </div>
  );
}
