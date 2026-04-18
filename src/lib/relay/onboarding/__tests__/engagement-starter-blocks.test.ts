import { describe, expect, it } from 'vitest';
import { STARTER_BLOCKS_BY_FUNCTION, getStarterBlocks } from '../starter-blocks';
import { FUNCTION_TO_ENGINES } from '@/lib/relay/engine-recipes';
import { ALL_BLOCKS_DATA } from '@/app/admin/relay/blocks/previews/_registry-data';

const KNOWN_BLOCK_IDS = new Set(ALL_BLOCKS_DATA.map((b) => b.id));
const PHASE1_SHARED = new Set(['greeting', 'suggestions', 'cart', 'contact', 'compare']);

describe('P2.engagement.M06 — Engagement starter blocks', () => {
  const engagementPrimary = Object.entries(FUNCTION_TO_ENGINES)
    .filter(([, engs]) => engs[0] === 'engagement')
    .map(([fn]) => fn);

  it('every engagement-primary functionId has a starter set', () => {
    const missing = engagementPrimary.filter((fn) => !STARTER_BLOCKS_BY_FUNCTION[fn]);
    expect(missing).toEqual([]);
  });

  it('every engagement starter set references real blocks', () => {
    for (const fn of engagementPrimary) {
      const ids = STARTER_BLOCKS_BY_FUNCTION[fn];
      for (const id of ids) {
        const known = KNOWN_BLOCK_IDS.has(id) || PHASE1_SHARED.has(id);
        expect(known, `${fn} references unknown: ${id}`).toBe(true);
      }
    }
  });

  it('engagement starter sets are 5–13 blocks each', () => {
    for (const fn of engagementPrimary) {
      const ids = STARTER_BLOCKS_BY_FUNCTION[fn];
      expect(ids.length, `${fn}`).toBeGreaterThanOrEqual(5);
      expect(ids.length, `${fn}`).toBeLessThanOrEqual(13);
    }
  });

  it('service-exception partners have no Service-only blocks in their starter set', () => {
    // Adjustment 3 + 6: for engagement-primary service-exception
    // partners, starter sets should not reference blocks that ONLY
    // serve service (like pu_application_tracker).
    const blockEngineMap = new Map<string, string[]>();
    for (const b of ALL_BLOCKS_DATA) {
      const engines = (b as unknown as { engines?: string[] }).engines;
      if (engines) blockEngineMap.set(b.id, engines);
    }
    for (const fn of engagementPrimary) {
      const partnerEngines = FUNCTION_TO_ENGINES[fn] ?? [];
      if (partnerEngines.includes('service')) continue; // not an exception partner
      const ids = STARTER_BLOCKS_BY_FUNCTION[fn];
      for (const id of ids) {
        const tags = blockEngineMap.get(id);
        // Phase 1 shared + untagged blocks (null tags) are always OK.
        if (!tags) continue;
        // Block tagged ONLY service → shouldn't appear in exception
        // partner's starter set.
        const isServiceOnly = tags.length === 1 && tags[0] === 'service';
        expect(isServiceOnly, `${fn} has service-only block: ${id}`).toBe(false);
      }
    }
  });

  it('every set includes at least one engagement-tagged or shared block', () => {
    const blockEngineMap = new Map<string, string[]>();
    for (const b of ALL_BLOCKS_DATA) {
      const engines = (b as unknown as { engines?: string[] }).engines;
      if (engines) blockEngineMap.set(b.id, engines);
    }
    for (const fn of engagementPrimary) {
      const ids = STARTER_BLOCKS_BY_FUNCTION[fn];
      const hasEngagementOrShared = ids.some((id) => {
        if (PHASE1_SHARED.has(id)) return true;
        const tags = blockEngineMap.get(id);
        return tags?.includes('engagement') || tags?.includes('shared');
      });
      expect(hasEngagementOrShared, `${fn}`).toBe(true);
    }
  });

  it('sample engagement starter sets render correctly', () => {
    expect(getStarterBlocks('ngo_nonprofit')).toEqual(
      expect.arrayContaining(['pu_donation', 'pu_impact_report', 'pu_volunteer']),
    );
    expect(getStarterBlocks('religious')).toEqual(
      expect.arrayContaining(['pu_event_calendar', 'pu_donation']),
    );
  });

  it('booking + commerce + lead starter sets unchanged', () => {
    expect(getStarterBlocks('hotels_resorts')).toContain('room_card');
    expect(getStarterBlocks('ecommerce_d2c')).toContain('product_card');
    expect(getStarterBlocks('wealth_management')).toEqual(
      expect.arrayContaining(['fin_portfolio', 'fin_advisor']),
    );
  });
});
