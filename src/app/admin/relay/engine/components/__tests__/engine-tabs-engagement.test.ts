import { describe, expect, it } from 'vitest';
import { ACTIVATED_ENGINES } from '../EngineTabs';

describe('P2.engagement.M04 — Engagement tab activation', () => {
  it('ACTIVATED_ENGINES now includes booking, commerce, lead, engagement', () => {
    expect(ACTIVATED_ENGINES.has('booking')).toBe(true);
    expect(ACTIVATED_ENGINES.has('commerce')).toBe(true);
    expect(ACTIVATED_ENGINES.has('lead')).toBe(true);
    expect(ACTIVATED_ENGINES.has('engagement')).toBe(true);
  });

  it('info activated in info.M04 (Session 4)', () => {
    // Engagement.M04 shipped before Info.M04; this assertion moved
    // in info.M04 to reflect the final activated-set.
    expect(ACTIVATED_ENGINES.has('info')).toBe(true);
  });

  it('service stays overlay-only (not a top-level tab)', () => {
    expect(ACTIVATED_ENGINES.has('service')).toBe(false);
  });
});
