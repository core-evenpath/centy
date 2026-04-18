import { describe, expect, it } from 'vitest';
import {
  ENGAGEMENT_FLOW_TEMPLATES,
  getEngagementFlowTemplate,
  ENGAGEMENT_NONPROFIT_FLOW_TEMPLATE,
  ENGAGEMENT_COMMUNITY_FLOW_TEMPLATE,
  ENGAGEMENT_SUBSCRIPTION_RSVP_FLOW_TEMPLATE,
} from '../index';
import { FUNCTION_TO_ENGINES } from '@/lib/relay/engine-recipes';
import { ALL_BLOCKS_DATA } from '@/app/admin/relay/blocks/previews/_registry-data';

const KNOWN_BLOCK_IDS = new Set(ALL_BLOCKS_DATA.map((b) => b.id));
const PHASE1_SHARED = new Set(['greeting', 'suggestions', 'cart', 'contact', 'compare']);

describe('P2.engagement.M03 — Engagement flow templates', () => {
  const ALL_TEMPLATES = [
    ENGAGEMENT_NONPROFIT_FLOW_TEMPLATE,
    ENGAGEMENT_COMMUNITY_FLOW_TEMPLATE,
    ENGAGEMENT_SUBSCRIPTION_RSVP_FLOW_TEMPLATE,
  ];

  it('exports 3 distinct templates', () => {
    expect(ENGAGEMENT_NONPROFIT_FLOW_TEMPLATE.id).toBe('engagement_tpl_nonprofit');
    expect(ENGAGEMENT_COMMUNITY_FLOW_TEMPLATE.id).toBe('engagement_tpl_community');
    expect(ENGAGEMENT_SUBSCRIPTION_RSVP_FLOW_TEMPLATE.id).toBe('engagement_tpl_subscription_rsvp');
  });

  it('every template declares engine: engagement', () => {
    for (const tpl of ALL_TEMPLATES) {
      expect(tpl.engine).toBe('engagement');
    }
  });

  it('every template has canonical engagement serviceIntentBreaks', () => {
    for (const tpl of ALL_TEMPLATES) {
      expect(tpl.serviceIntentBreaks).toContain('track-donation');
      expect(tpl.serviceIntentBreaks).toContain('cancel-recurring');
      expect(tpl.serviceIntentBreaks).toContain('update-rsvp');
    }
  });

  it('every stage block reference is valid (registry or Phase 1 shared)', () => {
    for (const tpl of ALL_TEMPLATES) {
      for (const stage of tpl.stages) {
        for (const blockId of stage.blockTypes) {
          const valid = KNOWN_BLOCK_IDS.has(blockId) || PHASE1_SHARED.has(blockId);
          expect(valid, `${tpl.id}.${stage.id} references unknown block: ${blockId}`).toBe(true);
        }
      }
    }
  });

  it('every engagement-primary functionId from recipe has a template mapping', () => {
    const engagementPrimary = Object.entries(FUNCTION_TO_ENGINES)
      .filter(([, engs]) => engs[0] === 'engagement')
      .map(([fn]) => fn);
    const uncovered = engagementPrimary.filter((fn) => !ENGAGEMENT_FLOW_TEMPLATES[fn]);
    expect(uncovered, `uncovered: ${uncovered.join(',')}`).toEqual([]);
  });

  it('getEngagementFlowTemplate returns null for unknown functionId', () => {
    expect(getEngagementFlowTemplate('not-a-fn')).toBeNull();
    expect(getEngagementFlowTemplate(null)).toBeNull();
    expect(getEngagementFlowTemplate(undefined)).toBeNull();
  });

  it('nonprofit template routes ngo_nonprofit', () => {
    expect(getEngagementFlowTemplate('ngo_nonprofit')?.id).toBe('engagement_tpl_nonprofit');
  });

  it('community template routes religious + community_association + cultural_institutions', () => {
    for (const fn of ['religious', 'community_association', 'cultural_institutions']) {
      expect(getEngagementFlowTemplate(fn)?.id).toBe('engagement_tpl_community');
    }
  });

  it('stages preserve canonical order with followup before handoff', () => {
    for (const tpl of ALL_TEMPLATES) {
      const types = tpl.stages.map((s) => s.type);
      const handoffIdx = types.indexOf('handoff');
      const followupIdx = types.indexOf('followup');
      expect(handoffIdx, `${tpl.id} must have handoff`).toBeGreaterThanOrEqual(0);
      expect(followupIdx, `${tpl.id} must have followup`).toBeGreaterThanOrEqual(0);
      expect(followupIdx, `${tpl.id} followup before handoff`).toBeLessThan(handoffIdx);
    }
  });

  it('nonprofit template optionally skips comparison stage (offline-closed engagement shape)', () => {
    // Adjustment for engagement: many engagement flows have nothing to
    // compare. Nonprofit template deliberately omits `comparison`.
    const types = ENGAGEMENT_NONPROFIT_FLOW_TEMPLATE.stages.map((s) => s.type);
    expect(types).not.toContain('comparison');
  });
});
