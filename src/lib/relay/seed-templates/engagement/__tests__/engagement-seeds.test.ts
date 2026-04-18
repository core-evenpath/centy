import { describe, expect, it } from 'vitest';
import {
  ENGAGEMENT_SEED_TEMPLATES,
  getEngagementSeedTemplate,
  listEngagementSeedTemplates,
  CAMPAIGNS_SEED,
  EVENTS_SEED,
  IMPACT_STORIES_SEED,
  MEMBERSHIPS_SEED,
  CAUSES_SEED,
} from '../index';

describe('P2.engagement.M07 — Engagement seed templates', () => {
  it('exports exactly 5 templates', () => {
    expect(listEngagementSeedTemplates()).toHaveLength(5);
  });

  it('every template id has the engagement.* prefix', () => {
    for (const tpl of listEngagementSeedTemplates()) {
      expect(tpl.id).toMatch(/^engagement\./);
    }
  });

  it('every template targets a distinct expected module', () => {
    const expected = new Set([
      'moduleCampaigns', 'moduleEvents', 'moduleImpactStories',
      'moduleMemberships', 'moduleCauses',
    ]);
    const seen = new Set<string>();
    for (const tpl of listEngagementSeedTemplates()) {
      seen.add(tpl.moduleSlug);
      expect(expected.has(tpl.moduleSlug), `unexpected module: ${tpl.moduleSlug}`).toBe(true);
    }
    expect(seen.size).toBe(5);
  });

  it('every item has INR currency and empty images (no PII / no assets)', () => {
    for (const tpl of listEngagementSeedTemplates()) {
      for (const item of tpl.items) {
        expect(item.currency).toBe('INR');
        expect(item.images).toEqual([]);
      }
    }
  });

  it('every item has a non-empty name and sortOrder ≥ 1', () => {
    for (const tpl of listEngagementSeedTemplates()) {
      for (const item of tpl.items) {
        expect(item.name.length).toBeGreaterThan(0);
        expect(item.sortOrder).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('descriptions do not leak real-name PII patterns', () => {
    const forbid = /@\w+\.(com|in|org)|\b(Mr|Mrs|Ms|Dr)\.\s+[A-Z][a-z]+/;
    for (const tpl of listEngagementSeedTemplates()) {
      for (const item of tpl.items) {
        if (item.description) {
          expect(item.description, `${item.name}`).not.toMatch(forbid);
        }
      }
    }
  });

  it('total items = 25 across 5 templates', () => {
    const total = listEngagementSeedTemplates().reduce((s, t) => s + t.items.length, 0);
    expect(total).toBe(25);
  });

  it('getEngagementSeedTemplate resolves by id; undefined for unknown', () => {
    expect(getEngagementSeedTemplate('engagement.campaigns')?.id).toBe('engagement.campaigns');
    expect(getEngagementSeedTemplate('engagement.events')?.id).toBe('engagement.events');
    expect(getEngagementSeedTemplate('not-a-seed')).toBeUndefined();
  });

  it('individual exports match registry', () => {
    expect(ENGAGEMENT_SEED_TEMPLATES[CAMPAIGNS_SEED.id]).toBe(CAMPAIGNS_SEED);
    expect(ENGAGEMENT_SEED_TEMPLATES[EVENTS_SEED.id]).toBe(EVENTS_SEED);
    expect(ENGAGEMENT_SEED_TEMPLATES[IMPACT_STORIES_SEED.id]).toBe(IMPACT_STORIES_SEED);
    expect(ENGAGEMENT_SEED_TEMPLATES[MEMBERSHIPS_SEED.id]).toBe(MEMBERSHIPS_SEED);
    expect(ENGAGEMENT_SEED_TEMPLATES[CAUSES_SEED.id]).toBe(CAUSES_SEED);
  });
});
