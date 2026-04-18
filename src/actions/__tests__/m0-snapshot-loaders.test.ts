import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// ── Firestore admin mock (supports nested subcollections) ────────────

interface DocData {
  id: string;
  data: Record<string, unknown>;
}
const store = new Map<string, DocData>();       // flat key → doc
const countByCollection = new Map<string, number>();

function makeCollectionRef(path: string): {
  doc: (id: string) => ReturnType<typeof makeDocRef>;
  get: () => Promise<{ docs: Array<{ id: string; data: () => unknown }> }>;
  where: (_field: string, _op: string, value: unknown) => ReturnType<typeof makeCollectionRef>;
  count: () => { get: () => Promise<{ data: () => { count: number } }> };
} {
  return {
    doc: (id: string) => makeDocRef(`${path}/${id}`),
    get: async () => ({
      docs: [...store.entries()]
        .filter(([k]) => {
          const parentPath = k.substring(0, k.lastIndexOf('/'));
          return parentPath === path;
        })
        .map(([k, v]) => ({ id: v.id, data: () => v.data, ref: { id: v.id, path: k } })) as Array<{ id: string; data: () => unknown }>,
    }),
    where: (_field: string, _op: string, _value: unknown) => makeCollectionRef(path),
    count: () => ({
      get: async () => {
        const n = [...store.keys()].filter((k) => {
          const parentPath = k.substring(0, k.lastIndexOf('/'));
          return parentPath === path;
        }).length;
        countByCollection.set(path, n);
        return { data: () => ({ count: n }) };
      },
    }),
  };
}

function makeDocRef(path: string): {
  set: (data: Record<string, unknown>, opts?: { merge?: boolean }) => Promise<void>;
  get: () => Promise<{ exists: boolean; data: () => unknown }>;
  collection: (sub: string) => ReturnType<typeof makeCollectionRef>;
} {
  return {
    set: async (data: Record<string, unknown>, opts?: { merge?: boolean }) => {
      const existing = store.get(path);
      const id = path.split('/').pop()!;
      const merged = opts?.merge && existing ? { ...existing.data, ...data } : data;
      store.set(path, { id, data: merged });
    },
    get: async () => {
      const hit = store.get(path);
      return { exists: hit !== undefined, data: () => hit?.data };
    },
    collection: (sub: string) => makeCollectionRef(`${path}/${sub}`),
  };
}

vi.mock('@/lib/firebase-admin', () => ({
  db: {
    collection: vi.fn((name: string) => makeCollectionRef(name)),
  },
}));

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
  store.clear();
  countByCollection.clear();
  invalidateHealthCache('p-m0');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('M0 snapshot loaders — integration through recomputeEngineHealth', () => {
  it('assembles block snapshots from static registry + global configs + partner prefs', async () => {
    // Partner has opted in to room_card with a field binding.
    await fetch_mock_setup_pref('p-m0', 'room_card', {
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
    // Seed a flow definition doc.
    await fetch_mock_setup_flow('p-m0-with-flow', {
      id: 'flow_booking_hotel',
      stages: [
        { id: 'greeting', blockTypes: ['greeting'] },
        { id: 'discovery', blockTypes: ['room_card'] },
      ],
    });
    await fetch_mock_setup_pref('p-m0-with-flow', 'room_card', {
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
    store.set('systemModules/sysm1', {
      id: 'sysm1',
      data: {
        slug: 'room_inventory',
        schema: { fields: [{ id: 'roomName', type: 'text' }] },
      },
    });
    store.set('moduleAssignments/assign1', {
      id: 'assign1',
      data: { partnerId: 'p-m0-mod', systemModuleId: 'sysm1', partnerModuleId: 'pmod1' },
    });
    // Seed 3 items under pmod1.
    for (const id of ['i1', 'i2', 'i3']) {
      store.set(`partners/p-m0-mod/businessModules/pmod1/items/${id}`, {
        id,
        data: { name: 'sample' },
      });
    }

    const doc = await recomputeEngineHealth('p-m0-mod', 'booking');
    // emptyModules should NOT contain room_inventory (3 items > 0).
    expect(doc.emptyModules).not.toContain('room_inventory');
  });
});

// ── Test helpers ─────────────────────────────────────────────────────

async function fetch_mock_setup_pref(
  partnerId: string,
  blockId: string,
  data: Record<string, unknown>,
) {
  store.set(`partners/${partnerId}/relayConfig/${blockId}`, {
    id: blockId,
    data,
  });
}

async function fetch_mock_setup_flow(
  partnerId: string,
  flow: Record<string, unknown>,
) {
  store.set(`partners/${partnerId}/relayConfig/flowDefinition`, {
    id: 'flowDefinition',
    data: flow,
  });
}
