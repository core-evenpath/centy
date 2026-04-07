'use client';

import { useState, useEffect } from 'react';
import { getFlowTemplatesAction } from '@/actions/flow-engine-actions';
import { buildFlowSync } from './flow-helpers';
import type { SystemFlowTemplate } from '@/lib/types-flow-engine';

// Module-level cache persists for page session
const cache = new Map<string, { template: SystemFlowTemplate; source: 'firestore' | 'local' }>();

interface FlowTemplateResult {
  template: SystemFlowTemplate | null;
  loading: boolean;
  source: 'firestore' | 'local' | null;
}

export function useFlowTemplate(functionId: string): FlowTemplateResult {
  const [state, setState] = useState<FlowTemplateResult>(() => {
    if (!functionId) return { template: null, loading: false, source: null };
    const cached = cache.get(functionId);
    if (cached) return { template: cached.template, loading: false, source: cached.source };
    return { template: null, loading: true, source: null };
  });

  useEffect(() => {
    if (!functionId) {
      setState({ template: null, loading: false, source: null });
      return;
    }

    // Check cache first
    const cached = cache.get(functionId);
    if (cached) {
      setState({ template: cached.template, loading: false, source: cached.source });
      return;
    }

    let cancelled = false;

    async function fetchTemplate() {
      try {
        const result = await getFlowTemplatesAction(functionId);
        if (cancelled) return;

        if (result.success && result.templates.length > 0) {
          const tpl = result.templates[0];
          cache.set(functionId, { template: tpl, source: 'firestore' });
          setState({ template: tpl, loading: false, source: 'firestore' });
          return;
        }
      } catch {
        // Firestore unavailable, fall through to local
      }

      if (cancelled) return;

      // Local fallback
      const local = buildFlowSync(functionId);
      if (local) {
        cache.set(functionId, { template: local, source: 'local' });
        setState({ template: local, loading: false, source: 'local' });
      } else {
        setState({ template: null, loading: false, source: null });
      }
    }

    setState(prev => ({ ...prev, loading: true }));
    fetchTemplate();

    return () => { cancelled = true; };
  }, [functionId]);

  return state;
}
