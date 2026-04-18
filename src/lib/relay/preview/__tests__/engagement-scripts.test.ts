import { describe, expect, it } from 'vitest';
import {
  ENGAGEMENT_PREVIEW_SCRIPTS,
  getEngagementScriptById,
  getEngagementScriptsBySubVertical,
  type EngagementSubVertical,
} from '../engagement-scripts';

describe('P2.engagement.M08 — Engagement preview scripts', () => {
  it('ships exactly 24 scripts (8 × 3 sub-verticals)', () => {
    expect(ENGAGEMENT_PREVIEW_SCRIPTS.length).toBe(24);
  });

  it('every script declares engine: engagement', () => {
    for (const s of ENGAGEMENT_PREVIEW_SCRIPTS) {
      expect(s.engine).toBe('engagement');
    }
  });

  it('covers all 3 sub-verticals with exactly 8 scripts each', () => {
    const expected: EngagementSubVertical[] = [
      'nonprofit-charity', 'community-engagement', 'subscription-rsvp',
    ];
    for (const sv of expected) {
      expect(getEngagementScriptsBySubVertical(sv).length, sv).toBe(8);
    }
  });

  it('every script id is unique', () => {
    const ids = ENGAGEMENT_PREVIEW_SCRIPTS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every script has ≥ 1 turn with non-empty content', () => {
    for (const s of ENGAGEMENT_PREVIEW_SCRIPTS) {
      expect(s.turns.length).toBeGreaterThan(0);
      for (const t of s.turns) {
        expect(t.role).toBe('user');
        expect(t.content.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('static text only — no template interpolation or Date.now', () => {
    for (const s of ENGAGEMENT_PREVIEW_SCRIPTS) {
      for (const t of s.turns) {
        expect(t.content).not.toMatch(/\$\{/);
        expect(t.content).not.toMatch(/Date\.now/);
      }
    }
  });

  it('nonprofit-charity has substitute themes at positions 5 and 6 (service-exception)', () => {
    // Adjustment 3: ngo_nonprofit has no service in its recipe, so the
    // preview themes that depend on service-overlay (receipt-lookup
    // and cancel-recurring) are substituted with community-testimonial
    // and mission-deep-dive.
    const nonprofit5 = ENGAGEMENT_PREVIEW_SCRIPTS.find((s) => s.id === 'nonprofit-05-testimonial-substitute');
    const nonprofit6 = ENGAGEMENT_PREVIEW_SCRIPTS.find((s) => s.id === 'nonprofit-06-mission-deep');
    expect(nonprofit5, 'nonprofit theme-5 substitute').toBeDefined();
    expect(nonprofit6, 'nonprofit theme-6 substitute').toBeDefined();
    expect(nonprofit5?.label).toMatch(/substitute/i);
    expect(nonprofit6?.label).toMatch(/substitute/i);
  });

  it('community + subscription have standard service-overlay themes at positions 5 and 6', () => {
    const communityReceipt = ENGAGEMENT_PREVIEW_SCRIPTS.find((s) => s.id === 'community-05-receipt');
    const subReceipt = ENGAGEMENT_PREVIEW_SCRIPTS.find((s) => s.id === 'sub-05-receipt');
    expect(communityReceipt, 'community receipt').toBeDefined();
    expect(subReceipt, 'subscription receipt').toBeDefined();
  });

  it('getEngagementScriptById lookup works', () => {
    expect(getEngagementScriptById('nonprofit-01-first-donate')).toBeDefined();
    expect(getEngagementScriptById('community-03-event-rsvp')).toBeDefined();
    expect(getEngagementScriptById('sub-08-gift-membership')).toBeDefined();
    expect(getEngagementScriptById('not-a-real-id')).toBeUndefined();
  });
});
