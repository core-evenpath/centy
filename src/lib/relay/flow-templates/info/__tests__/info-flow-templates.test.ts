import { describe, expect, it } from 'vitest';
import { INFO_FLOW_TEMPLATES, getInfoFlowTemplate, INFO_DIRECTORY_FLOW_TEMPLATE } from '../index';
import { FUNCTION_TO_ENGINES } from '@/lib/relay/engine-recipes';
import { ALL_BLOCKS_DATA } from '@/app/admin/relay/blocks/previews/_registry-data';

const KNOWN_BLOCK_IDS = new Set(ALL_BLOCKS_DATA.map((b) => b.id));
const PHASE1_SHARED = new Set(['greeting', 'suggestions', 'cart', 'contact', 'compare']);

describe('P2.info.M03 — Info flow templates', () => {
  it('exports 1 template (info is narrowest — single shared flow)', () => {
    expect(INFO_DIRECTORY_FLOW_TEMPLATE.id).toBe('info_tpl_directory');
    expect(INFO_DIRECTORY_FLOW_TEMPLATE.engine).toBe('info');
  });

  it('has canonical info serviceIntentBreaks', () => {
    expect(INFO_DIRECTORY_FLOW_TEMPLATE.serviceIntentBreaks).toEqual(
      expect.arrayContaining(['track-status', 'track-outage', 'report-issue']),
    );
  });

  it('stages: greeting → discovery → showcase → handoff (info skips conversion + followup + comparison)', () => {
    const types = INFO_DIRECTORY_FLOW_TEMPLATE.stages.map((s) => s.type);
    expect(types).toContain('greeting');
    expect(types).toContain('discovery');
    expect(types).toContain('handoff');
    // Info has no conversion (nothing to commit/transact) or followup
    // (no post-interaction state to revisit).
    expect(types).not.toContain('conversion');
    expect(types).not.toContain('followup');
    expect(types).not.toContain('comparison');
  });

  it('every stage block reference is valid', () => {
    for (const stage of INFO_DIRECTORY_FLOW_TEMPLATE.stages) {
      for (const blockId of stage.blockTypes) {
        const valid = KNOWN_BLOCK_IDS.has(blockId) || PHASE1_SHARED.has(blockId);
        expect(valid, `${stage.id} references unknown: ${blockId}`).toBe(true);
      }
    }
  });

  it('every info-primary functionId has template mapping', () => {
    const infoPrimary = Object.entries(FUNCTION_TO_ENGINES)
      .filter(([, engs]) => engs[0] === 'info')
      .map(([fn]) => fn);
    const uncovered = infoPrimary.filter((fn) => !INFO_FLOW_TEMPLATES[fn]);
    expect(uncovered).toEqual([]);
  });

  it('getInfoFlowTemplate returns null for unknown', () => {
    expect(getInfoFlowTemplate('not-a-fn')).toBeNull();
    expect(getInfoFlowTemplate(null)).toBeNull();
  });

  it('directory template routes all 3 info-primary fns', () => {
    for (const fn of ['public_transport', 'government', 'utilities']) {
      expect(getInfoFlowTemplate(fn)?.id).toBe('info_tpl_directory');
    }
  });
});
