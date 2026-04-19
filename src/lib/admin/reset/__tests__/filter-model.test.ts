import { describe, expect, it } from 'vitest';
import {
  validateFilterForCollection,
  describeFilter,
  type ResetFilter,
} from '../filter-model';
import {
  getResettableCollection,
  RESETTABLE_COLLECTIONS,
} from '../resettable-collections';

// MR02 — filter validation tests. Each allow-list collection gets at
// least one "valid filter" fixture + one "invalid filter" fixture.

describe('MR02 — validateFilterForCollection', () => {
  describe('relay-engine-health (per-partner required, per-engine optional)', () => {
    const c = getResettableCollection('relay-engine-health')!;

    it('valid with partnerId only', () => {
      const r = validateFilterForCollection(c, { partnerId: 'p1' });
      expect(r).toEqual({ valid: true });
    });

    it('valid with partnerId + engine', () => {
      const r = validateFilterForCollection(c, { partnerId: 'p1', engine: 'booking' });
      expect(r).toEqual({ valid: true });
    });

    it('invalid without partnerId', () => {
      const r = validateFilterForCollection(c, {});
      expect(r.valid).toBe(false);
      if (!r.valid) {
        expect(r.errors.some((e) => e.includes('per-partner'))).toBe(true);
      }
    });

    it('valid when unscoped=true even without partnerId', () => {
      // Note: env gate tested separately at action layer. Filter
      // validation accepts unscoped here.
      const r = validateFilterForCollection(c, { unscoped: true });
      expect(r).toEqual({ valid: true });
    });
  });

  describe('partner-module-items (per-partner + per-module required)', () => {
    const c = getResettableCollection('partner-module-items')!;

    it('valid with partnerId + moduleSlug', () => {
      const r = validateFilterForCollection(c, { partnerId: 'p1', moduleSlug: 'product_catalog' });
      expect(r).toEqual({ valid: true });
    });

    it('invalid with partnerId only (missing moduleSlug)', () => {
      const r = validateFilterForCollection(c, { partnerId: 'p1' });
      expect(r.valid).toBe(false);
      if (!r.valid) {
        expect(r.errors.some((e) => e.includes('per-module'))).toBe(true);
      }
    });

    it('invalid with moduleSlug only (missing partnerId)', () => {
      const r = validateFilterForCollection(c, { moduleSlug: 'product_catalog' });
      expect(r.valid).toBe(false);
      if (!r.valid) {
        expect(r.errors.some((e) => e.includes('per-partner'))).toBe(true);
      }
    });

    it('invalid without any scope', () => {
      const r = validateFilterForCollection(c, {});
      expect(r.valid).toBe(false);
      if (!r.valid) {
        // Two errors enumerated (not early-exit)
        expect(r.errors.length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('preview-sessions (no required scope)', () => {
    const c = getResettableCollection('preview-sessions')!;

    it('valid with empty filter', () => {
      const r = validateFilterForCollection(c, {});
      expect(r).toEqual({ valid: true });
    });

    it('valid with optional partnerId filter', () => {
      const r = validateFilterForCollection(c, { partnerId: 'p1' });
      expect(r).toEqual({ valid: true });
    });
  });

  describe('shape guards', () => {
    const c = getResettableCollection('relay-engine-health')!;

    it('rejects malformed partnerId with injection-looking chars', () => {
      const r = validateFilterForCollection(c, { partnerId: '../../etc/passwd' });
      expect(r.valid).toBe(false);
      if (!r.valid) {
        expect(r.errors.some((e) => e.includes('partnerId malformed'))).toBe(true);
      }
    });

    it('rejects partnerId with spaces', () => {
      const r = validateFilterForCollection(c, { partnerId: 'p 1' });
      expect(r.valid).toBe(false);
    });

    it('rejects moduleSlug with uppercase (module slugs are lowercase_with_underscores)', () => {
      const mc = getResettableCollection('partner-module-items')!;
      const r = validateFilterForCollection(mc, {
        partnerId: 'p1',
        moduleSlug: 'Product_Catalog',
      });
      expect(r.valid).toBe(false);
    });

    it('rejects non-ISO dateRangeFrom', () => {
      const r = validateFilterForCollection(c, {
        partnerId: 'p1',
        dateRangeFrom: '04/19/2026',
        dateRangeTo: '2026-04-20',
      });
      expect(r.valid).toBe(false);
      if (!r.valid) {
        expect(r.errors.some((e) => e.includes('dateRangeFrom not ISO'))).toBe(true);
      }
    });

    it('rejects partial date range', () => {
      const r = validateFilterForCollection(c, {
        partnerId: 'p1',
        dateRangeFrom: '2026-04-19',
      });
      expect(r.valid).toBe(false);
      if (!r.valid) {
        expect(r.errors.some((e) => e.includes('both be set or both omitted'))).toBe(true);
      }
    });

    it('rejects reversed date range (from > to)', () => {
      const r = validateFilterForCollection(c, {
        partnerId: 'p1',
        dateRangeFrom: '2026-04-20',
        dateRangeTo: '2026-04-19',
      });
      expect(r.valid).toBe(false);
      if (!r.valid) {
        expect(r.errors.some((e) => e.includes('dateRangeFrom must be'))).toBe(true);
      }
    });

    it('accepts ISO datetime with timezone', () => {
      const r = validateFilterForCollection(c, {
        partnerId: 'p1',
        dateRangeFrom: '2026-04-19T00:00:00Z',
        dateRangeTo: '2026-04-20T23:59:59+05:30',
      });
      expect(r).toEqual({ valid: true });
    });
  });

  describe('every allow-list collection has a valid filter fixture', () => {
    // Meta-test: prove the validation function never flags a
    // plausible filter as invalid for a known collection.
    const fixtures: Record<string, ResetFilter> = {
      'relay-engine-health': { partnerId: 'p1' },
      'relay-block-configs': { partnerId: 'p1' },
      'relay-sessions': { partnerId: 'p1' },
      'preview-sessions': {},
      'partner-module-items': { partnerId: 'p1', moduleSlug: 'product_catalog' },
    };

    for (const c of RESETTABLE_COLLECTIONS) {
      it(`${c.id} accepts its fixture`, () => {
        const fixture = fixtures[c.id];
        expect(fixture, `no fixture for ${c.id}`).toBeDefined();
        const r = validateFilterForCollection(c, fixture);
        expect(r).toEqual({ valid: true });
      });
    }
  });
});

describe('MR02 — describeFilter', () => {
  it('empty filter returns empty array', () => {
    expect(describeFilter({})).toEqual([]);
  });

  it('marks unscoped prominently', () => {
    expect(describeFilter({ unscoped: true })).toEqual(['UNSCOPED']);
  });

  it('composes multiple fields', () => {
    const parts = describeFilter({
      partnerId: 'p1',
      engine: 'booking',
      dateRangeFrom: '2026-04-19',
      dateRangeTo: '2026-04-20',
    });
    expect(parts).toEqual([
      'partner=p1',
      'engine=booking',
      'dateRange=2026-04-19..2026-04-20',
    ]);
  });

  it('does not emit date range when only one end is set', () => {
    const parts = describeFilter({ partnerId: 'p1', dateRangeFrom: '2026-04-19' });
    expect(parts).not.toContain(expect.stringContaining('dateRange='));
  });
});
