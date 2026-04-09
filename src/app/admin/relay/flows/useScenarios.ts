'use client';

import { useState, useEffect, useCallback } from 'react';
import { getScenariosAction, generateScenariosAction } from '@/actions/flow-scenario-actions';
import type { FlowScenario } from '@/lib/types-flow-scenarios';

// Module-level cache: functionId → scenarios[]
const cache = new Map<string, FlowScenario[]>();

export interface ScenariosHookResult {
  scenarios: FlowScenario[];
  selected: FlowScenario | null;
  selectedIdx: number;
  setSelectedIdx: (idx: number) => void;
  loading: boolean;
  generating: boolean;
  regenerate: () => void;
}

export function useScenarios(functionId: string): ScenariosHookResult {
  const [scenarios, setScenarios] = useState<FlowScenario[]>(() =>
    functionId ? cache.get(functionId) || [] : [],
  );
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(!scenarios.length && !!functionId);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!functionId) {
      setScenarios([]); setSelectedIdx(0); setLoading(false);
      return;
    }

    const cached = cache.get(functionId);
    if (cached?.length) {
      setScenarios(cached); setSelectedIdx(0); setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getScenariosAction(functionId).then(result => {
      if (cancelled) return;
      if (result.success && result.scenarios.length > 0) {
        cache.set(functionId, result.scenarios);
        setScenarios(result.scenarios);
      }
      setSelectedIdx(0);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [functionId]);

  const regenerate = useCallback(() => {
    if (!functionId || generating) return;
    setGenerating(true);

    generateScenariosAction(functionId).then(result => {
      if (result.success && result.count > 0) {
        // Refetch from Firestore to get the full objects
        getScenariosAction(functionId).then(r => {
          if (r.success) {
            cache.set(functionId, r.scenarios);
            setScenarios(r.scenarios);
            setSelectedIdx(0);
          }
          setGenerating(false);
        });
      } else {
        setGenerating(false);
      }
    }).catch(() => setGenerating(false));
  }, [functionId, generating]);

  const selected = scenarios[selectedIdx] || null;

  return { scenarios, selected, selectedIdx, setSelectedIdx, loading, generating, regenerate };
}
