import { getRelayStatsAction, getRelayDiagnosticsAction, getFlowTemplatesListAction } from '@/actions/relay-admin-actions';
import { getSystemFlowTemplatesFromDB } from '@/actions/flow-engine-actions';
import RelayDashboard from './RelayDashboard';
import RelaySubNav from './components/RelaySubNav';

export default async function RelayAdminPage() {
  const [statsResult, diagResult, templatesResult, flowResult] = await Promise.all([
    getRelayStatsAction(),
    getRelayDiagnosticsAction(),
    getFlowTemplatesListAction(),
    getSystemFlowTemplatesFromDB(),
  ]);

  const activeTemplate = flowResult.success && flowResult.templates?.length
    ? (flowResult.templates.find(t => t.status === 'active') || flowResult.templates[0])
    : null;

  const initialFlowTemplate = activeTemplate ? {
    id: activeTemplate.id,
    name: activeTemplate.name,
    stages: (activeTemplate.stages || []).map((s: any) => ({
      id: s.id,
      name: s.label || s.name || s.id,
      type: s.type || s.id,
      blockIds: s.blockTypes || s.blockIds || [],
      intentTriggers: (s.intentTriggers || []) as string[],
      leadScoreImpact: s.leadScoreImpact || 0,
      isEntry: s.isEntry,
      isExit: s.isExit,
    })),
    transitions: (activeTemplate.transitions || []).map((t: any) => ({
      from: t.from,
      to: t.to,
      trigger: t.trigger as string,
      priority: t.priority,
    })),
  } : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
      <RelaySubNav />
      <RelayDashboard
        initialStats={statsResult.success ? statsResult.stats : { activeBlocks: 0, totalBlocks: 0, flowStages: 0, transitions: 0, intents: 0 }}
        initialDiagnostics={diagResult.success ? diagResult.checks : []}
        initialTemplates={templatesResult.success ? templatesResult.templates : []}
        initialFlowTemplate={initialFlowTemplate}
      />
    </div>
  );
}
