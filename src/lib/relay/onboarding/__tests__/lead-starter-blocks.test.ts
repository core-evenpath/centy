import { describe, expect, it } from 'vitest';
import { STARTER_BLOCKS_BY_FUNCTION, getStarterBlocks } from '../starter-blocks';
import { FUNCTION_TO_ENGINES } from '@/lib/relay/engine-recipes';
import { ALL_BLOCKS_DATA } from '@/app/admin/relay/blocks/previews/_registry-data';

const KNOWN_BLOCK_IDS = new Set(ALL_BLOCKS_DATA.map((b) => b.id));
// Phase 1 shared blocks that live outside ALL_BLOCKS_DATA.
const PHASE1_SHARED = new Set(['greeting', 'suggestions', 'cart', 'contact', 'compare']);

describe('P2.lead.M06 — Lead starter blocks', () => {
  const leadPrimary = Object.entries(FUNCTION_TO_ENGINES)
    .filter(([, engs]) => engs[0] === 'lead')
    .map(([fn]) => fn);

  it('every lead-primary functionId has a starter set', () => {
    const missing = leadPrimary.filter((fn) => !STARTER_BLOCKS_BY_FUNCTION[fn]);
    expect(missing).toEqual([]);
  });

  it('every lead starter set references real registry blocks', () => {
    for (const fn of leadPrimary) {
      const ids = STARTER_BLOCKS_BY_FUNCTION[fn];
      for (const id of ids) {
        const known = KNOWN_BLOCK_IDS.has(id) || PHASE1_SHARED.has(id);
        expect(known, `${fn} references unknown block: ${id}`).toBe(true);
      }
    }
  });

  it('lead starter sets are 5–13 blocks each (curated)', () => {
    for (const fn of leadPrimary) {
      const ids = STARTER_BLOCKS_BY_FUNCTION[fn];
      expect(ids.length, `${fn} set size`).toBeGreaterThanOrEqual(5);
      expect(ids.length, `${fn} set size`).toBeLessThanOrEqual(13);
    }
  });

  it('every set includes at least one lead-tagged or shared block', () => {
    const blockEngineMap = new Map<string, string[]>();
    for (const b of ALL_BLOCKS_DATA) {
      const engines = (b as unknown as { engines?: string[] }).engines;
      if (engines) blockEngineMap.set(b.id, engines);
    }
    for (const fn of leadPrimary) {
      const ids = STARTER_BLOCKS_BY_FUNCTION[fn];
      const hasLeadOrShared = ids.some((id) => {
        if (PHASE1_SHARED.has(id)) return true;
        const tags = blockEngineMap.get(id);
        return tags?.includes('lead') || tags?.includes('shared');
      });
      expect(hasLeadOrShared, `${fn}`).toBe(true);
    }
  });

  it('sample lead starter sets render correctly', () => {
    expect(getStarterBlocks('wealth_management')).toEqual(
      expect.arrayContaining(['fin_portfolio', 'fin_advisor']),
    );
    expect(getStarterBlocks('legal_services')).toEqual(
      expect.arrayContaining(['expert_profile', 'consultation_booking', 'proposal']),
    );
    expect(getStarterBlocks('real_estate')).toEqual(
      expect.arrayContaining(['property_listing', 'consultation_booking']),
    );
  });

  it('booking-primary and commerce-primary starter sets unchanged (backward-compat)', () => {
    const hotelStarter = getStarterBlocks('hotels_resorts');
    expect(hotelStarter).toContain('room_card');
    const ecommStarter = getStarterBlocks('ecommerce_d2c');
    expect(ecommStarter).toContain('product_card');
  });
});
