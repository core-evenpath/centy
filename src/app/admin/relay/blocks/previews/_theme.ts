'use client';

import React from 'react';

// ── Theme ────────────────────────────────────────────────────────────

export const T = {
  pri: '#2d4a3e', priLt: '#3d6354', priBg: 'rgba(45,74,62,0.06)', priBg2: 'rgba(45,74,62,0.12)',
  acc: '#c4704b', accBg: 'rgba(196,112,75,0.06)', accBg2: 'rgba(196,112,75,0.12)',
  bg: '#f7f3ec', surface: '#ffffff', card: '#f2ede5',
  t1: '#1a1a18', t2: '#3d3d38', t3: '#7a7a70', t4: '#a8a89e',
  bdr: '#e8e4dc', bdrM: '#d4d0c8',
  green: '#2d6a4f', greenBg: 'rgba(45,106,79,0.06)', greenBdr: 'rgba(45,106,79,0.12)',
  red: '#b91c1c', redBg: 'rgba(185,28,28,0.05)',
  amber: '#b45309', amberBg: 'rgba(180,83,9,0.06)',
  blue: '#1d4ed8', blueBg: 'rgba(29,78,216,0.06)',
  pink: '#be185d', pinkBg: 'rgba(190,24,93,0.06)',
  teal: '#0f766e', tealBg: 'rgba(15,118,110,0.06)',
};

// ── Vertical Themes ─────────────────────────────────────────────────

export const VERTICAL_THEMES: Record<string, typeof T> = {
  hospitality: {
    ...T,
    pri: '#1e3a5f', priLt: '#2b5080', priBg: 'rgba(30,58,95,0.06)', priBg2: 'rgba(30,58,95,0.12)',
    acc: '#c4704b', accBg: 'rgba(196,112,75,0.06)', accBg2: 'rgba(196,112,75,0.12)',
    bg: '#f5f7fa',
  },
  education: {
    ...T,
    pri: '#4338ca', priLt: '#5b50db', priBg: 'rgba(67,56,202,0.06)', priBg2: 'rgba(67,56,202,0.12)',
    acc: '#c4704b', accBg: 'rgba(196,112,75,0.06)', accBg2: 'rgba(196,112,75,0.12)',
    bg: '#f8f7fd',
  },
  healthcare: {
    ...T,
    pri: '#0e7490', priLt: '#1299b5', priBg: 'rgba(14,116,144,0.06)', priBg2: 'rgba(14,116,144,0.12)',
    acc: '#c4704b', accBg: 'rgba(196,112,75,0.06)', accBg2: 'rgba(196,112,75,0.12)',
    bg: '#f5fafb',
  },
  food_beverage: {
    ...T,
    pri: '#b45309', priLt: '#d97706', priBg: 'rgba(180,83,9,0.06)', priBg2: 'rgba(180,83,9,0.12)',
    acc: '#c4704b', accBg: 'rgba(196,112,75,0.06)', accBg2: 'rgba(196,112,75,0.12)',
    bg: '#fdf8f0',
  },
  personal_wellness: {
    ...T,
    pri: '#9333ea', priLt: '#a855f7', priBg: 'rgba(147,51,234,0.06)', priBg2: 'rgba(147,51,234,0.12)',
    acc: '#c4704b', accBg: 'rgba(196,112,75,0.06)', accBg2: 'rgba(196,112,75,0.12)',
    bg: '#faf5ff',
  },
  automotive: {
    ...T,
    pri: '#334155', priLt: '#475569', priBg: 'rgba(51,65,85,0.06)', priBg2: 'rgba(51,65,85,0.12)',
    acc: '#c4704b', accBg: 'rgba(196,112,75,0.06)', accBg2: 'rgba(196,112,75,0.12)',
    bg: '#f6f7f9',
  },
};

// ── Helpers ──────────────────────────────────────────────────────────

export const fmt = (n: number): string => '$' + n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

// ── Icon Component ──────────────────────────────────────────────────

export function I({ d, size = 14, color = T.t3, stroke = 1.5 }: { d: string; size?: number; color?: string; stroke?: number }) {
  return React.createElement('svg', {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }, React.createElement('path', { d }));
}

// ── Tag Component ───────────────────────────────────────────────────

export function Tag({ children, color = T.t3, bg = T.priBg }: { children: React.ReactNode; color?: string; bg?: string }) {
  return React.createElement('span', {
    style: {
      fontSize: '7px',
      fontWeight: 600,
      color,
      background: bg,
      padding: '2px 6px',
      borderRadius: '4px',
      whiteSpace: 'nowrap' as const,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.3px',
    },
  }, children);
}

// ── Stars Component ─────────────────────────────────────────────────

export function Stars({ r, size = 8 }: { r: number; size?: number }) {
  return React.createElement('div', { style: { display: 'flex', gap: '1px' } },
    ...[1, 2, 3, 4, 5].map(i =>
      React.createElement('span', {
        key: i,
        style: { fontSize: `${size}px`, color: i <= Math.round(r) ? '#d97706' : T.bdr },
      }, '★')
    )
  );
}

// ── Amenity Chip Component ──────────────────────────────────────────

export function Amen({ icon, label, color = T.t3 }: { icon: string; label: string; color?: string }) {
  return React.createElement('div', {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '3px',
      fontSize: '8px',
      color,
    },
  },
    React.createElement('span', { style: { fontSize: '10px' } }, icon),
    React.createElement('span', null, label)
  );
}
