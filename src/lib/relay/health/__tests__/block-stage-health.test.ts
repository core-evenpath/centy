import { describe, expect, it } from 'vitest';
import { computeBlockHealth, isBlockRenderable, computeStageHealth } from '../index';
import type { BlockSnapshot, FlowSnapshot } from '../index';

const okBindings = (fields: string[]): BlockSnapshot['fieldBindings'] =>
  Object.fromEntries(fields.map((f) => [f, { bound: true, resolvedNonEmpty: true, type: 'string' as const }]));

function mkBlock(overrides: Partial<BlockSnapshot> & Pick<BlockSnapshot, 'id' | 'stage'>): BlockSnapshot {
  return {
    engines: ['booking'],
    requiredFields: overrides.requiredFields ?? [],
    optionalFields: overrides.optionalFields ?? [],
    moduleSlug: null,
    enabled: true,
    fieldBindings: overrides.fieldBindings ?? okBindings(overrides.requiredFields ?? []),
    ...overrides,
  };
}

describe('computeBlockHealth', () => {
  it('ok when all required fields are bound + non-empty', () => {
    const block = mkBlock({
      id: 'b1',
      stage: 'discovery',
      requiredFields: ['title', 'price'],
    });
    const h = computeBlockHealth(block, null);
    expect(h.status).toBe('ok');
    expect(h.fieldsOk).toBe(2);
    expect(h.fieldsMissing).toBe(0);
    expect(h.fieldsEmpty).toBe(0);
  });

  it('missing when a required field has no binding', () => {
    const block = mkBlock({
      id: 'b1',
      stage: 'discovery',
      requiredFields: ['title'],
      fieldBindings: { title: { bound: false, resolvedNonEmpty: false } },
    });
    const h = computeBlockHealth(block, null);
    expect(h.status).toBe('missing');
    expect(h.fieldsMissing).toBe(1);
  });

  it('empty when bound but resolves empty', () => {
    const block = mkBlock({
      id: 'b1',
      stage: 'discovery',
      requiredFields: ['title'],
      fieldBindings: { title: { bound: true, resolvedNonEmpty: false, type: 'string' } },
    });
    const h = computeBlockHealth(block, null);
    expect(h.status).toBe('empty');
  });

  it('flags module connection', () => {
    const block = mkBlock({ id: 'b1', stage: 'discovery', moduleSlug: 'rooms' });
    expect(computeBlockHealth(block, null).hasModuleConnection).toBe(true);
  });

  it('flags flow reference', () => {
    const block = mkBlock({ id: 'b1', stage: 'discovery' });
    const flow: FlowSnapshot = {
      flowId: 'f',
      stages: [{ stageId: 'discovery', blockIds: ['b1'] }],
    };
    expect(computeBlockHealth(block, flow).hasFlowReference).toBe(true);
  });

  it('isBlockRenderable false when disabled', () => {
    const block = mkBlock({ id: 'b1', stage: 'discovery', enabled: false });
    expect(isBlockRenderable(block)).toBe(false);
  });

  it('isBlockRenderable false when required field unbound', () => {
    const block = mkBlock({
      id: 'b1',
      stage: 'discovery',
      requiredFields: ['title'],
      fieldBindings: { title: { bound: false, resolvedNonEmpty: false } },
    });
    expect(isBlockRenderable(block)).toBe(false);
  });
});

describe('computeStageHealth', () => {
  it('red when stage has no blocks', () => {
    const h = computeStageHealth('discovery', []);
    expect(h.status).toBe('red');
    expect(h.blockCount).toBe(0);
  });

  it('green when all stage blocks are renderable', () => {
    const blocks = [
      mkBlock({ id: 'a', stage: 'discovery' }),
      mkBlock({ id: 'b', stage: 'discovery' }),
    ];
    const h = computeStageHealth('discovery', blocks);
    expect(h.status).toBe('green');
    expect(h.blockCount).toBe(2);
    expect(h.blocksWithData).toBe(2);
  });

  it('red when all blocks are un-renderable', () => {
    const blocks = [
      mkBlock({ id: 'a', stage: 'discovery', enabled: false }),
    ];
    const h = computeStageHealth('discovery', blocks);
    expect(h.status).toBe('red');
    expect(h.blocksWithData).toBe(0);
  });

  it('amber when some blocks renderable', () => {
    const blocks = [
      mkBlock({ id: 'a', stage: 'discovery' }),  // renderable
      mkBlock({ id: 'b', stage: 'discovery', enabled: false }), // not
    ];
    const h = computeStageHealth('discovery', blocks);
    expect(h.status).toBe('amber');
    expect(h.blocksWithData).toBe(1);
    expect(h.blockCount).toBe(2);
  });
});
