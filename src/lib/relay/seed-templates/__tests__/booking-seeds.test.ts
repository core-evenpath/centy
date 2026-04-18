import { describe, expect, it } from 'vitest';
import {
  BOOKING_SEED_TEMPLATES,
  getSeedTemplate,
  listSeedTemplates,
  ROOMS_SEED,
  AMENITIES_SEED,
  HOUSE_RULES_SEED,
  LOCAL_EXPERIENCES_SEED,
  MEAL_PLANS_SEED,
} from '../booking/index';

describe('BOOKING_SEED_TEMPLATES (M15)', () => {
  it('ships exactly 5 templates (rooms, amenities, house_rules, local_experiences, meal_plans)', () => {
    expect(listSeedTemplates().length).toBe(5);
    expect(BOOKING_SEED_TEMPLATES[ROOMS_SEED.id]).toBe(ROOMS_SEED);
    expect(BOOKING_SEED_TEMPLATES[AMENITIES_SEED.id]).toBe(AMENITIES_SEED);
    expect(BOOKING_SEED_TEMPLATES[HOUSE_RULES_SEED.id]).toBe(HOUSE_RULES_SEED);
    expect(BOOKING_SEED_TEMPLATES[LOCAL_EXPERIENCES_SEED.id]).toBe(LOCAL_EXPERIENCES_SEED);
    expect(BOOKING_SEED_TEMPLATES[MEAL_PLANS_SEED.id]).toBe(MEAL_PLANS_SEED);
  });

  it('each template has 3–5 items per spec', () => {
    for (const t of listSeedTemplates()) {
      expect(t.items.length, `${t.id} item count`).toBeGreaterThanOrEqual(3);
      expect(t.items.length, `${t.id} item count`).toBeLessThanOrEqual(5);
    }
  });

  it('every item has name + non-empty category + INR currency', () => {
    for (const t of listSeedTemplates()) {
      for (const item of t.items) {
        expect(item.name.trim().length).toBeGreaterThan(0);
        expect(item.category.trim().length).toBeGreaterThan(0);
        expect(item.currency).toBe('INR');
      }
    }
  });

  it('no seed item has real name / address / phone (generic only)', () => {
    const suspectPatterns = [
      /@/,                                    // email
      /\+\d{1,3}[\s-]?\d{3}/,                 // phone
      /\d+\s+[A-Z][a-z]+\s+(Street|Road|Ave)/, // street address
    ];
    for (const t of listSeedTemplates()) {
      for (const item of t.items) {
        const blob = `${item.name} ${item.description ?? ''}`;
        for (const re of suspectPatterns) {
          expect(re.test(blob), `${t.id}/${item.name} contains suspected real data`).toBe(false);
        }
      }
    }
  });

  it('every item has empty images array (partners upload their own)', () => {
    for (const t of listSeedTemplates()) {
      for (const item of t.items) {
        expect(Array.isArray(item.images)).toBe(true);
        expect(item.images.length).toBe(0);
      }
    }
  });

  it('getSeedTemplate returns undefined for unknown id', () => {
    expect(getSeedTemplate('nope')).toBeUndefined();
    expect(getSeedTemplate(ROOMS_SEED.id)).toBe(ROOMS_SEED);
  });

  it('sortOrder is set and monotonically rising per template', () => {
    for (const t of listSeedTemplates()) {
      const orders = t.items.map((i) => i.sortOrder);
      expect(orders).toEqual([...orders].sort((a, b) => a - b));
    }
  });

  it('all templates target the room_inventory module', () => {
    for (const t of listSeedTemplates()) {
      expect(t.moduleSlug).toBe('room_inventory');
    }
  });
});
