import { describe, expect, it } from 'vitest';
import {
  LEAD_SEED_TEMPLATES,
  getLeadSeedTemplate,
  listLeadSeedTemplates,
  SERVICES_SEED,
  ADVISORS_SEED,
  ELIGIBILITY_SEED,
  DOCUMENT_TYPES_SEED,
  CASE_STUDIES_SEED,
} from '../index';

describe('P2.lead.M07 — Lead seed templates', () => {
  it('exports exactly 5 templates', () => {
    expect(listLeadSeedTemplates()).toHaveLength(5);
  });

  it('every template id has the lead.* prefix', () => {
    for (const tpl of listLeadSeedTemplates()) {
      expect(tpl.id).toMatch(/^lead\./);
    }
  });

  it('every template targets a moduleServices / moduleAdvisors / moduleEligibility / moduleDocumentTypes / moduleCaseStudies module', () => {
    const expected = new Set([
      'moduleServices', 'moduleAdvisors', 'moduleEligibility',
      'moduleDocumentTypes', 'moduleCaseStudies',
    ]);
    const seen = new Set<string>();
    for (const tpl of listLeadSeedTemplates()) {
      seen.add(tpl.moduleSlug);
      expect(expected.has(tpl.moduleSlug), `unexpected module: ${tpl.moduleSlug}`).toBe(true);
    }
    // 5 templates × 1 unique module each
    expect(seen.size).toBe(5);
  });

  it('every item has currency INR and empty images array (no PII / no assets)', () => {
    for (const tpl of listLeadSeedTemplates()) {
      for (const item of tpl.items) {
        expect(item.currency).toBe('INR');
        expect(item.images).toEqual([]);
      }
    }
  });

  it('every item has a non-empty name and sortOrder ≥ 1', () => {
    for (const tpl of listLeadSeedTemplates()) {
      for (const item of tpl.items) {
        expect(item.name.length).toBeGreaterThan(0);
        expect(item.sortOrder).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('descriptions do not leak real-name PII patterns', () => {
    // Anti-PII smoke: explicit name-like patterns. Cheap; won't catch
    // everything but catches obvious mistakes.
    const forbid = /@\w+\.(com|in|org)|\b(Mr|Mrs|Ms|Dr)\.\s+[A-Z][a-z]+/;
    for (const tpl of listLeadSeedTemplates()) {
      for (const item of tpl.items) {
        if (item.description) {
          expect(item.description, `${item.name}`).not.toMatch(forbid);
        }
      }
    }
  });

  it('total items = 25 across 5 templates (5 items each)', () => {
    const total = listLeadSeedTemplates().reduce((sum, t) => sum + t.items.length, 0);
    expect(total).toBe(25);
  });

  it('getLeadSeedTemplate resolves by id; returns undefined for unknown', () => {
    expect(getLeadSeedTemplate('lead.services')?.id).toBe('lead.services');
    expect(getLeadSeedTemplate('lead.advisors')?.id).toBe('lead.advisors');
    expect(getLeadSeedTemplate('not-a-seed')).toBeUndefined();
  });

  it('individual exports match registry', () => {
    expect(LEAD_SEED_TEMPLATES[SERVICES_SEED.id]).toBe(SERVICES_SEED);
    expect(LEAD_SEED_TEMPLATES[ADVISORS_SEED.id]).toBe(ADVISORS_SEED);
    expect(LEAD_SEED_TEMPLATES[ELIGIBILITY_SEED.id]).toBe(ELIGIBILITY_SEED);
    expect(LEAD_SEED_TEMPLATES[DOCUMENT_TYPES_SEED.id]).toBe(DOCUMENT_TYPES_SEED);
    expect(LEAD_SEED_TEMPLATES[CASE_STUDIES_SEED.id]).toBe(CASE_STUDIES_SEED);
  });
});
