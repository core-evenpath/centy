'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { ClipboardCheck, CircleAlert } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fs_quality_report',
  family: 'quality',
  label: 'Quality Report',
  description: 'Batch inspection results with pass/fail indicators',
  applicableCategories: ['food_supply', 'wholesale', 'distributor', 'processor', 'farm'],
  intentTriggers: {
    keywords: ['quality', 'inspection', 'batch', 'report', 'QA', 'pass', 'fail'],
    queryPatterns: ['quality report for *', 'inspection results *', 'batch * status'],
    dataConditions: ['has_quality_data'],
  },
  dataContract: {
    required: [
      { field: 'batchId', type: 'text', label: 'Batch ID' },
      { field: 'results', type: 'tags', label: 'Inspection Results' },
    ],
    optional: [
      { field: 'productName', type: 'text', label: 'Product' },
      { field: 'inspectionDate', type: 'date', label: 'Inspection Date' },
      { field: 'inspector', type: 'text', label: 'Inspector' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    batchId: 'BT-2026-04110', productName: 'Organic Roma Tomatoes', inspectionDate: '2026-04-10', inspector: 'QA Team A',
    results: [
      { test: 'Visual Appearance', status: 'pass', note: 'Uniform color, no blemishes' },
      { test: 'Temperature Check', status: 'pass', note: '3.2 C - within range' },
      { test: 'Brix Level', status: 'pass', note: '5.8 - meets standard' },
      { test: 'Pesticide Residue', status: 'fail', note: 'Trace detected - under review' },
    ],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 300,
};

export default function QualityReportBlock({ data, theme }: BlockComponentProps) {
  const results: Array<Record<string, any>> = data.results || [];
  if (!results.length) return null;
  const passCount = results.filter(r => r.status === 'pass').length;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 6 }}>
        <ClipboardCheck size={13} color={theme.accent} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: theme.t1 }}>{data.productName || 'Quality Report'}</div>
          <div style={{ fontSize: 8, color: theme.t4 }}>Batch {data.batchId}{data.inspectionDate ? ` · ${data.inspectionDate}` : ''}</div>
        </div>
        <span style={{ fontSize: 9, fontWeight: 600, padding: '3px 8px', borderRadius: 4, background: passCount === results.length ? theme.greenBg : theme.amberBg, color: passCount === results.length ? theme.green : theme.amber }}>
          {passCount}/{results.length} Pass
        </span>
      </div>
      <div style={{ padding: '4px 14px 8px' }}>
        {results.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '6px 0', borderBottom: i < results.length - 1 ? `1px solid ${theme.bdr}` : 'none', gap: 8 }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: r.status === 'pass' ? theme.greenBg : theme.redBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {r.status === 'pass' ? <ClipboardCheck size={9} color={theme.green} /> : <CircleAlert size={9} color={theme.red} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>{r.test}</div>
              {r.note && <div style={{ fontSize: 8, color: theme.t4, marginTop: 1 }}>{r.note}</div>}
            </div>
            <span style={{ fontSize: 8, fontWeight: 600, color: r.status === 'pass' ? theme.green : theme.red, textTransform: 'uppercase' }}>{r.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
