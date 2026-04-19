import { describe, expect, it } from 'vitest';
import { FUNCTION_TO_ENGINES, deriveEnginesFromFunctionId, getPartnerEngines } from '../engine-recipes';
import type { Engine } from '../engine-types';

// P2.info.M01 — verify Info recipe coverage.
//
// Info is the narrowest engine: directory navigation, hours,
// locations, contact info, status displays. Info-primary functionIds
// are partners whose primary visitor intent is "find information"
// rather than "transact," "reserve," "commit," or "inquire."
//
// The recipe has 3 info-primary rows:
//   public_transport    [info, service]
//   government          [info, engagement]
//   utilities           [info, service]
//
// All 3 have either service or engagement as secondary overlay —
// public transit routes track-status queries through service;
// government routes community consultations through engagement;
// utilities routes outage/bill queries through service.

const INFO_PRIMARY_EXPECTED = [
  'public_transport',
  'government',
  'utilities',
] as const;

describe('P2.info.M01 — Info recipe verification', () => {
  it('every expected info-primary functionId has info as the first engine', () => {
    for (const fn of INFO_PRIMARY_EXPECTED) {
      const engines = FUNCTION_TO_ENGINES[fn];
      expect(engines, `missing: ${fn}`).toBeDefined();
      expect(engines![0], `${fn} primary`).toBe('info');
    }
  });

  it('every info-primary has secondary overlay (service or engagement)', () => {
    for (const fn of INFO_PRIMARY_EXPECTED) {
      const engines = FUNCTION_TO_ENGINES[fn]!;
      const hasOverlay = engines.includes('service') || engines.includes('engagement');
      expect(hasOverlay, `${fn} lacks secondary overlay`).toBe(true);
    }
  });

  it('info-secondary rows (where info is not primary) preserved', () => {
    // info appears as secondary/tertiary for 9 other functionIds.
    const infoSecondary = [
      'k12_education', 'higher_education', 'hospitals', 'physical_retail',
      'ev_infrastructure', 'ngo_nonprofit', 'religious',
      'cultural_institutions', 'community_association',
    ];
    for (const fn of infoSecondary) {
      const engines = FUNCTION_TO_ENGINES[fn];
      expect(engines?.includes('info'), `${fn} lost info tag`).toBe(true);
    }
  });

  it('info-primary partner derivation', () => {
    // Post-P3.M03: recipe-table correctness tested via deriveEnginesFromFunctionId.
    const engines = deriveEnginesFromFunctionId('public_transport');
    expect(engines).toContain('info');
    expect(engines).toContain('service');
  });

  it('government has info + engagement (town halls / consultations)', () => {
    expect(FUNCTION_TO_ENGINES['government']).toEqual(['info', 'engagement']);
  });

  it('booking / commerce / lead / engagement primary rows unchanged', () => {
    const samples: Array<[string, Engine[]]> = [
      ['hotels_resorts', ['booking', 'service']],
      ['ecommerce_d2c', ['commerce', 'service']],
      ['wealth_management', ['lead', 'service']],
      ['ngo_nonprofit', ['engagement', 'info']],
    ];
    for (const [fn, expected] of samples) {
      expect(deriveEnginesFromFunctionId(fn)).toEqual(expected);
    }
  });

  it('coverage: 3 info-primary functionIds (narrow engine, as expected)', () => {
    const all = Object.entries(FUNCTION_TO_ENGINES).filter(
      ([, engs]) => engs[0] === 'info',
    );
    expect(all.length).toBe(3);
  });
});
