import { getSystemFlowTemplatesFromDB } from '@/actions/flow-engine-actions';
import FlowBuilder from './FlowBuilder';
import type { FlowBuilderTemplate } from './flow-builder-types';

export default async function FlowsPage() {
  const res = await getSystemFlowTemplatesFromDB();

  let templates: FlowBuilderTemplate[] = [];

  if (res.success && res.templates) {
    templates = res.templates.map(t => ({
      id: t.id,
      name: t.name,
      status: t.status || 'draft',
      stages: (t.stages || []).map(s => ({
        id: s.id,
        name: s.label || s.id,
        type: s.type || s.id,
        blockIds: s.blockTypes || [],
        intentTriggers: (s.intentTriggers || []) as string[],
        leadScoreImpact: s.leadScoreImpact || 0,
        isEntry: s.isEntry,
        isExit: s.isExit,
      })),
      transitions: (t.transitions || []).map(tr => ({
        from: tr.from,
        to: tr.to,
        trigger: tr.trigger as string,
        priority: tr.priority,
      })),
    }));
  }

  return <FlowBuilder initialTemplates={templates} />;
}
