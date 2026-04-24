// ── /admin/relay/modules ────────────────────────────────────────────────
//
// Relay-contextualised view of the modules ↔ blocks graph. Server
// component: gathers the analytics once, then hands it to the client
// view for filtering / expansion / navigation.

import { getRelayModuleAnalyticsAction } from '@/actions/relay-module-analytics';
import RelayModulesView from './RelayModulesView';
import RelayPageIntro from '../components/RelayPageIntro';

export const metadata = {
  title: 'Relay Modules · Admin',
  description:
    'Which modules power which relay blocks, and where the data gaps are.',
};

export default async function AdminRelayModulesPage() {
  const result = await getRelayModuleAnalyticsAction();

  return (
    <div className="container mx-auto py-8 px-6 flex flex-col gap-4">
      <RelayPageIntro
        title="Modules ↔ Blocks"
        description="Read-only health dashboard of the blocks-to-modules graph. Identify dark blocks that need module data, see which partners have live data flowing, and spot modules that are powering the most surfaces. For schema editing, go to /admin/modules."
        links={[
          { href: '/admin/modules', label: 'Module Schemas →' },
          { href: '/admin/relay/blocks', label: 'Block Registry →' },
          { href: '/admin/relay/engine', label: 'Block Engine →' },
        ]}
      />

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
