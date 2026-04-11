'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { FileText, Video } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'edu_resources',
  family: 'content',
  label: 'Learning Resources',
  description: 'Material library list with type-coded icons (PDF, Video, etc)',
  applicableCategories: ['education', 'elearning', 'coaching', 'training', 'academy'],
  intentTriggers: {
    keywords: ['resources', 'materials', 'downloads', 'notes', 'videos', 'PDFs', 'library'],
    queryPatterns: ['study materials', 'download *', 'course resources', 'learning materials'],
    dataConditions: ['has_resources'],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'title', type: 'text', label: 'Section Title' },
      { field: 'items', type: 'tags', label: 'Resource Items' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    title: 'Module 3 — React Resources',
    items: [
      { name: 'React Hooks Cheat Sheet', type: 'PDF', size: '2.4 MB' },
      { name: 'State Management Deep Dive', type: 'Video', size: '45 min' },
      { name: 'Component Patterns Guide', type: 'PDF', size: '1.8 MB' },
      { name: 'Live Coding Session Recording', type: 'Video', size: '1h 20m' },
      { name: 'Assignment Brief', type: 'Doc', size: '340 KB' },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

const typeIcon = (t: string) => t === 'Video' ? Video : FileText;
const typeColor = (t: string, theme: BlockComponentProps['theme']) =>
  t === 'Video' ? { fg: theme.red, bg: theme.redBg } : t === 'PDF' ? { fg: theme.accent, bg: theme.accentBg } : { fg: theme.green, bg: theme.greenBg };

export default function ResourcesBlock({ data, theme }: BlockComponentProps) {
  const items: Array<Record<string, any>> = data.items || [];
  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 5, borderBottom: `1px solid ${theme.bdr}` }}>
        <FileText size={12} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>{data.title || 'Resources'}</span>
      </div>
      <div style={{ padding: '4px 12px' }}>
        {items.map((item, i) => {
          const Icon = typeIcon(item.type);
          const tc = typeColor(item.type, theme);
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: i < items.length - 1 ? `1px solid ${theme.bdr}` : 'none', cursor: 'pointer' }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={12} color={tc.fg} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>{item.name}</div>
                <div style={{ fontSize: 8, color: theme.t4 }}>{item.type}{item.size ? ` · ${item.size}` : ''}</div>
              </div>
              <span style={{ fontSize: 8, fontWeight: 600, color: theme.accent, cursor: 'pointer' }}>Open</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
