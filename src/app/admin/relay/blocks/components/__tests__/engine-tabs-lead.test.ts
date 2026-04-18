import { describe, expect, it } from 'vitest';
import { ACTIVATED_ENGINES } from '../EngineTabs';

describe('P2.lead.M04 — Lead tab activation', () => {
  it('ACTIVATED_ENGINES now includes booking, commerce, lead', () => {
    expect(ACTIVATED_ENGINES.has('booking')).toBe(true);
    expect(ACTIVATED_ENGINES.has('commerce')).toBe(true);
    expect(ACTIVATED_ENGINES.has('lead')).toBe(true);
  });

  it('info remains not-yet-activated', () => {
    // engagement became activated in engagement.M04 — see the
    // engagement-specific test file. Lead assertion limited to info
    // which remains the only non-activated primary engine.
    expect(ACTIVATED_ENGINES.has('info')).toBe(false);
  });

  it('service is not exposed as a top-level tab (overlay-only)', () => {
    // Service is an overlay; it's filtered out of the onboarding form
    // and the admin doesn't present it as a standalone catalog.
    expect(ACTIVATED_ENGINES.has('service')).toBe(false);
  });
});
