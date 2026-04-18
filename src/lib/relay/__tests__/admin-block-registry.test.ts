import { describe, expect, it } from 'vitest';
import {
  getAllowedBlocksForFunction,
  getAllowedBlocksForFunctionAndEngine,
  getAllowedBlockIdsForEngine,
} from '../admin-block-registry';

describe('getAllowedBlocksForFunctionAndEngine (M12)', () => {
  it('null engine is permissive — returns full function catalog', () => {
    const withEngine = getAllowedBlocksForFunctionAndEngine('hotels_resorts', null);
    const withoutEngine = getAllowedBlocksForFunction('hotels_resorts');
    expect(withEngine.map((b) => b.id).sort()).toEqual(
      withoutEngine.map((b) => b.id).sort(),
    );
  });

  it('undefined engine is permissive — returns full function catalog', () => {
    const withEngine = getAllowedBlocksForFunctionAndEngine('hotels_resorts', undefined);
    const withoutEngine = getAllowedBlocksForFunction('hotels_resorts');
    expect(withEngine.length).toBe(withoutEngine.length);
  });

  it('booking scope preserves booking-tagged blocks for hotels_resorts', () => {
    const blocks = getAllowedBlocksForFunctionAndEngine('hotels_resorts', 'booking');
    const ids = blocks.map((b) => b.id);
    // Core booking blocks from M04 tagging
    expect(ids).toContain('room_card');
    expect(ids).toContain('availability');
    expect(ids).toContain('check_in');
    expect(ids).toContain('concierge');
  });

  it('booking scope preserves shared-tagged blocks', () => {
    const blocks = getAllowedBlocksForFunctionAndEngine('hotels_resorts', 'booking');
    const ids = blocks.map((b) => b.id);
    // Shared blocks from M04 tagging
    expect(ids).toContain('greeting');
    expect(ids).toContain('contact');
    expect(ids).toContain('promo');
  });

  it('booking scope stays under 25 blocks for hotels_resorts (catalog-size budget)', () => {
    const blocks = getAllowedBlocksForFunctionAndEngine('hotels_resorts', 'booking');
    expect(blocks.length).toBeLessThanOrEqual(25);
  });

  it('untagged blocks pass through (non-booking verticals preserve legacy behavior)', () => {
    // E-commerce partners have blocks that aren't engine-tagged yet
    // (M04 only tagged 7 booking verticals). These must not be dropped.
    const blocks = getAllowedBlocksForFunctionAndEngine('ecommerce_d2c', 'commerce');
    // We expect SOME blocks back — even if only shared ones, but the
    // untagged e-commerce vertical blocks should also remain in the list.
    expect(blocks.length).toBeGreaterThan(0);
  });

  it('commerce scope does not include booking-only blocks for a hotel partner', () => {
    // A hotel partner asking a commerce question (unusual) should NOT
    // see booking-only blocks — they belong to a different engine.
    const blocks = getAllowedBlocksForFunctionAndEngine('hotels_resorts', 'commerce');
    const ids = blocks.map((b) => b.id);
    // room_card is booking-only; should be excluded under commerce engine
    expect(ids).not.toContain('room_card');
    expect(ids).not.toContain('availability');
    // Shared blocks still present
    expect(ids).toContain('greeting');
    expect(ids).toContain('contact');
  });

  it('getAllowedBlockIdsForEngine returns a flat string array', () => {
    const ids = getAllowedBlockIdsForEngine('hotels_resorts', 'booking');
    expect(Array.isArray(ids)).toBe(true);
    expect(ids.every((x) => typeof x === 'string')).toBe(true);
  });

  it('unknown functionId returns shared blocks only (plus any untagged)', () => {
    const blocks = getAllowedBlocksForFunctionAndEngine('nonexistent_fn', 'booking');
    const ids = blocks.map((b) => b.id);
    // Shared blocks always appear
    expect(ids).toContain('greeting');
    // No vertical-specific booking blocks
    expect(ids).not.toContain('room_card');
  });

  it('catalog size: engine-scope trims vs unscoped for hotels_resorts', () => {
    const scoped = getAllowedBlocksForFunctionAndEngine('hotels_resorts', 'booking');
    const unscoped = getAllowedBlocksForFunction('hotels_resorts');
    // Booking scope should equal or subset of unscoped — in the hotel
    // case all blocks are booking-native so the lengths match.
    expect(scoped.length).toBeLessThanOrEqual(unscoped.length);
  });
});
