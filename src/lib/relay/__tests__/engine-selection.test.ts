import { describe, expect, it } from 'vitest';
import { selectActiveEngine } from '../engine-selection';

describe('selectActiveEngine — four outcomes', () => {
  it('sticky: current engine still in partnerEngines, no strong hint', () => {
    const r = selectActiveEngine({
      currentActive: 'booking',
      engineConfidence: null,
      partnerEngines: ['booking', 'service'],
    });
    expect(r).toEqual({ engine: 'booking', reason: 'sticky' });
  });

  it('switch-strong-hint: strong hint to a different in-partner engine', () => {
    const r = selectActiveEngine({
      currentActive: 'booking',
      engineHint: 'service',
      engineConfidence: 'strong',
      partnerEngines: ['booking', 'service'],
    });
    expect(r).toEqual({ engine: 'service', reason: 'switch-strong-hint' });
  });

  it('fallback-first: no current active, pick first partner engine', () => {
    const r = selectActiveEngine({
      currentActive: null,
      engineConfidence: null,
      partnerEngines: ['commerce', 'booking', 'service'],
    });
    expect(r).toEqual({ engine: 'commerce', reason: 'fallback-first' });
  });

  it('fallback-none: partnerEngines empty', () => {
    const r = selectActiveEngine({
      currentActive: null,
      engineConfidence: null,
      partnerEngines: [],
    });
    expect(r).toEqual({ engine: null, reason: 'fallback-none' });
  });
});

describe('selectActiveEngine — weak hints never switch', () => {
  it('weak hint does not switch, even to a valid target', () => {
    const r = selectActiveEngine({
      currentActive: 'booking',
      engineHint: 'service',
      engineConfidence: 'weak',
      partnerEngines: ['booking', 'service'],
    });
    expect(r.reason).toBe('sticky');
    expect(r.engine).toBe('booking');
  });

  it('weak hint on first turn stays on fallback-first', () => {
    const r = selectActiveEngine({
      currentActive: null,
      engineHint: 'service',
      engineConfidence: 'weak',
      partnerEngines: ['booking', 'service'],
    });
    expect(r.reason).toBe('fallback-first');
    expect(r.engine).toBe('booking');
  });
});

describe('selectActiveEngine — edge cases', () => {
  it('strong hint not in partnerEngines → sticky', () => {
    const r = selectActiveEngine({
      currentActive: 'booking',
      engineHint: 'commerce',
      engineConfidence: 'strong',
      partnerEngines: ['booking', 'service'],
    });
    expect(r).toEqual({ engine: 'booking', reason: 'sticky' });
  });

  it('strong hint matches current engine → sticky (no redundant switch)', () => {
    const r = selectActiveEngine({
      currentActive: 'booking',
      engineHint: 'booking',
      engineConfidence: 'strong',
      partnerEngines: ['booking', 'service'],
    });
    expect(r.reason).toBe('sticky');
    expect(r.engine).toBe('booking');
  });

  it('current engine removed from partner → fallback-first', () => {
    const r = selectActiveEngine({
      currentActive: 'booking',
      engineConfidence: null,
      partnerEngines: ['service'],
    });
    expect(r).toEqual({ engine: 'service', reason: 'fallback-first' });
  });

  it('undefined current → treated as null', () => {
    const r = selectActiveEngine({
      currentActive: undefined,
      engineConfidence: null,
      partnerEngines: ['booking'],
    });
    expect(r.engine).toBe('booking');
    expect(r.reason).toBe('fallback-first');
  });

  it('service overlay is a normal switch target (no special case)', () => {
    // Customer starts in booking, asks "where is my reservation" (service strong)
    const r = selectActiveEngine({
      currentActive: 'booking',
      engineHint: 'service',
      engineConfidence: 'strong',
      partnerEngines: ['booking', 'service'],
    });
    expect(r.reason).toBe('switch-strong-hint');
    expect(r.engine).toBe('service');
  });
});

describe('selectActiveEngine — purity', () => {
  it('same input → same output', () => {
    const input = {
      currentActive: 'booking' as const,
      engineHint: 'service' as const,
      engineConfidence: 'strong' as const,
      partnerEngines: ['booking', 'service'] as const,
    };
    const a = selectActiveEngine(input);
    const b = selectActiveEngine(input);
    expect(a).toEqual(b);
  });

  it('does not mutate the input partnerEngines', () => {
    const partnerEngines = ['booking', 'service'] as const;
    const copy = [...partnerEngines];
    selectActiveEngine({
      currentActive: 'booking',
      engineHint: 'service',
      engineConfidence: 'strong',
      partnerEngines,
    });
    expect(partnerEngines).toEqual(copy);
  });
});

describe('multi-turn integration — a 5-message conversation', () => {
  // Scenario: hotel+restaurant partner. Customer browses rooms, books,
  // asks about restaurant table, tracks a reservation.
  const partnerEngines = ['booking', 'service'] as const;

  it('produces the expected engine sequence', () => {
    let active: 'booking' | 'service' | null = null;
    type ActiveType = 'booking' | 'service' | null;
    const history: Array<{ msg: string; engine: ActiveType; reason: string }> = [];

    function step(msg: string, hint?: 'booking' | 'service', conf?: 'strong' | 'weak' | null) {
      const r = selectActiveEngine({
        currentActive: active,
        engineHint: hint,
        engineConfidence: conf ?? null,
        partnerEngines,
      });
      active = r.engine as typeof active;
      history.push({ msg, engine: active, reason: r.reason });
    }

    // Turn 1: greeting, no hint → fallback-first (booking).
    step('hi there', undefined, null);
    // Turn 2: "book a room" — strong booking hint. Same as current; sticky.
    step('book a room', 'booking', 'strong');
    // Turn 3: "are you open on saturday" — weak booking. Never switches. Sticky.
    step('open saturday', 'booking', 'weak');
    // Turn 4: "cancel my reservation" — strong service. Different engine. Switch.
    step('cancel my reservation', 'service', 'strong');
    // Turn 5: no hint. Sticky on service.
    step('thanks', undefined, null);

    expect(history.map((h) => h.engine)).toEqual([
      'booking', 'booking', 'booking', 'service', 'service',
    ]);
    expect(history.map((h) => h.reason)).toEqual([
      'fallback-first',
      'sticky',
      'sticky',
      'switch-strong-hint',
      'sticky',
    ]);
  });
});
