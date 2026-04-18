import { describe, expect, it } from 'vitest';
import { classifyEngineHint, ENGINE_KEYWORDS } from '../engine-keywords';
import { ENGINES } from '../engine-types';

describe('ENGINE_KEYWORDS lexicon', () => {
  it('has strong + weak lists for every engine', () => {
    for (const engine of ENGINES) {
      expect(ENGINE_KEYWORDS[engine]).toBeDefined();
      expect(Array.isArray(ENGINE_KEYWORDS[engine].strong)).toBe(true);
      expect(Array.isArray(ENGINE_KEYWORDS[engine].weak)).toBe(true);
    }
  });
});

describe('classifyEngineHint: per-engine strong matches', () => {
  it('booking: "book a room"', () => {
    const r = classifyEngineHint('i want to book a room');
    expect(r.engineHint).toBe('booking');
    expect(r.engineConfidence).toBe('strong');
  });

  it('booking: "reservation"', () => {
    const r = classifyEngineHint('need to make a reservation');
    expect(r.engineHint).toBe('booking');
    expect(r.engineConfidence).toBe('strong');
  });

  it('service: "track my order"', () => {
    const r = classifyEngineHint('track my order please');
    expect(r.engineHint).toBe('service');
    expect(r.engineConfidence).toBe('strong');
  });

  it('service: "cancel"', () => {
    const r = classifyEngineHint('i want to cancel my booking');
    // Multi-engine: "cancel" is service-strong, "booking" is booking-weak
    // (no, booking has 'my booking' in service). So service wins strongly.
    expect(r.engineHint).toBe('service');
    expect(r.engineConfidence).toBe('strong');
  });

  it('commerce: "add to cart"', () => {
    const r = classifyEngineHint('please add to cart');
    expect(r.engineHint).toBe('commerce');
    expect(r.engineConfidence).toBe('strong');
  });

  it('commerce: "checkout"', () => {
    const r = classifyEngineHint('proceed to checkout');
    expect(r.engineHint).toBe('commerce');
    expect(r.engineConfidence).toBe('strong');
  });

  it('lead: "consultation"', () => {
    const r = classifyEngineHint('schedule a consultation');
    // Both 'consultation' (lead-strong) and 'schedule' (booking-weak) hit;
    // strong beats weak, and lead vs any strong: tie-breaker by ENGINES order.
    expect(r.engineHint).toBe('lead');
    expect(r.engineConfidence).toBe('strong');
  });

  it('engagement: "donate"', () => {
    const r = classifyEngineHint('I want to donate');
    expect(r.engineHint).toBe('engagement');
    expect(r.engineConfidence).toBe('strong');
  });

  it('info: "opening hours"', () => {
    const r = classifyEngineHint('what are your opening hours');
    expect(r.engineHint).toBe('info');
    expect(r.engineConfidence).toBe('strong');
  });
});

describe('classifyEngineHint: weak matches', () => {
  it('booking weak: "schedule"', () => {
    const r = classifyEngineHint('can we schedule this');
    expect(r.engineHint).toBe('booking');
    expect(r.engineConfidence).toBe('weak');
  });

  it('commerce weak: "how much"', () => {
    const r = classifyEngineHint('how much for two');
    expect(r.engineHint).toBe('commerce');
    expect(r.engineConfidence).toBe('weak');
  });
});

describe('classifyEngineHint: word-boundary discipline', () => {
  it('"facebook" does NOT match booking (not at word boundary)', () => {
    const r = classifyEngineHint('visit us on facebook');
    expect(r.engineHint).not.toBe('booking');
  });

  it('"abooking" does NOT match booking (substring inside word)', () => {
    const r = classifyEngineHint('look at this abooking example');
    expect(r.engineConfidence).toBe(null);
  });

  it('"booker" does NOT match booking-strong "book"', () => {
    const r = classifyEngineHint('introduce the booker');
    // 'booker' contains 'book' but not as whole word. No strong hit.
    // (Would still potentially hit other things depending on content.)
    // Assert that 'book' strong-match didn't fire.
    if (r.engineHint === 'booking') {
      expect(r.engineConfidence).not.toBe('strong');
    }
  });

  it('"book a table" matches booking-strong', () => {
    const r = classifyEngineHint('book a table tonight');
    expect(r.engineHint).toBe('booking');
    expect(r.engineConfidence).toBe('strong');
  });

  it('matches case-insensitively: "BOOK"', () => {
    const r = classifyEngineHint('BOOK a room');
    expect(r.engineHint).toBe('booking');
    expect(r.engineConfidence).toBe('strong');
  });
});

describe('classifyEngineHint: ambiguity + tie-breaking', () => {
  it('strong-beats-weak: "i want to buy a book" → commerce strong', () => {
    // 'buy' → commerce strong; 'book' → booking strong
    // Both strong. Tie-break: commerce < booking in ENGINES, so commerce wins.
    const r = classifyEngineHint('i want to buy a book');
    expect(r.engineHint).toBe('commerce');
    expect(r.engineConfidence).toBe('strong');
  });

  it('multi-engine strong: commerce beats booking (ENGINES tuple order)', () => {
    // ENGINES = ['commerce', 'booking', ...]
    const r = classifyEngineHint('i want to buy and book');
    expect(r.engineHint).toBe('commerce');
  });

  it('strong beats weak regardless of order', () => {
    // 'reservation' is booking-strong; 'about' is info-weak
    const r = classifyEngineHint('about our reservation');
    expect(r.engineHint).toBe('booking');
    expect(r.engineConfidence).toBe('strong');
  });
});

describe('classifyEngineHint: service-overlay tiebreaker (Phase C C2.2 fix)', () => {
  it('"cancel my reservation" → service (beats concurrent booking hit on "reservation")', () => {
    const r = classifyEngineHint('cancel my reservation');
    expect(r.engineHint).toBe('service');
    expect(r.engineConfidence).toBe('strong');
  });

  it('"actually can you cancel my reservation" → service', () => {
    const r = classifyEngineHint('actually can you cancel my reservation');
    expect(r.engineHint).toBe('service');
    expect(r.engineConfidence).toBe('strong');
  });

  it('"modify my reservation" → service', () => {
    const r = classifyEngineHint('modify my reservation');
    expect(r.engineHint).toBe('service');
    expect(r.engineConfidence).toBe('strong');
  });

  it('"track my order" (no booking keyword) → service (unchanged)', () => {
    const r = classifyEngineHint('track my order please');
    expect(r.engineHint).toBe('service');
  });

  it('"i want to book a room" (service NOT present) → booking (unchanged)', () => {
    const r = classifyEngineHint('i want to book a room');
    expect(r.engineHint).toBe('booking');
  });

  it('"i want to make a reservation" → booking (no service verb present)', () => {
    const r = classifyEngineHint('i want to make a reservation');
    expect(r.engineHint).toBe('booking');
  });
});

describe('classifyEngineHint: no-keyword / edge cases', () => {
  it('empty message → null confidence', () => {
    const r = classifyEngineHint('');
    expect(r.engineConfidence).toBe(null);
    expect(r.engineHint).toBeUndefined();
  });

  it('whitespace-only → null confidence', () => {
    const r = classifyEngineHint('   \n\t   ');
    expect(r.engineConfidence).toBe(null);
  });

  it('non-keyword message → null confidence', () => {
    const r = classifyEngineHint('just a random chat');
    expect(r.engineConfidence).toBe(null);
    expect(r.engineHint).toBeUndefined();
  });

  it('determinism: same input → identical output', () => {
    const a = classifyEngineHint('book a room');
    const b = classifyEngineHint('book a room');
    expect(a).toEqual(b);
  });
});
