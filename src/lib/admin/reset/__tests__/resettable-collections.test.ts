import { describe, expect, it } from 'vitest';
import {
  RESETTABLE_COLLECTIONS,
  getResettableCollection,
  listResettableCollectionIds,
  type ResettableCollection,
  type ResetVerb,
} from '../resettable-collections';

// MR01 — allow-list integrity tests. The allow-list is a typed source
// file; these tests lock in the discipline that an unknown id can't be
// looked up and every entry carries all required metadata.

describe('MR01 — RESETTABLE_COLLECTIONS allow-list', () => {
  it('contains at least the Q10-audit-flagged collections', () => {
    const ids = listResettableCollectionIds();
    expect(ids).toContain('relay-engine-health');
    expect(ids).toContain('relay-block-configs');
    expect(ids).toContain('relay-sessions');
    expect(ids).toContain('partner-module-items');
  });

  it('every entry has required fields populated', () => {
    for (const c of RESETTABLE_COLLECTIONS) {
      expect(c.id, `id empty on ${JSON.stringify(c)}`).toBeTruthy();
      expect(c.collection, `collection empty on ${c.id}`).toBeTruthy();
      expect(c.label, `label empty on ${c.id}`).toBeTruthy();
      expect(c.description.length, `description <20 chars on ${c.id}`).toBeGreaterThan(20);
      expect(c.verb).toMatch(/^(recompute|clear|invalidate|delete)$/);
      expect(Array.isArray(c.requiredScopes), `requiredScopes not array on ${c.id}`).toBe(true);
      expect(Array.isArray(c.optionalScopes), `optionalScopes not array on ${c.id}`).toBe(true);
    }
  });

  it('ids are globally unique', () => {
    const ids = RESETTABLE_COLLECTIONS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('getResettableCollection resolves known ids', () => {
    expect(getResettableCollection('relay-engine-health')?.verb).toBe('recompute');
    expect(getResettableCollection('partner-module-items')?.verb).toBe('delete');
  });

  it('getResettableCollection returns undefined for unknown id (no fallback)', () => {
    expect(getResettableCollection('not-a-collection')).toBeUndefined();
    expect(getResettableCollection('')).toBeUndefined();
    expect(getResettableCollection('relayEngineHealth')).toBeUndefined(); // raw collection name, not id
  });

  it('postResetAction is only set where the verb makes it sensible', () => {
    // Only 'recompute' verbs should carry the trigger-recompute hint.
    for (const c of RESETTABLE_COLLECTIONS) {
      if (c.postResetAction === 'trigger-recompute') {
        expect(c.verb, `${c.id} has trigger-recompute hint but verb is ${c.verb}`).toBe('recompute');
      }
    }
  });

  it('verbs are distributed across the 4 allowed values', () => {
    const verbs: ResetVerb[] = RESETTABLE_COLLECTIONS.map((c) => c.verb);
    const unique = new Set(verbs);
    // At least 3 distinct verbs in use across the allow-list
    expect(unique.size).toBeGreaterThanOrEqual(3);
  });

  it('preview-sessions is the only entry without required scopes (safe-by-design)', () => {
    // preview_ sessions are safe to clear globally because they never
    // collide with production state.
    const noRequiredScope = RESETTABLE_COLLECTIONS.filter((c) => c.requiredScopes.length === 0);
    expect(noRequiredScope.map((c) => c.id)).toEqual(['preview-sessions']);
  });

  it('every entry with per-partner scope targets a partner-scoped collection path OR a collection with partnerId filter field', () => {
    // Sanity: if the scope requires a partnerId, the collection path
    // must either contain `{partnerId}` (subcollection) OR be a
    // top-level collection where docs are keyed by partnerId.
    for (const c of RESETTABLE_COLLECTIONS) {
      if (c.requiredScopes.includes('per-partner')) {
        const hasPartnerPlaceholder = c.collection.includes('{partnerId}');
        const isPartnerKeyed = c.collection === 'relayEngineHealth' || c.collection === 'relaySessions';
        expect(
          hasPartnerPlaceholder || isPartnerKeyed,
          `${c.id} requires per-partner but collection ${c.collection} is neither subcollection nor partner-keyed`,
        ).toBe(true);
      }
    }
  });

  it('per-module scope implies per-partner (modules belong to partners)', () => {
    for (const c of RESETTABLE_COLLECTIONS) {
      if (c.requiredScopes.includes('per-module')) {
        expect(c.requiredScopes, `${c.id} has per-module without per-partner`).toContain('per-partner');
      }
    }
  });
});
