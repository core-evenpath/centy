import { describe, expect, it } from 'vitest';
import { STARTER_BLOCKS_BY_FUNCTION, getStarterBlocks } from '../starter-blocks';
import { ALL_BLOCKS_DATA } from '@/app/admin/relay/blocks/previews/_registry-data';
import { FUNCTION_TO_ENGINES } from '@/lib/relay/engine-recipes';

describe('STARTER_BLOCKS_BY_FUNCTION (M14)', () => {
  const knownBlockIds = new Set(ALL_BLOCKS_DATA.map((b) => b.id));

  it('every starter id references an existing registry block', () => {
    for (const [fn, ids] of Object.entries(STARTER_BLOCKS_BY_FUNCTION)) {
      for (const id of ids) {
        expect(knownBlockIds.has(id), `${fn} references unknown block: ${id}`).toBe(true);
      }
    }
  });

  it('each starter set is 5–13 blocks (curated, not all-available)', () => {
    for (const [fn, ids] of Object.entries(STARTER_BLOCKS_BY_FUNCTION)) {
      expect(ids.length, `${fn} size`).toBeGreaterThanOrEqual(5);
      expect(ids.length, `${fn} size`).toBeLessThanOrEqual(13);
    }
  });

  it('covers all booking-primary hospitality functionIds', () => {
    const hospitality = [
      'hotels_resorts', 'budget_accommodation', 'boutique_bnb',
      'serviced_apartments', 'vacation_rentals', 'guest_houses',
      'camping_glamping', 'corporate_housing', 'event_venues',
    ];
    for (const fn of hospitality) {
      expect(STARTER_BLOCKS_BY_FUNCTION[fn], `${fn} starter set`).toBeDefined();
    }
  });

  it('covers healthcare + wellness + travel booking primaries', () => {
    const booking_primary_checkpoints = [
      // healthcare
      'primary_care', 'dental_care', 'mental_health', 'veterinary',
      // wellness
      'hair_beauty', 'spa_wellness', 'fitness_gym', 'yoga_mindfulness',
      // travel
      'ticketing_booking', 'airport_transfer', 'taxi_ride', 'cinemas_theaters',
    ];
    for (const fn of booking_primary_checkpoints) {
      expect(STARTER_BLOCKS_BY_FUNCTION[fn], `${fn} starter set`).toBeDefined();
    }
  });

  it('getStarterBlocks returns [] for unknown functionId', () => {
    expect(getStarterBlocks('nonexistent_fn')).toEqual([]);
  });

  it('every set includes at least one booking-tagged or shared block', () => {
    const blockEngineMap = new Map<string, string[]>();
    for (const b of ALL_BLOCKS_DATA) {
      const engines = (b as unknown as { engines?: string[] }).engines;
      if (engines) blockEngineMap.set(b.id, engines);
    }
    for (const [fn, ids] of Object.entries(STARTER_BLOCKS_BY_FUNCTION)) {
      const hasBookingOrShared = ids.some((id) => {
        const tags = blockEngineMap.get(id);
        return tags?.includes('booking') || tags?.includes('shared');
      });
      expect(hasBookingOrShared, `${fn} starter set`).toBe(true);
    }
  });

  it('starter sets exist only for functionIds with a primary engine (booking/commerce/lead/engagement/info)', () => {
    // Phase 1 M14 asserted booking-only; extensions shipped per session:
    // Session 1 Commerce, Session 2 Lead, Session 3 Engagement, Session
    // 4 Info. All 5 primary engines now permitted.
    for (const fn of Object.keys(STARTER_BLOCKS_BY_FUNCTION)) {
      const engines = FUNCTION_TO_ENGINES[fn] ?? [];
      const hasCovered =
        engines.includes('booking') ||
        engines.includes('commerce') ||
        engines.includes('lead') ||
        engines.includes('engagement') ||
        engines.includes('info');
      expect(hasCovered, `${fn} has engines [${engines.join(',')}]`).toBe(true);
    }
  });
});
