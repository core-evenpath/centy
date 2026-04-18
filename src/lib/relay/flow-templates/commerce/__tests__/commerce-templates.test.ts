import { describe, expect, it } from 'vitest';
import {
  COMMERCE_FLOW_TEMPLATES,
  getCommerceFlowTemplate,
  GENERAL_RETAIL_FLOW_TEMPLATE,
  FOOD_DELIVERY_FLOW_TEMPLATE,
  FOOD_SUPPLY_FLOW_TEMPLATE,
  SUBSCRIPTION_FLOW_TEMPLATE,
} from '../index';
import { ALL_BLOCKS_DATA } from '@/app/admin/relay/blocks/previews/_registry-data';
import { FUNCTION_TO_ENGINES } from '@/lib/relay/engine-recipes';

const BLOCKS_BY_ID = new Map(ALL_BLOCKS_DATA.map((b) => [b.id, b]));

describe('P2.commerce.M03 — Commerce flow templates', () => {
  it('ships exactly 4 distinct templates', () => {
    const unique = new Set(Object.values(COMMERCE_FLOW_TEMPLATES));
    expect(unique.size).toBe(4);
    expect(unique.has(GENERAL_RETAIL_FLOW_TEMPLATE)).toBe(true);
    expect(unique.has(FOOD_DELIVERY_FLOW_TEMPLATE)).toBe(true);
    expect(unique.has(FOOD_SUPPLY_FLOW_TEMPLATE)).toBe(true);
    expect(unique.has(SUBSCRIPTION_FLOW_TEMPLATE)).toBe(true);
  });

  it('every template declares engine: commerce', () => {
    for (const tpl of new Set(Object.values(COMMERCE_FLOW_TEMPLATES))) {
      expect(tpl.engine).toBe('commerce');
    }
  });

  it('every template declares serviceIntentBreaks', () => {
    for (const tpl of new Set(Object.values(COMMERCE_FLOW_TEMPLATES))) {
      expect(tpl.serviceIntentBreaks).toEqual(['track-order', 'cancel-order', 'modify-order']);
    }
  });

  it('every suggestedBlockId exists in the registry AND is tagged commerce or shared', () => {
    for (const [tplId, tpl] of Object.entries({
      GENERAL_RETAIL_FLOW_TEMPLATE,
      FOOD_DELIVERY_FLOW_TEMPLATE,
      FOOD_SUPPLY_FLOW_TEMPLATE,
      SUBSCRIPTION_FLOW_TEMPLATE,
    })) {
      for (const stage of tpl.stages) {
        for (const blockId of stage.blockTypes) {
          const block = BLOCKS_BY_ID.get(blockId);
          expect(block, `${tplId} stage ${stage.id} references missing block ${blockId}`).toBeDefined();
          const engines = (block as unknown as { engines?: string[] }).engines ?? [];
          const ok = engines.includes('commerce') || engines.includes('shared');
          expect(ok, `${tplId} stage ${stage.id} block ${blockId} engines=${JSON.stringify(engines)}`).toBe(true);
        }
      }
    }
  });

  it('every stage order is canonical', () => {
    const ORDER = ['greeting', 'discovery', 'showcase', 'comparison', 'conversion', 'followup', 'handoff'];
    for (const tpl of new Set(Object.values(COMMERCE_FLOW_TEMPLATES))) {
      const positions = tpl.stages.map((s) => ORDER.indexOf(s.type));
      const sorted = [...positions].sort((a, b) => a - b);
      expect(positions).toEqual(sorted);
    }
  });

  it('every commerce-primary functionId has a template', () => {
    const commercePrimary = Object.entries(FUNCTION_TO_ENGINES)
      .filter(([, engs]) => engs[0] === 'commerce')
      .map(([fn]) => fn);
    const uncovered = commercePrimary.filter((fn) => !getCommerceFlowTemplate(fn));
    expect(uncovered).toEqual([]);
  });

  it('getCommerceFlowTemplate returns null for unknown / nullish inputs', () => {
    expect(getCommerceFlowTemplate(null)).toBeNull();
    expect(getCommerceFlowTemplate(undefined)).toBeNull();
    expect(getCommerceFlowTemplate('not_a_real_function')).toBeNull();
  });

  it('getCommerceFlowTemplate returns right template by sub-vertical', () => {
    expect(getCommerceFlowTemplate('ecommerce_d2c')).toBe(GENERAL_RETAIL_FLOW_TEMPLATE);
    expect(getCommerceFlowTemplate('qsr')).toBe(FOOD_DELIVERY_FLOW_TEMPLATE);
    expect(getCommerceFlowTemplate('fresh_produce')).toBe(FOOD_SUPPLY_FLOW_TEMPLATE);
    expect(getCommerceFlowTemplate('online_learning')).toBe(SUBSCRIPTION_FLOW_TEMPLATE);
  });
});
