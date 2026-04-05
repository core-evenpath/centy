import { getRelayStatsAction, getRelayDiagnosticsAction, getFlowTemplatesListAction } from '@/actions/relay-admin-actions';
import RelayDashboard from './RelayDashboard';

export default async function RelayAdminPage() {
  const [statsResult, diagResult, templatesResult] = await Promise.all([
    getRelayStatsAction(),
    getRelayDiagnosticsAction(),
    getFlowTemplatesListAction(),
  ]);

  return (
    <RelayDashboard
      initialStats={statsResult.success ? statsResult.stats : { activeBlocks: 0, totalBlocks: 0, flowStages: 0, transitions: 0, intents: 0 }}
      initialDiagnostics={diagResult.success ? diagResult.checks : []}
      initialTemplates={templatesResult.success ? templatesResult.templates : []}
    />
  );
}
