// Three-tier flow resolution — closes the server-side gap for
// functionIds without a hardcoded lib/flow-templates entry.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  firestoreStore,
  makeFirestoreAdminMock,
  resetFirestoreMock,
  seedMockDoc,
} from '@/__tests__/helpers/firestore-admin-mock';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/firebase-admin', () => makeFirestoreAdminMock());

import { resolveFlowDefinition } from '../flow-loader';

beforeEach(() => {
  resetFirestoreMock();
});

describe('resolveFlowDefinition — three-tier resolution', () => {
  it('tier 1: returns partner override when present', async () => {
    seedMockDoc('partners/p1/relayConfig/flowDefinition', {
      id: 'partner_custom',
      name: 'Partner Custom Flow',
      industryId: 'retail_commerce',
      functionId: 'beverage_cafe',
      stages: [
        {
          id: 'custom_greeting',
          type: 'greeting',
          label: 'Hello',
          blockTypes: ['greeting'],
          intentTriggers: ['hello'],
          leadScoreImpact: 1,
          isEntry: true,
        },
      ],
      transitions: [],
      settings: {},
      status: 'active',
    });

    const result = await resolveFlowDefinition('p1', 'beverage_cafe');

    expect(result.source).toBe('partner-override');
    expect(result.flow?.id).toBe('partner_custom');
  });

  it('tier 2: returns systemFlowTemplates doc when no override and functionId matches', async () => {
    // No partner override. Seed an active system template that matches
    // functionId. resolveFlowDefinition should find it at tier 2 without
    // falling through to the auto-generator.
    seedMockDoc('systemFlowTemplates/tpl_abc', {
      id: 'tpl_abc',
      name: 'Curated Cafe Flow',
      industryId: 'food_beverage',
      functionId: 'beverage_cafe',
      status: 'active',
      stages: [
        {
          id: 'tpl_greeting',
          type: 'greeting',
          label: 'Welcome',
          blockTypes: ['greeting'],
          intentTriggers: ['hello'],
          leadScoreImpact: 1,
          isEntry: true,
        },
      ],
      transitions: [],
      settings: {},
    });

    const result = await resolveFlowDefinition('p_no_override', 'beverage_cafe');

    expect(result.source).toBe('firestore-template');
    expect(result.flow?.id).toBe('tpl_abc');
    expect(result.flow?.name).toBe('Curated Cafe Flow');
  });

  it('tier 3: auto-generates from block registry for beverage_cafe', async () => {
    // No override, no firestore template. beverage_cafe has no
    // hardcoded flow-templates entry either, but it IS in the server-safe
    // block registry (_registry-data.ts). Tier 3 auto-generates a flow
    // from its declared block ids.
    const result = await resolveFlowDefinition('p_fresh', 'beverage_cafe');

    expect(result.source).toBe('generated');
    expect(result.flow).not.toBeNull();
    expect(result.flow?.functionId).toBe('beverage_cafe');
    // Auto-generated stages must cover at least greeting (from shared
    // blocks) plus a discovery stage from one of beverage_cafe's
    // declared blocks (menu_item, drink_menu, etc.).
    const stageTypes = result.flow?.stages.map((s) => s.type) ?? [];
    expect(stageTypes).toContain('greeting');
    expect(stageTypes.length).toBeGreaterThan(1);
    // Entry stage must carry the isEntry flag so downstream consumers
    // (getEntryStage) can locate it.
    const entry = result.flow?.stages.find((s) => s.isEntry);
    expect(entry).toBeDefined();
  });

  it('all tiers miss: returns {flow: null, source: none} for unknown functionId', async () => {
    // No override, no firestore template, no block-registry entry.
    // Resolver should fail closed without throwing.
    // Guard the environment in case some prior test left state around.
    firestoreStore.clear();

    const result = await resolveFlowDefinition('p_void', 'totally_unknown_fn');

    expect(result.source).toBe('none');
    expect(result.flow).toBeNull();
  });
});
