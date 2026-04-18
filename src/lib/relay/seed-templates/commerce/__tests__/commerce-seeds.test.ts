import { describe, expect, it } from 'vitest';
import {
  COMMERCE_SEED_TEMPLATES,
  getCommerceSeedTemplate,
  listCommerceSeedTemplates,
  PRODUCTS_SEED,
  MENU_ITEMS_SEED,
  PRODUCT_CATEGORIES_SEED,
  BULK_OFFERS_SEED,
  SUBSCRIPTION_PLANS_SEED,
} from '../index';

describe('P2.commerce.M07 — Commerce seed templates', () => {
  it('ships exactly 5 templates', () => {
    expect(listCommerceSeedTemplates().length).toBe(5);
    expect(COMMERCE_SEED_TEMPLATES[PRODUCTS_SEED.id]).toBe(PRODUCTS_SEED);
    expect(COMMERCE_SEED_TEMPLATES[MENU_ITEMS_SEED.id]).toBe(MENU_ITEMS_SEED);
    expect(COMMERCE_SEED_TEMPLATES[PRODUCT_CATEGORIES_SEED.id]).toBe(PRODUCT_CATEGORIES_SEED);
    expect(COMMERCE_SEED_TEMPLATES[BULK_OFFERS_SEED.id]).toBe(BULK_OFFERS_SEED);
    expect(COMMERCE_SEED_TEMPLATES[SUBSCRIPTION_PLANS_SEED.id]).toBe(SUBSCRIPTION_PLANS_SEED);
  });

  it('each template has 3–5 items per spec', () => {
    for (const t of listCommerceSeedTemplates()) {
      expect(t.items.length, `${t.id} item count`).toBeGreaterThanOrEqual(3);
      expect(t.items.length, `${t.id} item count`).toBeLessThanOrEqual(5);
    }
  });

  it('every item has name + non-empty category + INR currency', () => {
    for (const t of listCommerceSeedTemplates()) {
      for (const item of t.items) {
        expect(item.name.trim().length).toBeGreaterThan(0);
        expect(item.category.trim().length).toBeGreaterThan(0);
        expect(item.currency).toBe('INR');
      }
    }
  });

  it('no seed item has real PII (name/address/phone patterns)', () => {
    const suspectPatterns = [
      /@/,                                    // email
      /\+\d{1,3}[\s-]?\d{3}/,                 // phone
      /\d+\s+[A-Z][a-z]+\s+(Street|Road|Ave)/, // street address
    ];
    for (const t of listCommerceSeedTemplates()) {
      for (const item of t.items) {
        const blob = `${item.name} ${item.description ?? ''}`;
        for (const re of suspectPatterns) {
          expect(re.test(blob), `${t.id}/${item.name} contains suspected real data`).toBe(false);
        }
      }
    }
  });

  it('every item has empty images array (partners upload their own)', () => {
    for (const t of listCommerceSeedTemplates()) {
      for (const item of t.items) {
        expect(Array.isArray(item.images)).toBe(true);
        expect(item.images.length).toBe(0);
      }
    }
  });

  it('all templates target existing system modules (product_catalog or food_menu)', () => {
    const validModuleSlugs = new Set(['product_catalog', 'food_menu']);
    for (const t of listCommerceSeedTemplates()) {
      expect(validModuleSlugs.has(t.moduleSlug), `${t.id} moduleSlug`).toBe(true);
    }
  });

  it('sortOrder is monotonically rising per template', () => {
    for (const t of listCommerceSeedTemplates()) {
      const orders = t.items.map((i) => i.sortOrder);
      expect(orders).toEqual([...orders].sort((a, b) => a - b));
    }
  });

  it('getCommerceSeedTemplate returns undefined for unknown id', () => {
    expect(getCommerceSeedTemplate('nope')).toBeUndefined();
    expect(getCommerceSeedTemplate(PRODUCTS_SEED.id)).toBe(PRODUCTS_SEED);
  });
});
