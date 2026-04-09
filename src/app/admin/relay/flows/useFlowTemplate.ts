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
  // Start with local template immediately (synchronous, always works)
  const [state, setState] = useState<FlowTemplateResult>(() => {
    if (!functionId) return { template: null, loading: false, source: null };
    const cached = cache.get(functionId);
    if (cached) return { template: cached.template, loading: false, source: cached.source };
    // Provide local template immediately so default flows always work
    const local = buildFlowSync(functionId);
    return { template: local, loading: !!local, source: local ? 'local' : null };
  });

  useEffect(() => {
    if (!functionId) {
      setState({ template: null, loading: false, source: null });
      return;
    }

    const cached = cache.get(functionId);
    if (cached) {
      setState({ template: cached.template, loading: false, source: cached.source });
      return;
    }

    // Set local template immediately so chat works while Firestore loads
    const local = buildFlowSync(functionId);
    if (local) {
      setState({ template: local, loading: true, source: 'local' });
    }

    let cancelled = false;

    // Try Firestore in background with 5s timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    getFlowTemplatesAction(functionId).then(result => {
      clearTimeout(timeout);
      if (cancelled) return;

      if (result.success && result.templates.length > 0) {
        const tpl = result.templates[0];
        cache.set(functionId, { template: tpl, source: 'firestore' });
        setState({ template: tpl, loading: false, source: 'firestore' });
        return;
      }

      // Firestore empty — cache & use local
      if (local) {
        cache.set(functionId, { template: local, source: 'local' });
        setState({ template: local, loading: false, source: 'local' });
      } else {
        setState({ template: null, loading: false, source: null });
      }
    }).catch(() => {
      clearTimeout(timeout);
      if (cancelled) return;
      // Firestore failed — keep local template
      if (local) {
        cache.set(functionId, { template: local, source: 'local' });
      }
      setState(prev => ({ ...prev, loading: false }));
    });

    return () => { cancelled = true; clearTimeout(timeout); };
  }, [functionId]);

  return state;
}
