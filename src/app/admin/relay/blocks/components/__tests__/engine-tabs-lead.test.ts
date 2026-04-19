import { describe, expect, it } from 'vitest';
import { ACTIVATED_ENGINES } from '../EngineTabs';

describe('P2.lead.M04 — Lead tab activation', () => {
  it('ACTIVATED_ENGINES now includes booking, commerce, lead', () => {
    expect(ACTIVATED_ENGINES.has('booking')).toBe(true);
    expect(ACTIVATED_ENGINES.has('commerce')).toBe(true);
    expect(ACTIVATED_ENGINES.has('lead')).toBe(true);
  });

  it('info activated in info.M04 (Session 4)', () => {
    // Engagement + Info both shipped since lead.M04; all 5 primaries
    // now activated. Service still overlay-only.
    expect(ACTIVATED_ENGINES.has('info')).toBe(true);
  });

  it('service is not exposed as a top-level tab (overlay-only)', () => {
    // Service is an overlay; it's filtered out of the onboarding form
    // and the admin doesn't present it as a standalone catalog.
    expect(ACTIVATED_ENGINES.has('service')).toBe(false);
  });
});
