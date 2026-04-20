// P3.M05.2: service-break contact-fallback rule tests.

import { describe, it, expect } from 'vitest';
import {
  isServiceBreakFallback,
  SERVICE_BREAK_INTENTS,
  CONTACT_BLOCK_ID,
} from '../service-break';

describe('isServiceBreakFallback — Q10 contact-fallback rule', () => {
  it('returns true when service + empty catalog + returning intent', () => {
    expect(
      isServiceBreakFallback({
        activeEngine: 'service',
        allowedCount: 0,
        intent: 'returning',
      }),
    ).toBe(true);
  });

  it.each(['returning', 'complaint', 'contact', 'urgent'] as const)(
    'returns true for service-break intent "%s"',
    (intent) => {
      expect(
        isServiceBreakFallback({
          activeEngine: 'service',
          allowedCount: 0,
          intent,
        }),
      ).toBe(true);
    },
  );

  it.each(['browsing', 'pricing', 'booking', 'promo', 'schedule', 'inquiry'] as const)(
    'returns false for non-service-break intent "%s"',
    (intent) => {
      expect(
        isServiceBreakFallback({
          activeEngine: 'service',
          allowedCount: 0,
          intent,
        }),
      ).toBe(false);
    },
  );

  it('returns false when activeEngine is not service', () => {
    expect(
      isServiceBreakFallback({
        activeEngine: 'booking',
        allowedCount: 0,
        intent: 'returning',
      }),
    ).toBe(false);
  });

  it('returns false when activeEngine is null', () => {
    expect(
      isServiceBreakFallback({
        activeEngine: null,
        allowedCount: 0,
        intent: 'returning',
      }),
    ).toBe(false);
  });

  it('returns false when catalog has entries', () => {
    expect(
      isServiceBreakFallback({
        activeEngine: 'service',
        allowedCount: 3,
        intent: 'returning',
      }),
    ).toBe(false);
  });

  it('returns false when intent is null', () => {
    expect(
      isServiceBreakFallback({
        activeEngine: 'service',
        allowedCount: 0,
        intent: null,
      }),
    ).toBe(false);
  });

  it('exports the contact block id used by the orchestrator', () => {
    expect(CONTACT_BLOCK_ID).toBe('contact');
  });

  it('service-break intent set has 4 entries (returning, complaint, contact, urgent)', () => {
    expect(SERVICE_BREAK_INTENTS.size).toBe(4);
    expect(SERVICE_BREAK_INTENTS.has('returning')).toBe(true);
    expect(SERVICE_BREAK_INTENTS.has('complaint')).toBe(true);
    expect(SERVICE_BREAK_INTENTS.has('contact')).toBe(true);
    expect(SERVICE_BREAK_INTENTS.has('urgent')).toBe(true);
  });
});
