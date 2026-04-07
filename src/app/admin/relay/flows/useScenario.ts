'use client';

import { useState, useEffect, useCallback } from 'react';
import { getScenarioAction, generateScenarioAction } from '@/actions/flow-scenario-actions';
import type { ScenarioScript } from '@/lib/types-flow-engine';

// Module-level cache persists for page session
const cache = new Map<string, ScenarioScript>();

interface ScenarioResult {
  scenario: ScenarioScript | null;
  loading: boolean;
  generating: boolean;
  regenerate: () => void;
}

export function useScenario(functionId: string): ScenarioResult {
  const [scenario, setScenario] = useState<ScenarioScript | null>(() =>
    functionId ? cache.get(functionId) || null : null
  );
  const [loading, setLoading] = useState(!scenario && !!functionId);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!functionId) {
      setScenario(null);
      setLoading(false);
      return;
    }

    const cached = cache.get(functionId);
    if (cached) {
      setScenario(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getScenarioAction(functionId).then(result => {
      if (cancelled) return;
      if (result.success && result.scenario) {
        cache.set(functionId, result.scenario);
        setScenario(result.scenario);
      }
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [functionId]);

  const regenerate = useCallback(() => {
    if (!functionId || generating) return;
    setGenerating(true);

    generateScenarioAction(functionId).then(result => {
      if (result.success && result.scenario) {
        cache.set(functionId, result.scenario);
        setScenario(result.scenario);
      }
      setGenerating(false);
    }).catch(() => setGenerating(false));
  }, [functionId, generating]);

  return { scenario, loading, generating, regenerate };
}
