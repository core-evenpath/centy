import { describe, expect, it } from 'vitest';
import {
  LEAD_PREVIEW_SCRIPTS,
  getLeadScriptById,
  getLeadScriptsBySubVertical,
  type LeadSubVertical,
} from '../lead-scripts';

describe('P2.lead.M08 — Lead preview scripts', () => {
  it('ships exactly 24 scripts (8 × 3 sub-verticals)', () => {
    expect(LEAD_PREVIEW_SCRIPTS.length).toBe(24);
  });

  it('every script declares engine: lead', () => {
    for (const s of LEAD_PREVIEW_SCRIPTS) {
      expect(s.engine).toBe('lead');
    }
  });

  it('covers all 3 sub-verticals with exactly 8 scripts each', () => {
    const expected: LeadSubVertical[] = [
      'financial-services', 'professional-services', 'real-estate-b2b',
    ];
    for (const sv of expected) {
      const scripts = getLeadScriptsBySubVertical(sv);
      expect(scripts.length, sv).toBe(8);
    }
  });

  it('every script id is unique', () => {
    const ids = LEAD_PREVIEW_SCRIPTS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every script has ≥ 1 turn with non-empty content', () => {
    for (const s of LEAD_PREVIEW_SCRIPTS) {
      expect(s.turns.length).toBeGreaterThan(0);
      for (const t of s.turns) {
        expect(t.role).toBe('user');
        expect(t.content.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('static text only — no template interpolation or Date.now', () => {
    for (const s of LEAD_PREVIEW_SCRIPTS) {
      for (const t of s.turns) {
        expect(t.content).not.toMatch(/\$\{/);
        expect(t.content).not.toMatch(/Date\.now/);
      }
    }
  });

  it('getLeadScriptById lookup works', () => {
    expect(getLeadScriptById('fin-01-inquiry')).toBeDefined();
    expect(getLeadScriptById('prof-04-consult')).toBeDefined();
    expect(getLeadScriptById('re-08-edge-multi-party')).toBeDefined();
    expect(getLeadScriptById('not-a-real-id')).toBeUndefined();
  });

  it('each sub-vertical covers all 8 canonical themes (by numbered id suffix)', () => {
    const themeSuffixes = ['01-', '02-', '03-', '04-', '05-', '06-', '07-', '08-'];
    for (const prefix of ['fin', 'prof', 're']) {
      for (const suffix of themeSuffixes) {
        const match = LEAD_PREVIEW_SCRIPTS.find((s) => s.id.startsWith(`${prefix}-${suffix}`));
        expect(match, `prefix=${prefix} suffix=${suffix}`).toBeDefined();
      }
    }
  });
});
