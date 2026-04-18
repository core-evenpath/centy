import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  firestoreStore,
  makeFirestoreAdminMock,
  resetFirestoreMock,
  seedMockDoc,
} from '@/__tests__/helpers/firestore-admin-mock';

vi.mock('@/lib/firebase-admin', () => makeFirestoreAdminMock());

// Mock the block-config service so the loaders don't hit Firestore for
// global configs; we feed in fixtures directly.
vi.mock('@/lib/relay/block-config-service', () => ({
  getGlobalBlockConfigs: vi.fn(async () => [
    {
      id: 'room_card',
      verticalId: 'hospitality',
      family: 'rooms',
      label: 'Room Card',
      description: '',
      stage: 'discovery',
      status: 'active',
      intents: [],
      fields_req: ['title', 'price'],
      fields_opt: ['subtitle'],
      module: 'moduleItems',
      moduleBinding: null,
      sampleData: {},
      promptSchema: '',
      preloadable: false,
      streamable: false,
      cacheDuration: 0,
      variants: [],
      applicableCategories: [],
      createdAt: '',
      updatedAt: '',
    },
  ]),
}));

// SUT import must come after mocks.
import { recomputeEngineHealth } from '../relay-health-actions';
import { invalidateHealthCache } from '@/lib/relay/health-cache';

beforeEach(() => {
  resetFirestoreMock();
  invalidateHealthCache('p-m0');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('M0 snapshot loaders — integration through recomputeEngineHealth', () => {
  it('assembles block snapshots from static registry + global configs + partner prefs', async () => {
    // Partner has opted in to room_card with a field binding.
    seedMockDoc('partners/p-m0/relayConfig/room_card', {
      isVisible: true,
      fieldBindings: { title: { moduleSlug: 'room_inventory', sourceField: 'roomName' } },
    });

    const doc = await recomputeEngineHealth('p-m0', 'booking');
    expect(doc.partnerId).toBe('p-m0');
    expect(doc.engine).toBe('booking');
    // Before M0 this returned status='red' with 0 stage blocks; after M0
    // the hospitality blocks tagged booking in M04 populate the stages.
    const bookingStages = doc.stages.filter((s) =>
      ['greeting', 'discovery', 'showcase', 'conversion', 'handoff'].includes(s.stageId),
    );
    // At least one canonical stage must now have blocks (the static
    // booking registry provides them).
    expect(bookingStages.some((s) => s.blockCount > 0)).toBe(true);
  });

  it('returns empty snapshots list when partner has no prefs (graceful)', async () => {
    // Partner without any relayConfig collection data.
    const doc = await recomputeEngineHealth('p-m0-empty', 'booking');
    expect(doc.partnerId).toBe('p-m0-empty');
    // Static registry still provides block metadata, but no partner
    // has them enabled → stages red (expected for a fresh, un-onboarded
    // partner).
    expect(doc.status).toBe('red');
  });

  it('loadFlowSnapshot returns null when partner has no flowDefinition', async () => {
    const doc = await recomputeEngineHealth('p-m0-no-flow', 'booking');
    // orphanFlowTargets should be empty (no flow to compare against).
    expect(doc.orphanFlowTargets).toEqual([]);
  });

  it('loadFlowSnapshot reads partner flow when present', async () => {
    seedMockDoc('partners/p-m0-with-flow/relayConfig/flowDefinition', {
      id: 'flow_booking_hotel',
      stages: [
        { id: 'greeting', blockTypes: ['greeting'] },
        { id: 'discovery', blockTypes: ['room_card'] },
      ],
    });
    seedMockDoc('partners/p-m0-with-flow/relayConfig/room_card', {
      isVisible: true,
      fieldBindings: { title: { sourceField: 'roomName' } },
    });

    const doc = await recomputeEngineHealth('p-m0-with-flow', 'booking');
    // When a flow exists and references room_card, orphan-flow-target
    // count depends on whether room_card is in the partner's enabled
    // set. Since we enabled it via prefs, it shouldn't be an orphan.
    expect(doc.orphanFlowTargets.every((o) => o.blockId !== 'room_card')).toBe(true);
  });

  it('loadModuleSnapshots counts items when partner has an assigned module', async () => {
    // Seed systemModule, moduleAssignment, and items.
    seedMockDoc('systemModules/sysm1', {
      slug: 'room_inventory',
      schema: { fields: [{ id: 'roomName', type: 'text' }] },
    });
    seedMockDoc('moduleAssignments/assign1', {
      partnerId: 'p-m0-mod',
      systemModuleId: 'sysm1',
      partnerModuleId: 'pmod1',
    });
    // Seed 3 items under pmod1.
    for (const id of ['i1', 'i2', 'i3']) {
      seedMockDoc(`partners/p-m0-mod/businessModules/pmod1/items/${id}`, {
        name: 'sample',
      });
    }

    const doc = await recomputeEngineHealth('p-m0-mod', 'booking');
    // emptyModules should NOT contain room_inventory (3 items > 0).
    expect(doc.emptyModules).not.toContain('room_inventory');
    // Sanity check the helper actually seeded.
    expect(firestoreStore.has('partners/p-m0-mod/businessModules/pmod1/items/i1')).toBe(true);
  });
});
