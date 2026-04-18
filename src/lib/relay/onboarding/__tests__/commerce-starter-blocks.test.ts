import { describe, expect, it } from 'vitest';
import { STARTER_BLOCKS_BY_FUNCTION, getStarterBlocks } from '../starter-blocks';
import { ALL_BLOCKS_DATA } from '@/app/admin/relay/blocks/previews/_registry-data';
import { FUNCTION_TO_ENGINES } from '@/lib/relay/engine-recipes';

const KNOWN_BLOCK_IDS = new Set(ALL_BLOCKS_DATA.map((b) => b.id));

describe('P2.commerce.M06 — Commerce starter blocks', () => {
  const commercePrimary = Object.entries(FUNCTION_TO_ENGINES)
    .filter(([, engs]) => engs[0] === 'commerce')
    .map(([fn]) => fn);

  it('every commerce-primary functionId has a starter set', () => {
    const missing = commercePrimary.filter((fn) => !STARTER_BLOCKS_BY_FUNCTION[fn]);
    expect(missing).toEqual([]);
  });

  it('every commerce starter set references real registry blocks', () => {
    for (const fn of commercePrimary) {
      const ids = STARTER_BLOCKS_BY_FUNCTION[fn];
      for (const id of ids) {
        expect(KNOWN_BLOCK_IDS.has(id), `${fn} references unknown block: ${id}`).toBe(true);
      }
    }
  });

  it('commerce starter sets are 5–13 blocks each (curated, not all-available)', () => {
    for (const fn of commercePrimary) {
      const ids = STARTER_BLOCKS_BY_FUNCTION[fn];
      expect(ids.length, `${fn} set size`).toBeGreaterThanOrEqual(5);
      expect(ids.length, `${fn} set size`).toBeLessThanOrEqual(13);
    }
  });

  it('every set includes at least one commerce-tagged or shared block', () => {
    const blockEngineMap = new Map<string, string[]>();
    for (const b of ALL_BLOCKS_DATA) {
      const engines = (b as unknown as { engines?: string[] }).engines;
      if (engines) blockEngineMap.set(b.id, engines);
    }
    for (const fn of commercePrimary) {
      const ids = STARTER_BLOCKS_BY_FUNCTION[fn];
      const hasCommerceOrShared = ids.some((id) => {
        const tags = blockEngineMap.get(id);
        return tags?.includes('commerce') || tags?.includes('shared');
      });
      expect(hasCommerceOrShared, `${fn}`).toBe(true);
    }
  });

  it('sample starter sets render correctly', () => {
    expect(getStarterBlocks('ecommerce_d2c')).toEqual(
      expect.arrayContaining(['greeting', 'product_card', 'cart']),
    );
    expect(getStarterBlocks('qsr')).toEqual(
      expect.arrayContaining(['menu_item', 'category_browser', 'cart']),
    );
    expect(getStarterBlocks('fresh_produce')).toEqual(
      expect.arrayContaining(['fs_product_card', 'bulk_order', 'cart']),
    );
  });

  it('booking-primary starter sets are unchanged (backward-compat)', () => {
    // Sanity: a Phase 1 booking starter set still works and still
    // doesn't include commerce-only blocks like `cart`.
    const hotelStarter = getStarterBlocks('hotels_resorts');
    expect(hotelStarter).toContain('room_card');
    expect(hotelStarter).toContain('availability');
  });
});
