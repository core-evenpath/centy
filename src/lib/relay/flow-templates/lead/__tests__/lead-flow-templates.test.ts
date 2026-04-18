import { describe, expect, it } from 'vitest';
import {
  LEAD_FLOW_TEMPLATES,
  getLeadFlowTemplate,
  LEAD_FINANCIAL_FLOW_TEMPLATE,
  LEAD_PROFESSIONAL_FLOW_TEMPLATE,
  LEAD_REAL_ESTATE_B2B_FLOW_TEMPLATE,
} from '../index';
import { FUNCTION_TO_ENGINES } from '@/lib/relay/engine-recipes';
import { ALL_BLOCKS_DATA } from '@/app/admin/relay/blocks/previews/_registry-data';

const KNOWN_BLOCK_IDS = new Set(ALL_BLOCKS_DATA.map((b) => b.id));
// shared blocks tagged in Phase 1 (greeting, suggestions, cart, contact,
// compare, etc.) may not live in ALL_BLOCKS_DATA with matching ids; also
// accept these as valid since they're Phase 1 core registry entries.
const PHASE1_SHARED = new Set(['greeting', 'suggestions', 'cart', 'contact', 'compare']);

describe('P2.lead.M03 — Lead flow templates', () => {
  it('exports 3 distinct templates', () => {
    expect(LEAD_FINANCIAL_FLOW_TEMPLATE.id).toBe('lead_tpl_financial');
    expect(LEAD_PROFESSIONAL_FLOW_TEMPLATE.id).toBe('lead_tpl_professional');
    expect(LEAD_REAL_ESTATE_B2B_FLOW_TEMPLATE.id).toBe('lead_tpl_real_estate_b2b');
  });

  it('every template declares engine: lead', () => {
    for (const tpl of [LEAD_FINANCIAL_FLOW_TEMPLATE, LEAD_PROFESSIONAL_FLOW_TEMPLATE, LEAD_REAL_ESTATE_B2B_FLOW_TEMPLATE]) {
      expect(tpl.engine).toBe('lead');
    }
  });

  it('every template has the canonical serviceIntentBreaks', () => {
    for (const tpl of [LEAD_FINANCIAL_FLOW_TEMPLATE, LEAD_PROFESSIONAL_FLOW_TEMPLATE, LEAD_REAL_ESTATE_B2B_FLOW_TEMPLATE]) {
      expect(tpl.serviceIntentBreaks).toContain('track-application');
      expect(tpl.serviceIntentBreaks).toContain('status-check');
      expect(tpl.serviceIntentBreaks).toContain('amend-application');
      expect(tpl.serviceIntentBreaks).toContain('withdraw-application');
    }
  });

  it('every stage block reference is valid (registry or shared)', () => {
    for (const tpl of [LEAD_FINANCIAL_FLOW_TEMPLATE, LEAD_PROFESSIONAL_FLOW_TEMPLATE, LEAD_REAL_ESTATE_B2B_FLOW_TEMPLATE]) {
      for (const stage of tpl.stages) {
        for (const blockId of stage.blockTypes) {
          const valid = KNOWN_BLOCK_IDS.has(blockId) || PHASE1_SHARED.has(blockId);
          expect(valid, `${tpl.id}.${stage.id} references unknown block: ${blockId}`).toBe(true);
        }
      }
    }
  });

  it('every lead-primary functionId from recipe has a template mapping', () => {
    const leadPrimary = Object.entries(FUNCTION_TO_ENGINES)
      .filter(([, engs]) => engs[0] === 'lead')
      .map(([fn]) => fn);
    const uncovered = leadPrimary.filter((fn) => !LEAD_FLOW_TEMPLATES[fn]);
    expect(uncovered, `uncovered lead-primary fns: ${uncovered.join(',')}`).toEqual([]);
  });

  it('getLeadFlowTemplate returns null for unknown functionId', () => {
    expect(getLeadFlowTemplate('not-a-fn')).toBeNull();
    expect(getLeadFlowTemplate(null)).toBeNull();
    expect(getLeadFlowTemplate(undefined)).toBeNull();
  });

  it('financial template routes wealth_management correctly', () => {
    expect(getLeadFlowTemplate('wealth_management')?.id).toBe('lead_tpl_financial');
  });

  it('professional template routes legal_services correctly', () => {
    expect(getLeadFlowTemplate('legal_services')?.id).toBe('lead_tpl_professional');
  });

  it('real-estate-b2b template routes real_estate correctly', () => {
    expect(getLeadFlowTemplate('real_estate')?.id).toBe('lead_tpl_real_estate_b2b');
  });

  it('stages follow canonical order with followup before handoff', () => {
    for (const tpl of [LEAD_FINANCIAL_FLOW_TEMPLATE, LEAD_PROFESSIONAL_FLOW_TEMPLATE, LEAD_REAL_ESTATE_B2B_FLOW_TEMPLATE]) {
      const stageTypes = tpl.stages.map((s) => s.type);
      const handoffIdx = stageTypes.indexOf('handoff');
      const followupIdx = stageTypes.indexOf('followup');
      expect(handoffIdx, `${tpl.id} must have handoff`).toBeGreaterThanOrEqual(0);
      expect(followupIdx, `${tpl.id} must have followup`).toBeGreaterThanOrEqual(0);
      expect(followupIdx, `${tpl.id} followup before handoff`).toBeLessThan(handoffIdx);
    }
  });
});
