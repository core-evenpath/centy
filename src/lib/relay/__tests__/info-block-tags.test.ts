import { describe, expect, it } from 'vitest';
import { ALL_BLOCKS_DATA } from '@/app/admin/relay/blocks/previews/_registry-data';

// P2.info.M02 — verify Info block tagging.
//
// Info session extends previously-tagged info blocks (Session 3
// Engagement tagged 4 public_nonprofit blocks with info: pu_service_directory,
// pu_document_portal dual, pu_outage_status, pu_office_locator) with 2
// newly tagged blocks:
// - facility (healthcare) — pure info (directory, hours, locations)
// - tl_schedule_grid (travel_transport) — dual ['booking', 'info']
//   per Adjustment 4: ticketed-transport uses it as booking;
//   public_transport uses it as read-only info
//
// No new single-purpose info blocks authored — existing vertical blocks
// provide the info surface info-primary partners need.

type WithEngines = { id: string; engines?: string[] };

describe('P2.info.M02 — Info block tagging', () => {
  it('≥ 5 blocks tagged with info (single or dual)', () => {
    const tagged = (ALL_BLOCKS_DATA as WithEngines[]).filter(
      (b) => b.engines?.includes('info'),
    );
    expect(tagged.length).toBeGreaterThanOrEqual(5);
  });

  it('expected info-pure blocks single-tagged ["info"]', () => {
    const infoPure = [
      'pu_service_directory', 'pu_office_locator', 'pu_outage_status',
      'facility',
    ];
    for (const id of infoPure) {
      const block = (ALL_BLOCKS_DATA as WithEngines[]).find((b) => b.id === id);
      expect(block, `missing: ${id}`).toBeDefined();
      expect(block?.engines, `${id}`).toEqual(['info']);
    }
  });

  it('expected dual-tags preserved (Adjustment 4 justifications)', () => {
    const duals: Array<[string, string[]]> = [
      ['pu_document_portal', ['info', 'engagement']],
      ['tl_schedule_grid', ['booking', 'info']],
    ];
    for (const [id, tags] of duals) {
      const block = (ALL_BLOCKS_DATA as WithEngines[]).find((b) => b.id === id);
      expect(block?.engines, `${id}`).toEqual(tags);
    }
  });

  it('zero triple-tags on info-bearing blocks (Q17 guard)', () => {
    const tagged = (ALL_BLOCKS_DATA as WithEngines[]).filter(
      (b) => b.engines?.includes('info'),
    );
    const triples = tagged.filter((b) => (b.engines?.length ?? 0) >= 3);
    expect(triples.map((b) => b.id)).toEqual([]);
  });

  it('other engines unchanged (backward compat)', () => {
    const checks = [
      ['room_card', 'booking'],
      ['product_card', 'commerce'],
      ['fin_product_card', 'lead'],
      ['pu_donation', 'engagement'],
    ] as const;
    for (const [id, engine] of checks) {
      const block = (ALL_BLOCKS_DATA as WithEngines[]).find((b) => b.id === id);
      if (block) {
        expect(block.engines?.includes(engine), `${id}`).toBe(true);
      }
    }
  });
});
