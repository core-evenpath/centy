'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { FlaskConical, TrendingUp } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'hc_lab_results',
  family: 'records',
  label: 'Lab Results',
  description: 'Test result table with values, ranges, normal/abnormal color indicators',
  applicableCategories: ['healthcare', 'medical', 'clinic', 'hospital', 'laboratory'],
  intentTriggers: {
    keywords: ['lab', 'results', 'blood', 'test', 'bloodwork', 'panel', 'values'],
    queryPatterns: ['my lab results', 'show test results', 'blood work *'],
    dataConditions: ['has_lab_results'],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'panelName', type: 'text', label: 'Panel Name' },
      { field: 'date', type: 'date', label: 'Test Date' },
      { field: 'results', type: 'tags', label: 'Result Items' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    panelName: 'Complete Blood Count', date: '2026-04-08',
    results: [
      { test: 'WBC', value: 7.2, unit: 'K/uL', range: '4.5-11.0', status: 'normal' },
      { test: 'RBC', value: 5.1, unit: 'M/uL', range: '4.5-5.5', status: 'normal' },
      { test: 'Hemoglobin', value: 11.8, unit: 'g/dL', range: '12.0-16.0', status: 'low' },
      { test: 'Platelets', value: 310, unit: 'K/uL', range: '150-400', status: 'normal' },
    ],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 300,
};

export default function LabResultsBlock({ data, theme }: BlockComponentProps) {
  const results: Array<Record<string, any>> = data.results || [];
  const statusColor = (s: string) => s === 'normal' ? theme.green : s === 'high' ? theme.red : s === 'low' ? theme.amber : theme.t3;
  const statusBg = (s: string) => s === 'normal' ? theme.greenBg : s === 'high' ? theme.redBg : s === 'low' ? theme.amberBg : theme.bg;

  if (!results.length) return null;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <FlaskConical size={11} color={theme.accent} />
          <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>{data.panelName || 'Lab Results'}</span>
        </div>
        {data.date && <span style={{ fontSize: 8, color: theme.t4 }}>{data.date}</span>}
      </div>
      <div style={{ padding: '4px 12px' }}>
        <div style={{ display: 'flex', padding: '4px 0', borderBottom: `1px solid ${theme.bdr}` }}>
          <span style={{ flex: 2, fontSize: 7, fontWeight: 700, color: theme.t4, textTransform: 'uppercase' }}>Test</span>
          <span style={{ flex: 1, fontSize: 7, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', textAlign: 'right' }}>Value</span>
          <span style={{ flex: 1.5, fontSize: 7, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', textAlign: 'right' }}>Range</span>
          <span style={{ width: 50, fontSize: 7, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', textAlign: 'right' }}>Status</span>
        </div>
        {results.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '5px 0', borderBottom: i < results.length - 1 ? `1px solid ${theme.bdr}` : 'none' }}>
            <span style={{ flex: 2, fontSize: 9, fontWeight: 500, color: theme.t1 }}>{r.test}</span>
            <span style={{ flex: 1, fontSize: 9, fontWeight: 600, color: theme.t1, textAlign: 'right' }}>{r.value} <span style={{ fontSize: 7, color: theme.t4 }}>{r.unit}</span></span>
            <span style={{ flex: 1.5, fontSize: 8, color: theme.t4, textAlign: 'right' }}>{r.range}</span>
            <span style={{ width: 50, textAlign: 'right' }}>
              <span style={{ fontSize: 7, fontWeight: 600, padding: '1px 5px', borderRadius: 3, background: statusBg(r.status), color: statusColor(r.status), textTransform: 'capitalize' }}>{r.status}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
