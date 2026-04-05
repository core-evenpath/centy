'use client';

import React from 'react';

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

export const VERTICAL_THEMES: Record<string, typeof T> = {
  hospitality: {
    ...T,
    pri: '#1e3a5f', priLt: '#2a5080', priBg: 'rgba(30,58,95,0.06)', priBg2: 'rgba(30,58,95,0.12)',
    acc: '#b8860b', accBg: 'rgba(184,134,11,0.06)', accBg2: 'rgba(184,134,11,0.14)',
    bg: '#f5f3ef',
  },
  education: {
    ...T,
    pri: '#4338ca', priLt: '#6366f1', priBg: 'rgba(67,56,202,0.06)', priBg2: 'rgba(67,56,202,0.12)',
    acc: '#0f766e', accBg: 'rgba(15,118,110,0.06)', accBg2: 'rgba(15,118,110,0.14)',
    bg: '#f8f7f4',
  },
  healthcare: {
    ...T,
    pri: '#0e7490', priLt: '#22a3c0', priBg: 'rgba(14,116,144,0.06)', priBg2: 'rgba(14,116,144,0.12)',
    acc: '#dc2626', accBg: 'rgba(220,38,38,0.06)', accBg2: 'rgba(220,38,38,0.12)',
    bg: '#f0f9ff',
  },
  food_beverage: {
    ...T,
    pri: '#b45309', priLt: '#d97706', priBg: 'rgba(180,83,9,0.06)', priBg2: 'rgba(180,83,9,0.12)',
    acc: '#dc2626', accBg: 'rgba(220,38,38,0.06)', accBg2: 'rgba(220,38,38,0.12)',
    bg: '#fffbeb',
  },
  personal_wellness: {
    ...T,
    pri: '#9333ea', priLt: '#a855f7', priBg: 'rgba(147,51,234,0.06)', priBg2: 'rgba(147,51,234,0.12)',
    acc: '#ec4899', accBg: 'rgba(236,72,153,0.06)', accBg2: 'rgba(236,72,153,0.12)',
    bg: '#fdf4ff',
  },
  automotive: {
    ...T,
    pri: '#334155', priLt: '#475569', priBg: 'rgba(51,65,85,0.06)', priBg2: 'rgba(51,65,85,0.12)',
    acc: '#dc2626', accBg: 'rgba(220,38,38,0.06)', accBg2: 'rgba(220,38,38,0.12)',
    bg: '#f8fafc',
  },
};

export const fmt = (n: number): string =>
  '$' + n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export function I({ d, size = 12, color, stroke = 1.5 }: { d: string; size?: number; color?: string; stroke?: number }) {
  return React.createElement('svg', {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: color || T.t3, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round',
    style: { flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' },
  }, React.createElement('path', { d }));
}

export function Tag({ children, color, bg }: { children: React.ReactNode; color?: string; bg?: string }) {
  return React.createElement('span', {
    style: {
      fontSize: '7px', fontWeight: 600, color: color || '#fff', background: bg || T.pri,
      padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap' as const,
      textTransform: 'uppercase' as const, letterSpacing: '0.3px', lineHeight: 1,
    },
  }, children);
}

export function Stars({ r, size = 8 }: { r: number; size?: number }) {
  return React.createElement('div', { style: { display: 'flex', gap: '1px' } },
    [1, 2, 3, 4, 5].map(i =>
      React.createElement('svg', {
        key: i, width: size, height: size, viewBox: '0 0 24 24',
        fill: i <= Math.round(r) ? '#d97706' : T.bdr, stroke: 'none',
      }, React.createElement('path', { d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' }))
    )
  );
}

export function Amen({ icon, label, color }: { icon: string; label: string; color?: string }) {
  return React.createElement('span', {
    style: {
      display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '7px',
      padding: '2px 5px', borderRadius: '3px', background: T.bg,
      color: color || T.t2, border: `1px solid ${T.bdr}`,
    },
  }, React.createElement(I, { d: icon, size: 8, color: color || T.t3, stroke: 1.5 }), label);
}