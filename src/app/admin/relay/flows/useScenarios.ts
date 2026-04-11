'use client';

import { useState, useEffect, useCallback } from 'react';
import { getScenariosAction, generateScenariosAction } from '@/actions/flow-scenario-actions';
import type { GenerateContext } from '@/actions/flow-scenario-actions';
import { getSubVertical, getBlocksForFunction, SHARED_BLOCK_IDS } from '../blocks/previews/registry';
import type { FlowScenario } from '@/lib/types-flow-scenarios';
import type { BlockInfo } from '@/actions/flow-scenario-actions';

// Module-level cache: functionId → scenarios[]
const cache = new Map<string, FlowScenario[]>();

/** Build generation context with sibling differentiation data. */
function buildContext(functionId: string): GenerateContext | null {
  const result = getSubVertical(functionId);
  if (!result) return null;
  const { vertical, subVertical } = result;

  // Build stage→blocks map with rich info
  const blocks = getBlocksForFunction(functionId);
  const sharedIds = new Set(SHARED_BLOCK_IDS);
  const stageMap: Record<string, BlockInfo[]> = {};
  for (const b of blocks) {
    if (!stageMap[b.stage]) stageMap[b.stage] = [];
    stageMap[b.stage].push({
      label: b.label, desc: b.desc,
      intents: b.intents, isShared: sharedIds.has(b.id),
    });
  }

  // Compute sibling names and block differentiation
  const myBlockIds = new Set(subVertical.blocks);
  const siblings: string[] = [];
  const allSiblingBlockIds = new Set<string>();

  for (const sib of vertical.subVerticals) {
    if (sib.id === functionId) continue;
    siblings.push(sib.name);
    for (const bid of sib.blocks) allSiblingBlockIds.add(bid);
  }

  // Blocks only this sub-vertical has (no sibling shares them)
  const uniqueBlocks: string[] = [];
  for (const bid of subVertical.blocks) {
    if (!allSiblingBlockIds.has(bid)) {
      const def = vertical.blocks.find(b => b.id === bid);
      if (def) uniqueBlocks.push(def.label);
    }
  }

  // Blocks siblings have but this sub-vertical lacks
  const missingBlocks: string[] = [];
  for (const bid of allSiblingBlockIds) {
    if (!myBlockIds.has(bid) && !sharedIds.has(bid)) {
      const def = vertical.blocks.find(b => b.id === bid);
      if (def) missingBlocks.push(def.label);
    }
  }

  return {
    subVerticalName: subVertical.name,
    verticalName: vertical.name,
    industryId: vertical.industryId,
    stageBlocks: Object.entries(stageMap).map(([stage, blocks]) => ({ stage, blocks })),
    siblings, uniqueBlocks, missingBlocks,
  };
}

export interface ScenariosHookResult {
  scenarios: FlowScenario[];
  selected: FlowScenario | null;
  selectedIdx: number;
  setSelectedIdx: (idx: number) => void;
  loading: boolean;
  generating: boolean;
  error: string | null;
  regenerate: () => void;
}

export function useScenarios(functionId: string): ScenariosHookResult {
  const [scenarios, setScenarios] = useState<FlowScenario[]>(() =>
    functionId ? cache.get(functionId) || [] : [],
  );
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!functionId) {
      setScenarios([]); setSelectedIdx(0); setLoading(false); setError(null);
      return;
    }

    const cached = cache.get(functionId);
    if (cached?.length) {
      setScenarios(cached); setSelectedIdx(0); setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const timer = setTimeout(() => { if (!cancelled) setLoading(false); }, 5000);

    getScenariosAction(functionId).then(result => {
      clearTimeout(timer);
      if (cancelled) return;
      if (result.success && result.scenarios.length > 0) {
        cache.set(functionId, result.scenarios);
        setScenarios(result.scenarios);
      }
      setSelectedIdx(0);
      setLoading(false);
    }).catch(() => {
      clearTimeout(timer);
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; clearTimeout(timer); };
  }, [functionId]);

  const regenerate = useCallback(() => {
    if (!functionId || generating) return;

    const ctx = buildContext(functionId);
    if (!ctx) { setError('Sub-vertical not found'); return; }

    setGenerating(true);
    setError(null);

    generateScenariosAction(functionId, ctx).then(result => {
      if (result.success && result.count > 0) {
        getScenariosAction(functionId).then(r => {
          if (r.success) {
            cache.set(functionId, r.scenarios);
            setScenarios(r.scenarios);
            setSelectedIdx(0);
          }
          setGenerating(false);
        }).catch(() => setGenerating(false));
      } else {
        setError(result.error || 'Generation failed — no scenarios returned');
        setGenerating(false);
      }
    }).catch(e => {
      setError(e?.message || 'Network error during generation');
      setGenerating(false);
    });
  }, [functionId, generating]);

  const selected = scenarios[selectedIdx] || null;

  return { scenarios, selected, selectedIdx, setSelectedIdx, loading, generating, error, regenerate };
}
