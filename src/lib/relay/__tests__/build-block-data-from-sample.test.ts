// PR fix-16a: sample-mode block data builder.
//
// Asserts that buildBlockDataFromSample returns the registry's
// sampleData verbatim (with a partner-currency thread) and falls
// back gracefully for unknown blocks.

import { describe, it, expect, beforeAll } from 'vitest';
import { registerBlock } from '../registry';
import type { BlockDefinition } from '../types';
import { buildBlockDataFromSample } from '../build-block-data-from-sample';

const TEST_BLOCK: BlockDefinition = {
  id: 'test_block_fix16a',
  family: 'catalog',
  label: 'Test Block (fix-16a)',
  description: 'Test fixture for sample-mode hydration.',
  applicableCategories: ['ecommerce'],
  intentTriggers: { keywords: [], queryPatterns: [], dataConditions: [] },
  dataContract: {
    required: [{ field: 'items', type: 'tags', label: 'Items' }],
    optional: [],
  },
  variants: ['default'],
  sampleData: {
    items: [
      { name: 'Sample Hoodie', price: 79.99 },
      { name: 'Sample Cap', price: 24.99 },
    ],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 0,
};

const TestComponent = () => null;

describe('buildBlockDataFromSample (PR fix-16a)', () => {
  beforeAll(() => {
    registerBlock(TEST_BLOCK, TestComponent as any);
  });

  it('returns the registry sampleData for a known block', () => {
    const data = buildBlockDataFromSample({ blockId: 'test_block_fix16a' });
    expect(data).toBeDefined();
    expect(data?.items).toEqual([
      { name: 'Sample Hoodie', price: 79.99 },
      { name: 'Sample Cap', price: 24.99 },
    ]);
  });

  it('threads partner currency from persona into the envelope', () => {
    const data = buildBlockDataFromSample({
      blockId: 'test_block_fix16a',
      partnerData: {
        businessPersona: { identity: { currency: 'USD' } },
      },
    });
    expect(data?.currency).toBe('USD');
  });

  it('normalizes lowercase currency to uppercase', () => {
    const data = buildBlockDataFromSample({
      blockId: 'test_block_fix16a',
      partnerData: {
        businessPersona: { identity: { currency: 'usd' } },
      },
    });
    expect(data?.currency).toBe('USD');
  });

  it('omits currency when persona has none set', () => {
    const data = buildBlockDataFromSample({
      blockId: 'test_block_fix16a',
      partnerData: { businessPersona: { identity: {} } },
    });
    expect(data?.currency).toBeUndefined();
  });

  it('returns undefined for unknown block ids', () => {
    const data = buildBlockDataFromSample({ blockId: 'no_such_block' });
    expect(data).toBeUndefined();
  });

  it('does not mutate the registry sampleData', () => {
    const data = buildBlockDataFromSample({
      blockId: 'test_block_fix16a',
      partnerData: { businessPersona: { identity: { currency: 'EUR' } } },
    });
    // Mutate the returned envelope; the next call should see fresh data.
    if (data) data.items = [];
    const next = buildBlockDataFromSample({ blockId: 'test_block_fix16a' });
    expect(next?.items).toEqual([
      { name: 'Sample Hoodie', price: 79.99 },
      { name: 'Sample Cap', price: 24.99 },
    ]);
  });
});
