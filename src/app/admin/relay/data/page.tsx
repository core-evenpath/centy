// ── /admin/relay/data ───────────────────────────────────────────────
//
// Relay-specific data health dashboard. Server component: gathers the
// analytics once, then hands it to the client view for filtering /
// expansion / navigation.
//
// Renamed from /admin/relay/modules in PR E1 so the URL matches the
// page's actual purpose ("Relay data health") and doesn't collide
// mentally with /admin/modules (the generic platform-modules page).
// Storage is still shared (systemModules collection) pending the
// PR E2+ migration to a dedicated relaySchemas collection.

import { getRelayModuleAnalyticsAction } from '@/actions/relay-module-analytics';
import RelayModulesView from './RelayModulesView';
import RelayPageIntro from '../components/RelayPageIntro';
import RelaySubNav from '../components/RelaySubNav';
import VerticalEnrichButton from './VerticalEnrichButton';

export const metadata = {
  title: 'Relay Data · Admin',
  description:
    'Which Relay blocks have the data they need, and where drift lives.',
};

export default async function AdminRelayDataPage() {
  const result = await getRelayModuleAnalyticsAction();

  return (
    <div className="container mx-auto py-4 px-6 flex flex-col gap-4">
      <RelaySubNav />
      <RelayPageIntro
        title="Data"
        description="Read-only health dashboard for the Relay block ↔ data graph. Identify dark blocks that need data, see which partners have live data flowing, spot modules powering the most surfaces, and catch schema drift between what blocks read and what module schemas expose. For generic platform schemas (task trackers, CRMs, etc.), use /admin/modules."
      />
      <VerticalEnrichButton />

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
