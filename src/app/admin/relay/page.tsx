import { getRelayStatsAction, getRelayDiagnosticsAction } from '@/actions/relay-admin-actions';
import RelayDashboard from './RelayDashboard';

export default async function RelayAdminPage() {
  const [statsResult, diagResult] = await Promise.all([
    getRelayStatsAction(),
    getRelayDiagnosticsAction(),
  ]);
  return (
    <RelayDashboard
      initialStats={statsResult.success ? statsResult.stats : { activeBlocks: 0, totalBlocks: 0, flowStages: 0, transitions: 0, intents: 0 }}
      initialDiagnostics={diagResult.success ? diagResult.checks : []}
    />
  );
}
