import { describe, expect, it } from 'vitest';
import { STARTER_BLOCKS_BY_FUNCTION, getStarterBlocks } from '../starter-blocks';
import { FUNCTION_TO_ENGINES } from '@/lib/relay/engine-recipes';
import { ALL_BLOCKS_DATA } from '@/app/admin/relay/blocks/previews/_registry-data';

const KNOWN_BLOCK_IDS = new Set(ALL_BLOCKS_DATA.map((b) => b.id));
const PHASE1_SHARED = new Set(['greeting', 'suggestions', 'cart', 'contact', 'compare']);

describe('P2.info.M06 — Info starter blocks', () => {
  const infoPrimary = Object.entries(FUNCTION_TO_ENGINES)
    .filter(([, engs]) => engs[0] === 'info')
    .map(([fn]) => fn);

  it('every info-primary functionId has a starter set', () => {
    const missing = infoPrimary.filter((fn) => !STARTER_BLOCKS_BY_FUNCTION[fn]);
    expect(missing).toEqual([]);
  });

  it('every info starter set references real blocks', () => {
    for (const fn of infoPrimary) {
      const ids = STARTER_BLOCKS_BY_FUNCTION[fn];
      for (const id of ids) {
        const known = KNOWN_BLOCK_IDS.has(id) || PHASE1_SHARED.has(id);
        expect(known, `${fn} references unknown: ${id}`).toBe(true);
      }
    }
  });

  it('info starter sets are 5–13 blocks each (narrow by design)', () => {
    for (const fn of infoPrimary) {
      const ids = STARTER_BLOCKS_BY_FUNCTION[fn];
      expect(ids.length, fn).toBeGreaterThanOrEqual(5);
      expect(ids.length, fn).toBeLessThanOrEqual(13);
    }
  });

  it('every set includes at least one info-tagged or shared block', () => {
    const blockEngineMap = new Map<string, string[]>();
    for (const b of ALL_BLOCKS_DATA) {
      const engines = (b as unknown as { engines?: string[] }).engines;
      if (engines) blockEngineMap.set(b.id, engines);
    }
    for (const fn of infoPrimary) {
      const ids = STARTER_BLOCKS_BY_FUNCTION[fn];
      const hasInfoOrShared = ids.some((id) => {
        if (PHASE1_SHARED.has(id)) return true;
        const tags = blockEngineMap.get(id);
        return tags?.includes('info') || tags?.includes('shared');
      });
      expect(hasInfoOrShared, fn).toBe(true);
    }
  });

  it('sample info starter sets render correctly', () => {
    expect(getStarterBlocks('public_transport')).toEqual(
      expect.arrayContaining(['tl_schedule_grid', 'pu_office_locator']),
    );
    expect(getStarterBlocks('government')).toEqual(
      expect.arrayContaining(['pu_service_directory', 'pu_document_portal']),
    );
    expect(getStarterBlocks('utilities')).toEqual(
      expect.arrayContaining(['pu_outage_status']),
    );
  });

  it('other engine starter sets unchanged', () => {
    expect(getStarterBlocks('hotels_resorts')).toContain('room_card');
    expect(getStarterBlocks('ngo_nonprofit')).toContain('pu_donation');
  });
});
