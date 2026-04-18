import { describe, expect, it } from 'vitest';
import {
  COMMERCE_PREVIEW_SCRIPTS,
  getCommerceScriptById,
  getCommerceScriptsBySubVertical,
  type CommerceSubVertical,
} from '../commerce-scripts';

describe('P2.commerce.M08 — Commerce preview scripts', () => {
  it('ships exactly 32 scripts (8 × 4 sub-verticals)', () => {
    expect(COMMERCE_PREVIEW_SCRIPTS.length).toBe(32);
  });

  it('every script declares engine: commerce', () => {
    for (const s of COMMERCE_PREVIEW_SCRIPTS) {
      expect(s.engine).toBe('commerce');
    }
  });

  it('covers all 4 sub-verticals with exactly 8 scripts each', () => {
    const expected: CommerceSubVertical[] = [
      'general-retail', 'food-delivery', 'food-supply', 'subscription',
    ];
    for (const sv of expected) {
      const scripts = getCommerceScriptsBySubVertical(sv);
      expect(scripts.length, sv).toBe(8);
    }
  });

  it('every script id is unique', () => {
    const ids = COMMERCE_PREVIEW_SCRIPTS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every script has >= 1 turn with non-empty content', () => {
    for (const s of COMMERCE_PREVIEW_SCRIPTS) {
      expect(s.turns.length).toBeGreaterThan(0);
      for (const t of s.turns) {
        expect(t.role).toBe('user');
        expect(t.content.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('static text only — no template interpolation or Date.now', () => {
    for (const s of COMMERCE_PREVIEW_SCRIPTS) {
      for (const t of s.turns) {
        expect(t.content).not.toMatch(/\$\{/);
        expect(t.content).not.toMatch(/Date\.now/);
      }
    }
  });

  it('getCommerceScriptById lookup works', () => {
    expect(getCommerceScriptById('retail-01-browse')).toBeDefined();
    expect(getCommerceScriptById('not-a-real-id')).toBeUndefined();
  });

  it('each sub-vertical covers all 8 canonical themes', () => {
    const themeSuffixes = [
      '01-browse',
      '02-specific-',
      '03-compare',
      '04-',       // cart-checkout / bulk-order / subscribe
      '05-',       // promo / volume / promo / promo
      '06-',       // track-order variants
      '07-',       // cancel-order variants
      '08-edge',
    ];
    for (const sv of ['retail', 'food-delivery', 'food-supply', 'subscription']) {
      for (const suffix of themeSuffixes) {
        const match = COMMERCE_PREVIEW_SCRIPTS.find((s) => s.id.includes(`${sv}-${suffix}`) || s.id.includes(suffix));
        expect(match, `sub=${sv} suffix=${suffix}`).toBeDefined();
      }
    }
  });
});
