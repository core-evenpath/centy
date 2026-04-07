import { getSystemFlowTemplatesFromDB } from '@/actions/flow-engine-actions';
import FlowBuilder from './FlowBuilder';
import type { FlowBuilderTemplate, SubVerticalFlowSummary, VerticalGroup } from './flow-builder-types';
import { SYSTEM_FLOW_TEMPLATES } from '@/lib/flow-templates';

export default async function FlowsPage() {
  // Dynamic import to avoid pulling client-side React component previews into server bundle
  const { VERTICALS, ALL_SUB_VERTICALS } = await import('../blocks/previews/registry');

  const res = await getSystemFlowTemplatesFromDB();

  let templates: FlowBuilderTemplate[] = [];
  const dbFunctionIds = new Set<string>();

  if (res.success && res.templates) {
    templates = res.templates.map(t => {
      if (t.functionId) dbFunctionIds.add(t.functionId);
      return {
        id: t.id,
        name: t.name,
        status: t.status || 'draft',
        functionId: t.functionId || undefined,
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
      };
    });
  }

  // Build sub-vertical summaries for sidebar navigation
  const subVerticalSummaries: SubVerticalFlowSummary[] = ALL_SUB_VERTICALS.map(sv => {
    const vertical = VERTICALS.find(v => v.subVerticals.some(s => s.id === sv.id));
    return {
      functionId: sv.id,
      name: sv.name,
      industryId: sv.industryId,
      verticalName: vertical?.name || '',
      blockCount: sv.blocks.length + 6, // +6 shared blocks
      hasCustomTemplate: SYSTEM_FLOW_TEMPLATES.some(t => t.functionId === sv.id),
      hasDbTemplate: dbFunctionIds.has(sv.id),
    };
  });

  // Group by vertical for sidebar accordion
  const verticalGroups: VerticalGroup[] = VERTICALS.map(v => ({
    id: v.id,
    industryId: v.industryId,
    name: v.name,
    iconName: v.iconName,
    accentColor: v.accentColor,
    subVerticalIds: v.subVerticals.map(sv => sv.id),
  }));

  return (
    <FlowBuilder
      initialTemplates={templates}
      verticalGroups={verticalGroups}
      subVerticalSummaries={subVerticalSummaries}
    />
  );
}
