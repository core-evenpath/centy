import { describe, expect, it } from 'vitest';
import { ALL_BLOCKS_DATA } from '@/app/admin/relay/blocks/previews/_registry-data';

// P2.engagement.M02 — verify Engagement block tagging.
//
// Adjustment 4 (per-block dual-tag justification):
// - Every dual-tag has a single-line comment in source explaining the
//   genuine dual-engine use
// - No triple-tags (asserted; triple-tag growth triggers Q17 escalation)
//
// Mini-inventory (~11 blocks across 3 verticals):
// - public_nonprofit (14 blocks; 8 engagement-tagged):
//   * 6 single ['engagement']: pu_donation, pu_volunteer, pu_impact_report,
//     pu_complaint, pu_feedback, pu_program_card
//   * 2 dual: pu_event_calendar ['engagement', 'booking'],
//     pu_document_portal ['info', 'engagement']
//   * 3 single ['info']: pu_service_directory, pu_office_locator,
//     pu_outage_status
//   * 1 single ['service']: pu_application_tracker
//   * 1 single ['commerce']: pu_bill_pay
//   * 1 single ['booking']: pu_appointment
// - personal_wellness (2 engagement tags added):
//   * membership_tier ['engagement', 'commerce']
//   * loyalty_progress ['engagement']
// - events_entertainment (1 engagement tag added):
//   * invite_rsvp previously ['booking'] → ['booking', 'engagement']

type WithEngines = { id: string; engines?: string[] };

describe('P2.engagement.M02 — Engagement block tagging', () => {
  it('≥ 10 blocks tagged with engagement (single or dual)', () => {
    const tagged = (ALL_BLOCKS_DATA as WithEngines[]).filter(
      (b) => b.engines?.includes('engagement'),
    );
    expect(tagged.length).toBeGreaterThanOrEqual(10);
  });

  it('expected engagement-pure blocks are single-tagged ["engagement"]', () => {
    const pureEngagement = [
      'pu_donation', 'pu_volunteer', 'pu_impact_report',
      'pu_complaint', 'pu_feedback', 'pu_program_card',
      'loyalty_progress',
    ];
    for (const id of pureEngagement) {
      const block = (ALL_BLOCKS_DATA as WithEngines[]).find((b) => b.id === id);
      expect(block, `missing: ${id}`).toBeDefined();
      expect(block?.engines, `${id}`).toEqual(['engagement']);
    }
  });

  it('expected dual-tag blocks (all justified per Adjustment 4)', () => {
    const duals: Array<[string, string[]]> = [
      ['pu_document_portal', ['info', 'engagement']],
      ['pu_event_calendar', ['engagement', 'booking']],
      ['membership_tier', ['engagement', 'commerce']],
      ['invite_rsvp', ['booking', 'engagement']],
    ];
    for (const [id, tags] of duals) {
      const block = (ALL_BLOCKS_DATA as WithEngines[]).find((b) => b.id === id);
      expect(block?.engines, `${id}`).toEqual(tags);
    }
  });

  it('zero triple-tags on engagement-bearing blocks (Q17 guard)', () => {
    const tagged = (ALL_BLOCKS_DATA as WithEngines[]).filter(
      (b) => b.engines?.includes('engagement'),
    );
    const triples = tagged.filter((b) => (b.engines?.length ?? 0) >= 3);
    expect(triples.map((b) => b.id)).toEqual([]);
  });

  it('public_nonprofit info / service / commerce / booking blocks tagged correctly', () => {
    const checks: Array<[string, string[]]> = [
      ['pu_service_directory', ['info']],
      ['pu_office_locator', ['info']],
      ['pu_outage_status', ['info']],
      ['pu_application_tracker', ['service']],
      ['pu_bill_pay', ['commerce']],
      ['pu_appointment', ['booking']],
    ];
    for (const [id, tags] of checks) {
      const block = (ALL_BLOCKS_DATA as WithEngines[]).find((b) => b.id === id);
      expect(block?.engines, `${id}`).toEqual(tags);
    }
  });

  it('booking-primary blocks unchanged (Phase 1 contract)', () => {
    const bookingOnly = ['room_card', 'availability'];
    for (const id of bookingOnly) {
      const block = (ALL_BLOCKS_DATA as WithEngines[]).find((b) => b.id === id);
      if (block) {
        expect(block.engines?.includes('booking'), `${id}`).toBe(true);
      }
    }
  });

  it('commerce-primary blocks unchanged (Session 1 contract)', () => {
    const commerceBlocks = ['product_card', 'menu_item', 'fs_product_card'];
    for (const id of commerceBlocks) {
      const block = (ALL_BLOCKS_DATA as WithEngines[]).find((b) => b.id === id);
      if (block) {
        expect(block.engines?.includes('commerce'), `${id}`).toBe(true);
      }
    }
  });

  it('lead-primary blocks unchanged (Session 2 contract)', () => {
    const leadBlocks = ['service_package', 'fin_product_card', 'property_listing'];
    for (const id of leadBlocks) {
      const block = (ALL_BLOCKS_DATA as WithEngines[]).find((b) => b.id === id);
      if (block) {
        expect(block.engines?.includes('lead'), `${id}`).toBe(true);
      }
    }
  });
});
