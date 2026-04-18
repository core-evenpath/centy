'use client';

import React from 'react';

export interface PartnerOption {
  id: string;
  label: string;
  functionId?: string | null;
}

interface Props {
  partners: PartnerOption[];
  selected: string | null;
  onChange: (partnerId: string | null) => void;
}

export function PartnerSelector({ partners, selected, onChange }: Props) {
  const current = partners.find((p) => p.id === selected);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        background: '#ffffff',
        border: '1px solid #e8e4dc',
        borderRadius: 8,
        fontSize: 12,
      }}
    >
      <label style={{ color: '#7a7a70', fontWeight: 500 }}>Partner:</label>
      <select
        value={selected ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        style={{
          border: '1px solid #e8e4dc',
          borderRadius: 6,
          padding: '6px 8px',
          fontSize: 12,
          background: '#ffffff',
          color: '#1a1a18',
          minWidth: 220,
        }}
      >
        <option value="">— Catalog view (no partner) —</option>
        {partners.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
            {p.functionId ? ` · ${p.functionId}` : ''}
          </option>
        ))}
      </select>
      {current?.functionId && (
        <span
          style={{
            fontSize: 10,
            padding: '2px 6px',
            borderRadius: 3,
            background: '#f7f3ec',
            color: '#7a7a70',
            fontFamily: 'ui-monospace, monospace',
          }}
        >
          {current.functionId}
        </span>
      )}
    </div>
  );
}
