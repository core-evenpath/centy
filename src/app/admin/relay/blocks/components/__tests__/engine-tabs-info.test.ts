import { describe, expect, it } from 'vitest';
import { ACTIVATED_ENGINES } from '../EngineTabs';

describe('P2.info.M04 — Info tab activation', () => {
  it('ACTIVATED_ENGINES now includes all 5 primary engines', () => {
    expect(ACTIVATED_ENGINES.has('booking')).toBe(true);
    expect(ACTIVATED_ENGINES.has('commerce')).toBe(true);
    expect(ACTIVATED_ENGINES.has('lead')).toBe(true);
    expect(ACTIVATED_ENGINES.has('engagement')).toBe(true);
    expect(ACTIVATED_ENGINES.has('info')).toBe(true);
  });

  it('service stays overlay-only (not a top-level tab)', () => {
    expect(ACTIVATED_ENGINES.has('service')).toBe(false);
  });

  it('exactly 5 activated engines (all primaries; service excluded)', () => {
    expect(ACTIVATED_ENGINES.size).toBe(5);
  });
});
