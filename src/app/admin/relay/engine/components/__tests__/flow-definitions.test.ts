import { describe, expect, it } from 'vitest';
import { FLOW_DEFINITIONS } from '../flow-definitions';
import { ALL_BLOCKS_DATA } from '../../../blocks/previews/_registry-data';

// Lock in the contract that every block referenced in a flow's
// happyPath or chatExample exists in the registry. If a flow drifts
// (block renamed, deleted) the test fails before the page renders a
// "⚠ block id not in registry" tile in production.

describe('Transaction flow definitions (PR fix-13)', () => {
  const knownBlockIds = new Set(ALL_BLOCKS_DATA.map((b) => b.id));

  it('has 5 flows with unique engines', () => {
    expect(FLOW_DEFINITIONS).toHaveLength(5);
    const engines = FLOW_DEFINITIONS.map((f) => f.engine);
    expect(new Set(engines).size).toBe(engines.length);
  });

  it('each happyPath has at least one required step', () => {
    for (const flow of FLOW_DEFINITIONS) {
      const required = flow.happyPath.filter((s) => s.required).length;
      expect(required, `${flow.label}: should have ≥1 required step`).toBeGreaterThan(0);
    }
  });

  it('every blockId in happyPath exists in the block registry', () => {
    for (const flow of FLOW_DEFINITIONS) {
      for (const step of flow.happyPath) {
        expect(
          knownBlockIds.has(step.blockId),
          `${flow.label}: happyPath references unknown block "${step.blockId}"`,
        ).toBe(true);
      }
    }
  });

  it('every blockId referenced in chatExample exists in the block registry', () => {
    for (const flow of FLOW_DEFINITIONS) {
      for (const turn of flow.chatExample) {
        if (turn.from === 'bot' && turn.blockId) {
          expect(
            knownBlockIds.has(turn.blockId),
            `${flow.label}: chatExample references unknown block "${turn.blockId}"`,
          ).toBe(true);
        }
      }
    }
  });

  it('every flow has a non-empty narrative', () => {
    for (const flow of FLOW_DEFINITIONS) {
      expect(flow.narrative.length).toBeGreaterThan(40);
    }
  });
});
