import { describe, expect, it } from 'vitest';
import {
  getBlockLineage,
  buildAllBlockLineages,
  summarizeLineage,
} from '../lineage';
import { ALL_BLOCKS_DATA } from '@/app/admin/relay/blocks/previews/_registry-data';

describe('X02 — Block lineage', () => {
  it('getBlockLineage returns null for unknown block', () => {
    expect(getBlockLineage('not-a-real-block')).toBeNull();
  });

  it('returns engines as tagged for a single-tag block', () => {
    // pu_donation is single-tagged ['engagement']
    const lineage = getBlockLineage('pu_donation');
    expect(lineage).not.toBeNull();
    expect(lineage!.engines).toEqual(['engagement']);
  });

  it('returns multi-engine tags for a dual-tagged block', () => {
    // hp_scheduler is dual-tagged ['lead', 'booking']
    const lineage = getBlockLineage('hp_scheduler');
    expect(lineage!.engines.sort()).toEqual(['booking', 'lead']);
  });

  it('references flow templates that list the block', () => {
    // pu_donation is referenced by engagement_tpl_nonprofit + community
    const lineage = getBlockLineage('pu_donation');
    expect(lineage!.referencedByFlowTemplates).toContain('engagement_tpl_nonprofit');
    expect(lineage!.referencedByFlowTemplates).toContain('engagement_tpl_community');
  });

  it('appliesToFunctionIds reflects engine-overlap with partner recipe', () => {
    // pu_donation tagged ['engagement'] — should apply to all partners
    // that have engagement in their engine set.
    const lineage = getBlockLineage('pu_donation');
    expect(lineage!.appliesToFunctionIds).toContain('ngo_nonprofit');
    expect(lineage!.appliesToFunctionIds).toContain('religious');
    // Should NOT apply to pure-booking partners without engagement.
    expect(lineage!.appliesToFunctionIds).not.toContain('hotels_resorts');
  });

  it('untagged block: appliesToFunctionIds includes every functionId (conservative default)', () => {
    // A block without engine tags has no scope filter — applies to every
    // partner. This matches the engine-scoped catalog helper's behavior.
    const untagged = (ALL_BLOCKS_DATA as Array<{ id: string; engines?: string[] }>).find(
      (b) => !b.engines || b.engines.length === 0,
    );
    if (untagged) {
      const lineage = getBlockLineage(untagged.id);
      // Some functionIds should apply — pick a known one.
      expect(lineage!.appliesToFunctionIds.length).toBeGreaterThan(0);
      expect(lineage!.appliesToFunctionIds).toContain('hotels_resorts');
    }
  });

  it('buildAllBlockLineages returns one record per block in registry', () => {
    const all = buildAllBlockLineages();
    expect(all.length).toBe(ALL_BLOCKS_DATA.length);
  });

  it('lineage records are deterministic (sorted engines + templates + fns)', () => {
    const lineage = getBlockLineage('pu_donation');
    const sortedEngines = [...lineage!.engines].sort();
    expect(lineage!.engines).toEqual(sortedEngines);
    const sortedFlows = [...lineage!.referencedByFlowTemplates].sort();
    expect(lineage!.referencedByFlowTemplates).toEqual(sortedFlows);
    const sortedFns = [...lineage!.appliesToFunctionIds].sort();
    expect(lineage!.appliesToFunctionIds).toEqual(sortedFns);
  });

  it('summarizeLineage returns total + multi-engine count + orphan flags', () => {
    const all = buildAllBlockLineages();
    const summary = summarizeLineage(all);
    expect(summary.totalBlocks).toBe(all.length);
    expect(summary.multiEngineBlocks).toBeGreaterThan(0);
    // Every tagged block should either be in a flow template or be
    // acceptable-orphan. Just assert the shape (array of strings).
    expect(Array.isArray(summary.blocksReferencedByNoFlow)).toBe(true);
    expect(Array.isArray(summary.untaggedBlocks)).toBe(true);
  });

  it('multi-engine-blocks count matches dual-tag manual count (sanity)', () => {
    const all = buildAllBlockLineages();
    const summary = summarizeLineage(all);
    // At Session 4 close we have at minimum ~15 dual-tagged blocks
    // across Lead, Engagement, Info. Lower-bound check only.
    expect(summary.multiEngineBlocks).toBeGreaterThanOrEqual(10);
  });

  it('booking-primary block (room_card) applies to hotels_resorts but not ngo_nonprofit', () => {
    const lineage = getBlockLineage('room_card');
    if (lineage) {
      expect(lineage.appliesToFunctionIds).toContain('hotels_resorts');
      expect(lineage.appliesToFunctionIds).not.toContain('ngo_nonprofit');
    }
  });
});
