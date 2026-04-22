import 'server-only';

// ── Three-tier server flow resolver ───────────────────────────────────
//
// Closes the server-side gap where functionIds without a hardcoded
// lib/flow-templates entry or a systemFlowTemplates doc get no flow
// at all — causing the orchestrator to select no block and Test Chat
// to return text-only responses.
//
// Tiers (matches admin UI's useFlowTemplate hook):
//   1. partners/{pid}/relayConfig/flowDefinition        (partner override)
//   2. systemFlowTemplates where functionId matches     (admin-authored)
//   3. buildFlowSyncServer(functionId)                  (auto-generated)
//
// Tier 3 is a server-safe port of admin/relay/flows/flow-helpers.ts's
// buildFlowSync — it uses _registry-data.ts (data-only, no React)
// rather than registry.ts (which pulls in 'use client' preview
// modules).

import { db } from '@/lib/firebase-admin';
import {
  buildStandardTransitions,
  defaultSettings,
  getFlowTemplateForFunction,
  STAGE_INTENTS,
  STAGE_LABELS,
  STAGE_ORDER,
  STAGE_SCORES,
} from '@/lib/flow-templates';
import {
  ALL_BLOCKS_DATA,
  ALL_SUB_VERTICALS_DATA,
  SHARED_BLOCK_IDS_DATA,
} from '@/app/admin/relay/blocks/previews/_registry-data';
import type {
  FlowDefinition,
  FlowStage,
  SystemFlowTemplate,
} from '@/lib/types-flow-engine';

export type FlowLoadSource =
  | 'partner-override'
  | 'firestore-template'
  | 'generated'
  | 'none';

export interface FlowLoadResult {
  flow: FlowDefinition | null;
  source: FlowLoadSource;
}

function logMiss(tier: number, partnerId: string, functionId: string): void {
  console.log(
    `[flow-loader] tier ${tier} miss for partner ${partnerId} fn ${functionId}`,
  );
}

function logHit(source: FlowLoadSource, partnerId: string): void {
  console.log(`[flow-loader] resolved from ${source} for partner ${partnerId}`);
}

export async function loadPartnerOverride(
  partnerId: string,
): Promise<FlowDefinition | null> {
  try {
    const doc = await db
      .collection('partners')
      .doc(partnerId)
      .collection('relayConfig')
      .doc('flowDefinition')
      .get();
    if (doc.exists) {
      return doc.data() as FlowDefinition;
    }
  } catch (err) {
    console.error('[flow-loader] partner override read failed', {
      partnerId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
  return null;
}

export async function loadSystemFlowTemplate(
  functionId: string,
): Promise<FlowDefinition | null> {
  try {
    const snap = await db
      .collection('systemFlowTemplates')
      .where('functionId', '==', functionId)
      .where('status', '==', 'active')
      .limit(1)
      .get();
    if (snap.docs.length > 0) {
      return snap.docs[0].data() as unknown as FlowDefinition;
    }
  } catch (err) {
    console.error('[flow-loader] systemFlowTemplates read failed', {
      functionId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
  return null;
}

/**
 * Server-safe replica of admin/relay/flows/flow-helpers.ts's
 * buildFlowSync. Resolves a SystemFlowTemplate from the block registry
 * without pulling in any 'use client' modules. Same algorithm as the
 * client helper:
 *   1. Prefer hard-coded template from lib/flow-templates
 *   2. Otherwise group functionId's blocks by stage and emit a flow
 */
export function buildFlowSyncServer(
  functionId: string,
): SystemFlowTemplate | null {
  const existing = getFlowTemplateForFunction(functionId);
  if (existing) return existing;

  const subVertical = ALL_SUB_VERTICALS_DATA.find((s) => s.id === functionId);
  if (!subVertical) return null;

  const blockIndex = new Map(ALL_BLOCKS_DATA.map((b) => [b.id, b]));
  const sharedBlockSet = new Set(SHARED_BLOCK_IDS_DATA);
  const sharedBlocks = ALL_BLOCKS_DATA.filter((b) => sharedBlockSet.has(b.id));
  const verticalBlocks = subVertical.blocks
    .map((id) => blockIndex.get(id))
    .filter(
      (b): b is NonNullable<typeof b> =>
        Boolean(b) && !sharedBlockSet.has((b as { id: string }).id),
    );
  const blocks = [...sharedBlocks, ...verticalBlocks];

  const blocksByStage: Record<string, string[]> = {};
  for (const b of blocks) {
    if (!blocksByStage[b.stage]) blocksByStage[b.stage] = [];
    blocksByStage[b.stage].push(b.id);
  }

  const prefix = functionId.replace(/[^a-z0-9]/g, '_').substring(0, 10);

  const stages: FlowStage[] = STAGE_ORDER.filter(
    (stageType) => (blocksByStage[stageType]?.length ?? 0) > 0,
  ).map((stageType) => ({
    id: `${prefix}_${stageType}`,
    type: stageType,
    label: STAGE_LABELS[stageType] ?? stageType,
    blockTypes: blocksByStage[stageType],
    intentTriggers: STAGE_INTENTS[stageType] ?? ['browsing'],
    leadScoreImpact: STAGE_SCORES[stageType] ?? 1,
    ...(stageType === 'greeting' ? { isEntry: true } : {}),
    ...(stageType === 'handoff' ? { isExit: true } : {}),
  }));

  if (stages.length === 0) return null;

  const industryName = subVertical.industryId ?? '';
  const functionName = subVertical.name ?? functionId;

  return {
    id: `tpl_${functionId}`,
    name: `${functionName} Flow`,
    industryId: subVertical.industryId ?? '',
    functionId,
    industryName,
    functionName,
    description: `Auto-generated flow for ${functionName}`,
    settings: defaultSettings(),
    stages,
    transitions: buildStandardTransitions(stages),
  };
}

export async function resolveFlowDefinition(
  partnerId: string,
  functionId: string,
): Promise<FlowLoadResult> {
  const override = await loadPartnerOverride(partnerId);
  if (override) {
    logHit('partner-override', partnerId);
    return { flow: override, source: 'partner-override' };
  }
  logMiss(1, partnerId, functionId);

  const firestoreTpl = await loadSystemFlowTemplate(functionId);
  if (firestoreTpl) {
    logHit('firestore-template', partnerId);
    return { flow: firestoreTpl, source: 'firestore-template' };
  }
  logMiss(2, partnerId, functionId);

  const generated = buildFlowSyncServer(functionId);
  if (generated) {
    logHit('generated', partnerId);
    return {
      flow: generated as unknown as FlowDefinition,
      source: 'generated',
    };
  }
  logMiss(3, partnerId, functionId);

  return { flow: null, source: 'none' };
}
