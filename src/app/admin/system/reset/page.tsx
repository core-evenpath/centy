// Admin reset page (MR05).
//
// Server component shell. Client component (ResetShell) handles all
// interactive state — collection selection, filter input, dry-run
// result display, execute confirmation, audit sidebar.
//
// The page itself renders only the static chrome + env-flag
// visibility signal. All destructive logic lives in server actions
// (previewReset + executeReset in relay-reset-actions.ts).

import { RESETTABLE_COLLECTIONS } from '@/lib/admin/reset/resettable-collections';
import ResetShell from './ResetShell';

export default async function SystemResetPage() {
  // Server-side: read the env flag so the client knows whether
  // unscoped is available without exposing other env detail.
  const unscopedAllowed = process.env.RESET_ALLOW_UNSCOPED === 'true';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 11, color: '#7a7a70', marginBottom: 4 }}>
          <a href="/admin" style={{ color: '#7a7a70', textDecoration: 'none' }}>
            ← Back to Admin
          </a>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#1a1a18' }}>
          System Reset
        </h1>
        <div style={{ fontSize: 12, color: '#7a7a70', marginTop: 4 }}>
          Reset specific backend collections. Dry-run preview before every execute.{' '}
          {unscopedAllowed ? (
            <span style={{ color: '#b91c1c', fontWeight: 600 }}>
              UNSCOPED mode AVAILABLE (RESET_ALLOW_UNSCOPED=true)
            </span>
          ) : (
            <span>Unscoped resets require RESET_ALLOW_UNSCOPED=true (currently disabled).</span>
          )}
        </div>
      </div>

      <ResetShell
        collections={RESETTABLE_COLLECTIONS}
        unscopedAllowed={unscopedAllowed}
      />
    </div>
  );
}
