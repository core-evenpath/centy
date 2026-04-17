import { describe, expect, it } from 'vitest';
import {
  levenshtein,
  levenshteinSimilarity,
  tokenOverlapSimilarity,
  fieldSimilarity,
  FIX_MATCH_THRESHOLD,
  proposeBindFieldFixes,
  proposeEmptyModuleFix,
  proposeEnableBlockFix,
  proposeConnectFlowFix,
} from '../index';
import type { BlockSnapshot, ModuleSnapshot } from '../index';

describe('similarity primitives', () => {
  it('levenshtein: identical = 0, empty = length', () => {
    expect(levenshtein('', '')).toBe(0);
    expect(levenshtein('abc', 'abc')).toBe(0);
    expect(levenshtein('', 'abc')).toBe(3);
    expect(levenshtein('abc', '')).toBe(3);
  });

  it('levenshteinSimilarity: bounds [0, 1]', () => {
    expect(levenshteinSimilarity('abc', 'abc')).toBe(1);
    expect(levenshteinSimilarity('abc', 'xyz')).toBe(0);
    const s = levenshteinSimilarity('room_name', 'roomName');
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThan(1);
  });

  it('tokenOverlap: identical tokens despite casing / separator', () => {
    expect(tokenOverlapSimilarity('room_name', 'roomName')).toBe(1);
    expect(tokenOverlapSimilarity('unit-price', 'unitPrice')).toBe(1);
    expect(tokenOverlapSimilarity('foo', 'bar')).toBe(0);
  });

  it('fieldSimilarity: combines both, picks best', () => {
    expect(fieldSimilarity('room_name', 'roomName')).toBeGreaterThanOrEqual(
      FIX_MATCH_THRESHOLD,
    );
    expect(fieldSimilarity('price', 'amount')).toBeLessThan(FIX_MATCH_THRESHOLD);
  });
});

describe('proposeBindFieldFixes', () => {
  const mkBlock = (overrides: Partial<BlockSnapshot> = {}): BlockSnapshot => ({
    id: 'blk1',
    engines: ['booking'],
    stage: 'discovery',
    requiredFields: [],
    optionalFields: [],
    moduleSlug: 'mod1',
    enabled: true,
    fieldBindings: {},
    ...overrides,
  });

  it('emits a proposal when a module field has name + type match', () => {
    const block = mkBlock({
      requiredFields: ['title'],
      fieldBindings: { title: { bound: false, resolvedNonEmpty: false, type: 'string' } },
    });
    const module: ModuleSnapshot = {
      slug: 'mod1',
      itemCount: 2,
      fieldCatalog: [{ name: 'title', type: 'string' }],
    };
    const proposals = proposeBindFieldFixes(block, module);
    expect(proposals.length).toBe(1);
    expect(proposals[0].kind).toBe('bind-field');
    expect(proposals[0].confidence).toBe('high');
    expect(proposals[0].sourceField).toBe('title');
  });

  it('skips fields that are already bound', () => {
    const block = mkBlock({
      requiredFields: ['title'],
      fieldBindings: { title: { bound: true, resolvedNonEmpty: true, type: 'string' } },
    });
    const module: ModuleSnapshot = {
      slug: 'mod1',
      itemCount: 1,
      fieldCatalog: [{ name: 'title', type: 'string' }],
    };
    expect(proposeBindFieldFixes(block, module)).toEqual([]);
  });

  it('skips type-incompatible matches', () => {
    const block = mkBlock({
      requiredFields: ['price'],
      fieldBindings: { price: { bound: false, resolvedNonEmpty: false, type: 'number' } },
    });
    const module: ModuleSnapshot = {
      slug: 'mod1',
      itemCount: 1,
      fieldCatalog: [{ name: 'price', type: 'string' }], // same name, wrong type
    };
    expect(proposeBindFieldFixes(block, module)).toEqual([]);
  });

  it('returns empty when no module provided', () => {
    const block = mkBlock({
      requiredFields: ['title'],
      fieldBindings: { title: { bound: false, resolvedNonEmpty: false, type: 'string' } },
    });
    expect(proposeBindFieldFixes(block, null)).toEqual([]);
  });
});

describe('singular proposal builders', () => {
  it('proposeEmptyModuleFix shape', () => {
    const p = proposeEmptyModuleFix('blk1', 'mod1');
    expect(p.kind).toBe('populate-module');
    expect(p.moduleSlug).toBe('mod1');
    expect(p.blockId).toBe('blk1');
    expect(p.payload).toEqual({ blockId: 'blk1', moduleSlug: 'mod1' });
  });

  it('proposeEnableBlockFix shape', () => {
    const p = proposeEnableBlockFix('blk1');
    expect(p.kind).toBe('enable-block');
    expect(p.confidence).toBe('high');
    expect(p.payload).toEqual({ blockId: 'blk1' });
  });

  it('proposeConnectFlowFix shape', () => {
    const p = proposeConnectFlowFix('blk1', 'discovery');
    expect(p.kind).toBe('connect-flow');
    expect(p.payload).toEqual({ blockId: 'blk1', stageId: 'discovery' });
  });
});
