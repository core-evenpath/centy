import { describe, expect, it } from 'vitest';
import {
  BOOKING_PREVIEW_SCRIPTS,
  getScriptById,
  getScriptsBySubVertical,
  type PreviewScript,
} from '../booking-scripts';

describe('BOOKING_PREVIEW_SCRIPTS — structural acceptance (M13)', () => {
  it('contains exactly 40 scripts (8 per sub-vertical × 5 sub-verticals)', () => {
    expect(BOOKING_PREVIEW_SCRIPTS.length).toBe(40);
  });

  it('covers all 5 sub-verticals with exactly 8 scripts each', () => {
    const expected: PreviewScript['subVertical'][] = [
      'hotel', 'clinic', 'wellness', 'ticketing', 'airport-transfer',
    ];
    for (const sv of expected) {
      const scripts = getScriptsBySubVertical(sv);
      expect(scripts.length).toBe(8);
    }
  });

  it('every script has engine: booking', () => {
    for (const s of BOOKING_PREVIEW_SCRIPTS) {
      expect(s.engine).toBe('booking');
    }
  });

  it('every script id is unique', () => {
    const ids = BOOKING_PREVIEW_SCRIPTS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every script has ≥ 1 user turn', () => {
    for (const s of BOOKING_PREVIEW_SCRIPTS) {
      expect(s.turns.length).toBeGreaterThan(0);
    }
  });

  it('every turn is role: user with non-empty content', () => {
    for (const s of BOOKING_PREVIEW_SCRIPTS) {
      for (const t of s.turns) {
        expect(t.role).toBe('user');
        expect(typeof t.content).toBe('string');
        expect(t.content.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('all user messages are static — no template interpolation (${}) or Date.now', () => {
    for (const s of BOOKING_PREVIEW_SCRIPTS) {
      for (const t of s.turns) {
        expect(t.content).not.toMatch(/\$\{/);
        expect(t.content).not.toMatch(/Date\.now/);
      }
    }
  });

  it('getScriptById returns the expected script', () => {
    const found = getScriptById('hotel-01-greeting-browse');
    expect(found).toBeDefined();
    expect(found?.subVertical).toBe('hotel');
    expect(getScriptById('not-a-real-id')).toBeUndefined();
  });

  it('each sub-vertical covers all 8 canonical themes', () => {
    const themeSuffixes = [
      '01-greeting-browse',
      '02-specific-availability',
      '03-comparison',
      '04-booking-flow',
      '05-addon',
      '06-service-break',
      '07-cancel',
      '08-edge', // edge-case suffix varies per sub-vertical; match prefix
    ];
    for (const sv of ['hotel', 'clinic', 'wellness', 'ticketing', 'airport-transfer'] as const) {
      for (const suffix of themeSuffixes) {
        const match = BOOKING_PREVIEW_SCRIPTS.find(
          (s) => s.subVertical === sv && s.id.includes(suffix),
        );
        expect(match, `expected script matching sub=${sv} suffix=${suffix}`).toBeDefined();
      }
    }
  });
});
