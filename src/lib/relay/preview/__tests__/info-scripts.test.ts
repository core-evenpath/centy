import { describe, expect, it } from 'vitest';
import {
  INFO_PREVIEW_SCRIPTS,
  getInfoScriptById,
  getInfoScriptsBySubVertical,
  type InfoSubVertical,
} from '../info-scripts';

describe('P2.info.M08 — Info preview scripts', () => {
  it('ships exactly 24 scripts (8 × 3 sub-verticals)', () => {
    expect(INFO_PREVIEW_SCRIPTS.length).toBe(24);
  });

  it('every script declares engine: info', () => {
    for (const s of INFO_PREVIEW_SCRIPTS) {
      expect(s.engine).toBe('info');
    }
  });

  it('covers all 3 sub-verticals with 8 each', () => {
    const expected: InfoSubVertical[] = [
      'public-transport', 'government', 'utilities',
    ];
    for (const sv of expected) {
      expect(getInfoScriptsBySubVertical(sv).length, sv).toBe(8);
    }
  });

  it('every script id is unique', () => {
    const ids = INFO_PREVIEW_SCRIPTS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('static text only — no template interpolation or Date.now', () => {
    for (const s of INFO_PREVIEW_SCRIPTS) {
      for (const t of s.turns) {
        expect(t.content).not.toMatch(/\$\{/);
        expect(t.content).not.toMatch(/Date\.now/);
      }
    }
  });

  it('getInfoScriptById lookup works', () => {
    expect(getInfoScriptById('pt-01-hours')).toBeDefined();
    expect(getInfoScriptById('gov-08-escalate')).toBeDefined();
    expect(getInfoScriptById('util-04-outage')).toBeDefined();
    expect(getInfoScriptById('not-a-real-id')).toBeUndefined();
  });

  it('each sub-vertical covers all 8 canonical themes via numbered suffix', () => {
    for (const prefix of ['pt', 'gov', 'util']) {
      for (const n of ['01', '02', '03', '04', '05', '06', '07', '08']) {
        const match = INFO_PREVIEW_SCRIPTS.find((s) => s.id.startsWith(`${prefix}-${n}-`));
        expect(match, `${prefix}-${n}`).toBeDefined();
      }
    }
  });
});
