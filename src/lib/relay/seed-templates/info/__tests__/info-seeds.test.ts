import { describe, expect, it } from 'vitest';
import {
  INFO_SEED_TEMPLATES,
  getInfoSeedTemplate,
  listInfoSeedTemplates,
  LOCATIONS_SEED,
  SCHEDULES_SEED,
  STATUS_ENTRIES_SEED,
} from '../index';

describe('P2.info.M07 — Info seed templates', () => {
  it('exports 3 templates (narrowest engine — fewest seeds)', () => {
    expect(listInfoSeedTemplates()).toHaveLength(3);
  });

  it('every template id has info.* prefix', () => {
    for (const tpl of listInfoSeedTemplates()) {
      expect(tpl.id).toMatch(/^info\./);
    }
  });

  it('every template targets a distinct module', () => {
    const seen = new Set<string>();
    for (const tpl of listInfoSeedTemplates()) {
      seen.add(tpl.moduleSlug);
    }
    expect(seen.size).toBe(3);
  });

  it('every item INR currency, empty images', () => {
    for (const tpl of listInfoSeedTemplates()) {
      for (const item of tpl.items) {
        expect(item.currency).toBe('INR');
        expect(item.images).toEqual([]);
      }
    }
  });

  it('every item has non-empty name and sortOrder ≥ 1', () => {
    for (const tpl of listInfoSeedTemplates()) {
      for (const item of tpl.items) {
        expect(item.name.length).toBeGreaterThan(0);
        expect(item.sortOrder).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('no PII patterns in descriptions', () => {
    const forbid = /@\w+\.(com|in|org)|\b(Mr|Mrs|Ms|Dr)\.\s+[A-Z][a-z]+/;
    for (const tpl of listInfoSeedTemplates()) {
      for (const item of tpl.items) {
        if (item.description) {
          expect(item.description, item.name).not.toMatch(forbid);
        }
      }
    }
  });

  it('total items = 15 across 3 templates', () => {
    const total = listInfoSeedTemplates().reduce((s, t) => s + t.items.length, 0);
    expect(total).toBe(15);
  });

  it('getInfoSeedTemplate resolves by id; undefined for unknown', () => {
    expect(getInfoSeedTemplate('info.locations')?.id).toBe('info.locations');
    expect(getInfoSeedTemplate('not-a-seed')).toBeUndefined();
  });

  it('individual exports match registry', () => {
    expect(INFO_SEED_TEMPLATES[LOCATIONS_SEED.id]).toBe(LOCATIONS_SEED);
    expect(INFO_SEED_TEMPLATES[SCHEDULES_SEED.id]).toBe(SCHEDULES_SEED);
    expect(INFO_SEED_TEMPLATES[STATUS_ENTRIES_SEED.id]).toBe(STATUS_ENTRIES_SEED);
  });
});
