import { describe, expect, it } from 'vitest';
import { ALL_BLOCKS_DATA } from '@/app/admin/relay/blocks/previews/_registry-data';

// P2.lead.M02 — verify Lead block tagging.
//
// Mini-inventory (~45 blocks across 4 verticals):
// - business (14): all single-tag lead except engagement_timeline,
//   retainer_status, document_collector (dual-tag ['lead', 'service'])
// - financial_services (14): 13 lead or lead+service; fin_transfer is
//   commerce (remittance)
// - home_property (13): 9 lead (some dual with booking for sharing
//   partners), 2 service (hp_job_tracker, hp_history), 1 booking-only
//   (hp_emergency)
// - events_entertainment (14): 8 lead (with evt_timeline dual-tagged
//   ['lead', 'service']), 5 booking (venue, show, + 3 pre-tagged)
//
// Dual-tag rationale: a block is dual-tagged ONLY when it genuinely
// serves both engines on multi-engine partners:
// - ['lead', 'service'] — in-progress lead engagement status (document
//   collection, retainer burn-down, application-tracker equivalents)
// - ['lead', 'booking'] — home-services partners blend consult-visit
//   scheduling (lead) with job-visit scheduling (booking); same UI
//   serves both.

type WithEngines = { id: string; engines?: string[] };

function getTaggedBlocks(pred: (tags: string[]) => boolean): string[] {
  return (ALL_BLOCKS_DATA as WithEngines[])
    .filter((b) => b.engines && pred(b.engines))
    .map((b) => b.id);
}

describe('P2.lead.M02 — Lead block tagging', () => {
  it('≥ 30 blocks tagged with lead (single or dual)', () => {
    const tagged = getTaggedBlocks((t) => t.includes('lead'));
    expect(tagged.length).toBeGreaterThanOrEqual(30);
  });

  it('expected Lead-pure blocks are tagged lead (single)', () => {
    const leadPureIds = [
      'service_package', 'expert_profile', 'consultation_booking',
      'project_scope', 'case_study', 'proposal',
      'fee_calculator', 'property_listing', 'compliance_checklist',
      'credential_badge', 'client_review',
      'fin_product_card', 'fin_loan_calc', 'fin_application',
      'fin_rate_compare', 'fin_insurance', 'fin_advisor',
      'fin_review', 'fin_eligibility',
      'hp_estimate', 'hp_before_after', 'hp_service_request',
      'hp_maintenance_plan', 'hp_warranty', 'hp_review',
      'evt_service_card', 'evt_portfolio', 'vendor_profile',
      'event_package', 'evt_quote_builder', 'mood_board',
      'evt_equipment', 'evt_client_review',
    ];
    for (const id of leadPureIds) {
      const block = (ALL_BLOCKS_DATA as WithEngines[]).find((b) => b.id === id);
      expect(block, `missing block: ${id}`).toBeDefined();
      expect(block?.engines, `${id} engines`).toEqual(['lead']);
    }
  });

  it('expected dual-tagged ["lead","service"] blocks', () => {
    const dual = [
      'engagement_timeline', 'retainer_status', 'document_collector',
      'fin_account_snapshot', 'fin_portfolio', 'fin_credit_score',
      'fin_doc_upload', 'fin_app_tracker',
      'evt_timeline',
    ];
    for (const id of dual) {
      const block = (ALL_BLOCKS_DATA as WithEngines[]).find((b) => b.id === id);
      expect(block?.engines, `${id} engines`).toEqual(['lead', 'service']);
    }
  });

  it('expected dual-tagged ["lead","booking"] blocks (home-services genuine overlap)', () => {
    const dual = [
      'hp_service_card', 'hp_category_browser', 'hp_technician',
      'hp_scheduler',
    ];
    for (const id of dual) {
      const block = (ALL_BLOCKS_DATA as WithEngines[]).find((b) => b.id === id);
      expect(block?.engines, `${id} engines`).toEqual(['lead', 'booking']);
    }
  });

  it('financial fin_transfer remains commerce (remittance flow)', () => {
    const block = (ALL_BLOCKS_DATA as WithEngines[]).find((b) => b.id === 'fin_transfer');
    expect(block?.engines).toEqual(['commerce']);
  });

  it('hp_emergency is booking-only, hp_job_tracker and hp_history are service', () => {
    const hp = (ALL_BLOCKS_DATA as WithEngines[]);
    expect(hp.find((b) => b.id === 'hp_emergency')?.engines).toEqual(['booking']);
    expect(hp.find((b) => b.id === 'hp_job_tracker')?.engines).toEqual(['service']);
    expect(hp.find((b) => b.id === 'hp_history')?.engines).toEqual(['service']);
  });

  it('booking-primary blocks unchanged (Phase 1 contract)', () => {
    const bookingOnly = ['room_card', 'availability'];
    for (const id of bookingOnly) {
      const block = (ALL_BLOCKS_DATA as WithEngines[]).find((b) => b.id === id);
      if (block) {
        expect(block.engines?.includes('booking'), `${id} should still be booking`).toBe(true);
      }
    }
  });

  it('commerce-primary blocks unchanged (Session 1 contract)', () => {
    const commerceBlocks = ['product_card', 'menu_item', 'fs_product_card'];
    for (const id of commerceBlocks) {
      const block = (ALL_BLOCKS_DATA as WithEngines[]).find((b) => b.id === id);
      if (block) {
        expect(block.engines?.includes('commerce'), `${id} should still be commerce`).toBe(true);
      }
    }
  });
});
