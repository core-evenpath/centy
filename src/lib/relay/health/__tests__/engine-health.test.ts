import { describe, expect, it } from 'vitest';
import {
  computeEngineHealth,
  type BlockSnapshot,
  type FlowSnapshot,
  type ModuleSnapshot,
  BOOKING_CANONICAL_STAGES,
} from '../index';

// ── Fixture helpers ────────────────────────────────────────────────────
//
// These builders produce a happy-path baseline and let each test tweak a
// single axis to isolate one failure mode. Every canonical booking stage
// is represented by at least one renderable block in the baseline.

function okBindings(fields: string[]): BlockSnapshot['fieldBindings'] {
  const out: BlockSnapshot['fieldBindings'] = {};
  for (const f of fields) {
    out[f] = { bound: true, resolvedNonEmpty: true, type: 'string' };
  }
  return out;
}

function makeBlock(overrides: Partial<BlockSnapshot> & Pick<BlockSnapshot, 'id' | 'stage'>): BlockSnapshot {
  return {
    engines: ['booking'],
    requiredFields: overrides.requiredFields ?? [],
    optionalFields: overrides.optionalFields ?? [],
    moduleSlug: null,
    enabled: true,
    fieldBindings: overrides.fieldBindings ?? okBindings(overrides.requiredFields ?? []),
    ...overrides,
  };
}

function makeBaseline(): BlockSnapshot[] {
  // One block per canonical stage — all renderable, all enabled.
  return BOOKING_CANONICAL_STAGES.map((stage, i) =>
    makeBlock({ id: `blk_${stage}_${i}`, stage }),
  );
}

function makeFlow(blocks: BlockSnapshot[]): FlowSnapshot {
  return {
    flowId: 'test_flow',
    stages: BOOKING_CANONICAL_STAGES.map((stage) => ({
      stageId: stage,
      blockIds: blocks.filter((b) => b.stage === stage).map((b) => b.id),
    })),
  };
}

// ── Core tests ─────────────────────────────────────────────────────────

describe('computeEngineHealth', () => {
  it('green: baseline coverage with no issues', () => {
    const blocks = makeBaseline();
    const flow = makeFlow(blocks);
    const result = computeEngineHealth({
      partnerId: 'p1',
      engine: 'booking',
      blocks,
      modules: {},
      flow,
    });

    expect(result.status).toBe('green');
    expect(result.orphanBlocks).toEqual([]);
    expect(result.orphanFlowTargets).toEqual([]);
    expect(result.unresolvedBindings).toEqual([]);
    expect(result.emptyModules).toEqual([]);
    expect(result.stages.length).toBe(BOOKING_CANONICAL_STAGES.length);
    for (const s of result.stages) expect(s.status).toBe('green');
  });

  it('red: missing-stage — a canonical stage has zero renderable blocks', () => {
    const blocks = makeBaseline().filter((b) => b.stage !== 'conversion');
    const flow = makeFlow(blocks);
    const result = computeEngineHealth({
      partnerId: 'p1',
      engine: 'booking',
      blocks,
      modules: {},
      flow,
    });

    expect(result.status).toBe('red');
    const conv = result.stages.find((s) => s.stageId === 'conversion');
    expect(conv?.status).toBe('red');
    expect(conv?.blockCount).toBe(0);
  });

  it('red: orphan-block — enabled block not referenced by the flow', () => {
    const blocks = [
      ...makeBaseline(),
      makeBlock({ id: 'stray_block', stage: 'discovery' }),
    ];
    const flow = makeFlow(blocks.filter((b) => b.id !== 'stray_block'));

    const result = computeEngineHealth({
      partnerId: 'p1',
      engine: 'booking',
      blocks,
      modules: {},
      flow,
    });

    expect(result.orphanBlocks.map((o) => o.blockId)).toContain('stray_block');
  });

  it('red: orphan-flow-target — flow references a block the partner does not have', () => {
    const blocks = makeBaseline();
    const flow: FlowSnapshot = {
      flowId: 'test_flow',
      stages: [
        ...makeFlow(blocks).stages,
        { stageId: 'handoff', blockIds: ['nonexistent_block'] },
      ],
    };

    const result = computeEngineHealth({
      partnerId: 'p1',
      engine: 'booking',
      blocks,
      modules: {},
      flow,
    });

    expect(result.orphanFlowTargets.length).toBeGreaterThan(0);
    expect(
      result.orphanFlowTargets.some((o) => o.blockId === 'nonexistent_block'),
    ).toBe(true);
    // orphan-flow-target is an amber signal, not red
    expect(result.status).toBe('amber');
  });

  it('amber: unresolved-binding — required field missing', () => {
    const blocks = makeBaseline();
    // Make the discovery block require a field it hasn't bound
    const disco = blocks.find((b) => b.stage === 'discovery')!;
    disco.requiredFields = ['title'];
    disco.fieldBindings = { title: { bound: false, resolvedNonEmpty: false } };

    const flow = makeFlow(blocks);
    const result = computeEngineHealth({
      partnerId: 'p1',
      engine: 'booking',
      blocks,
      modules: {},
      flow,
    });

    // unresolved-binding on a required field makes the block not renderable,
    // which removes it from the stage's renderable count. If it was the only
    // block in that stage, the stage goes red. Here we only have one block
    // per stage, so discovery becomes red.
    expect(result.status).toBe('red');
    expect(result.unresolvedBindings.map((u) => u.blockId)).toContain(disco.id);

    // Separate scenario: block still renderable but has optional empty field.
    const blocks2 = makeBaseline();
    const disco2 = blocks2.find((b) => b.stage === 'discovery')!;
    disco2.optionalFields = ['subtitle'];
    disco2.fieldBindings = { subtitle: { bound: true, resolvedNonEmpty: false } };

    const result2 = computeEngineHealth({
      partnerId: 'p1',
      engine: 'booking',
      blocks: blocks2,
      modules: {},
      flow: makeFlow(blocks2),
    });
    // Optional empty is not amber at the engine level (no unresolvedBindings
    // entry, stage still renderable) — this confirms we only amber on the
    // signals the spec cares about.
    expect(result2.status).toBe('green');
  });

  it('amber: empty-module — connected module has zero items', () => {
    const blocks = makeBaseline();
    const disco = blocks.find((b) => b.stage === 'discovery')!;
    disco.moduleSlug = 'room_inventory';

    const modules: Record<string, ModuleSnapshot> = {
      room_inventory: { slug: 'room_inventory', itemCount: 0, fieldCatalog: [] },
    };

    const result = computeEngineHealth({
      partnerId: 'p1',
      engine: 'booking',
      blocks,
      modules,
      flow: makeFlow(blocks),
    });

    expect(result.status).toBe('amber');
    expect(result.emptyModules).toContain('room_inventory');
    expect(
      result.fixProposals.some(
        (f) => f.kind === 'populate-module' && f.moduleSlug === 'room_inventory',
      ),
    ).toBe(true);
  });

  it('fix-proposal match: bind-field when module has similar-named field', () => {
    const blocks = makeBaseline();
    const disco = blocks.find((b) => b.stage === 'discovery')!;
    disco.moduleSlug = 'room_inventory';
    disco.requiredFields = ['room_name'];
    disco.fieldBindings = {
      room_name: { bound: false, resolvedNonEmpty: false, type: 'string' },
    };

    const modules: Record<string, ModuleSnapshot> = {
      room_inventory: {
        slug: 'room_inventory',
        itemCount: 5,
        fieldCatalog: [
          { name: 'roomName', type: 'string' },  // camelCase variant — token overlap ~1.0
          { name: 'price', type: 'number' },
        ],
      },
    };

    const result = computeEngineHealth({
      partnerId: 'p1',
      engine: 'booking',
      blocks,
      modules,
      flow: makeFlow(blocks),
    });

    const bindFix = result.fixProposals.find(
      (f) => f.kind === 'bind-field' && f.blockId === disco.id && f.field === 'room_name',
    );
    expect(bindFix).toBeDefined();
    expect(bindFix?.sourceField).toBe('roomName');
    expect(['high', 'medium']).toContain(bindFix?.confidence);
  });

  it('fix-proposal no-match: no similar-named field → no bind-field proposal', () => {
    const blocks = makeBaseline();
    const disco = blocks.find((b) => b.stage === 'discovery')!;
    disco.moduleSlug = 'room_inventory';
    disco.requiredFields = ['location'];
    disco.fieldBindings = {
      location: { bound: false, resolvedNonEmpty: false, type: 'string' },
    };

    const modules: Record<string, ModuleSnapshot> = {
      room_inventory: {
        slug: 'room_inventory',
        itemCount: 5,
        fieldCatalog: [
          { name: 'quantity', type: 'number' },   // wrong type + wrong name
          { name: 'x', type: 'string' },           // too short, no overlap
        ],
      },
    };

    const result = computeEngineHealth({
      partnerId: 'p1',
      engine: 'booking',
      blocks,
      modules,
      flow: makeFlow(blocks),
    });

    const bindFix = result.fixProposals.find(
      (f) => f.kind === 'bind-field' && f.field === 'location',
    );
    expect(bindFix).toBeUndefined();
    // Still flagged as unresolved
    expect(result.unresolvedBindings.map((u) => u.field)).toContain('location');
  });
});

describe('purity of computeEngineHealth', () => {
  it('same input → same output (modulo computedAt)', () => {
    const blocks = makeBaseline();
    const flow = makeFlow(blocks);

    const a = computeEngineHealth({
      partnerId: 'p1',
      engine: 'booking',
      blocks,
      modules: {},
      flow,
    });
    const b = computeEngineHealth({
      partnerId: 'p1',
      engine: 'booking',
      blocks,
      modules: {},
      flow,
    });

    const stripTime = ({ computedAt, ...rest }: typeof a): Omit<typeof a, 'computedAt'> => rest;
    expect(stripTime(a)).toEqual(stripTime(b));
  });

  it('does not mutate input arrays', () => {
    const blocks = makeBaseline();
    const flow = makeFlow(blocks);
    const snapshotBlocks = JSON.parse(JSON.stringify(blocks));
    const snapshotFlow = JSON.parse(JSON.stringify(flow));

    computeEngineHealth({
      partnerId: 'p1',
      engine: 'booking',
      blocks,
      modules: {},
      flow,
    });

    expect(blocks).toEqual(snapshotBlocks);
    expect(flow).toEqual(snapshotFlow);
  });
});
