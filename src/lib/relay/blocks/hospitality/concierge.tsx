'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Bell, Utensils, Droplets, Heart, Coffee, Car, Clock } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'hosp_concierge',
  family: 'form',
  label: 'Concierge Request',
  description: 'In-stay service request — room service, spa, taxi',
  applicableCategories: ['hospitality', 'hotels', 'resorts', 'bnb'],
  intentTriggers: {
    keywords: ['room service', 'concierge', 'request', 'need', 'towels', 'spa booking', 'taxi'],
    queryPatterns: ['can I get *', 'I need *', 'please send *', 'book a *'],
    dataConditions: [],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'services', type: 'tags', label: 'Available Services' },
      { field: 'selected', type: 'text', label: 'Selected Service' },
    ],
  },
  variants: ['default'],
  sampleData: {
    services: [
      { label: 'Room Service', icon: 'utensils' },
      { label: 'Extra Towels', icon: 'droplets' },
      { label: 'Spa Booking', icon: 'heart' },
      { label: 'Restaurant', icon: 'coffee' },
      { label: 'Taxi / Transfer', icon: 'car' },
      { label: 'Wake-up Call', icon: 'clock' },
    ],
    selected: 'Spa Booking',
  },
  preloadable: false,
  streamable: false,
  cacheDuration: 0,
};

const ICONS: Record<string, any> = { utensils: Utensils, droplets: Droplets, heart: Heart, coffee: Coffee, car: Car, clock: Clock };

export default function ConciergeBlock({ data, theme }: BlockComponentProps) {
  const services: Array<{ label: string; icon?: string }> = data.services || [];
  const selected = data.selected || '';

  return (
    <div style={{ background: theme.surface, border: `2px solid ${theme.accent}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', background: theme.accentBg, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Bell size={12} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>Concierge Request</span>
      </div>
      <div style={{ padding: '10px 12px' }}>
        {services.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 8 }}>
            {services.map(s => {
              const isActive = s.label === selected;
              const Icon = s.icon ? ICONS[s.icon] : Bell;
              return (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 8px', borderRadius: 6, border: isActive ? `2px solid ${theme.accent}` : `1px solid ${theme.bdr}`, background: isActive ? theme.accentBg : theme.surface, cursor: 'pointer' }}>
                  {Icon && <Icon size={11} color={isActive ? theme.accent : theme.t3} />}
                  <span style={{ fontSize: 9, fontWeight: isActive ? 600 : 400, color: isActive ? theme.accent : theme.t2 }}>{s.label}</span>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ padding: '8px 10px', border: `1px solid ${theme.bdr}`, borderRadius: 6, fontSize: 9, color: theme.t4, minHeight: 36 }}>
          Special request or details...
        </div>
        <button style={{ width: '100%', padding: 8, borderRadius: 8, border: 'none', background: theme.accent, color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer', marginTop: 6 }}>
          Send Request
        </button>
      </div>
    </div>
  );
}
