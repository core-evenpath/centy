import { describe, expect, it } from 'vitest';
import {
  ALL_PREVIEW_SCRIPTS,
  getAnyScriptById,
  SUB_VERTICAL_LABELS,
} from '../scripts-index';
import { BOOKING_PREVIEW_SCRIPTS } from '../booking-scripts';
import { COMMERCE_PREVIEW_SCRIPTS } from '../commerce-scripts';
import { LEAD_PREVIEW_SCRIPTS } from '../lead-scripts';

describe('Q8 — unified Preview Copilot scripts index', () => {
  it('ALL_PREVIEW_SCRIPTS contains booking + commerce + lead scripts', () => {
    expect(ALL_PREVIEW_SCRIPTS.length).toBe(
      BOOKING_PREVIEW_SCRIPTS.length +
        COMMERCE_PREVIEW_SCRIPTS.length +
        LEAD_PREVIEW_SCRIPTS.length,
    );
  });

  it('getAnyScriptById resolves a booking script', () => {
    const script = getAnyScriptById('hotel-01-greeting-browse');
    expect(script).toBeDefined();
    expect(script?.engine).toBe('booking');
  });

  it('getAnyScriptById resolves a commerce script', () => {
    const script = getAnyScriptById('retail-01-browse');
    expect(script).toBeDefined();
    expect(script?.engine).toBe('commerce');
  });

  it('getAnyScriptById returns undefined for unknown id', () => {
    expect(getAnyScriptById('not-a-real-script')).toBeUndefined();
  });

  it('SUB_VERTICAL_LABELS covers every sub-vertical used by any script', () => {
    const subVerticals = new Set(ALL_PREVIEW_SCRIPTS.map((s) => s.subVertical));
    for (const sv of subVerticals) {
      expect(SUB_VERTICAL_LABELS[sv], `label missing for ${sv}`).toBeDefined();
    }
  });

  it('script ids are globally unique across booking + commerce', () => {
    const ids = ALL_PREVIEW_SCRIPTS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
