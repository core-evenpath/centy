'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';

export const definition: BlockDefinition = {
  id: 'shared_suggestions',
  family: 'shared',
  label: 'Suggestion Chips',
  description: 'Tappable next-question prompts',
  applicableCategories: ['ecommerce', 'retail', 'fashion', 'd2c', 'beauty', 'hospitality', 'real_estate', 'healthcare', 'services'],
  intentTriggers: {
    keywords: [],
    queryPatterns: [],
    dataConditions: [],
  },
  dataContract: {
    required: [
      { field: 'items', type: 'tags', label: 'Suggestion Items' },
    ],
    optional: [],
  },
  variants: ['default', 'compact'],
  sampleData: {
    items: ['Show me new arrivals', 'Track my order', 'Size guide for kurtas', 'Any sale going on?'],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 300,
};

export default function SuggestionsBlock({ data, theme }: BlockComponentProps) {
  const items: string[] = data.items || [];

  if (items.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      {items.map((item) => (
        <div
          key={item}
          style={{
            padding: '5px 12px',
            borderRadius: '999px',
            background: theme.accentBg,
            border: `1px solid ${theme.accentBg2}`,
            color: theme.accent,
            fontSize: '11px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          {item}
        </div>
      ))}
    </div>
  );
}
