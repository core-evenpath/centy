// ── /admin/relay/modules ────────────────────────────────────────────────
//
// Relay-contextualised view of the modules ↔ blocks graph. Server
// component: gathers the analytics once, then hands it to the client
// view for filtering / expansion / navigation.

import { getRelayModuleAnalyticsAction } from '@/actions/relay-module-analytics';
import RelayModulesView from './RelayModulesView';

export const metadata = {
  title: 'Relay Modules · Admin',
  description:
    'Which modules power which relay blocks, and where the data gaps are.',
};

export default async function AdminRelayModulesPage() {
  const result = await getRelayModuleAnalyticsAction();

  return (
    <div className="container mx-auto py-8 px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Relay Modules</h1>
        <p className="text-muted-foreground mt-2">
          Blocks ↔ modules graph. Identify dark blocks that need data and see
          which modules are powering the most surfaces.
        </p>
      </div>

      {result.success && result.data ? (
        <RelayModulesView data={result.data} />
      ) : (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Error loading analytics: {result.error ?? 'unknown'}
        </div>
      )}
    </div>
  );
}
