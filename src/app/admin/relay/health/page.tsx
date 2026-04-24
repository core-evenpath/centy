import { db as adminDb } from '@/lib/firebase-admin';
import HealthShell from './components/HealthShell';
import RelayPageIntro from '../components/RelayPageIntro';
import type { PartnerOption } from '../blocks/components/PartnerSelector';
import type { Engine } from '@/lib/relay/engine-types';
import { getPartnerEngines } from '@/lib/relay/engine-recipes';

export default async function RelayHealthPage() {
  let partners: PartnerOption[] = [];
  const partnerEnginesById: Record<string, Engine[]> = {};

  try {
    const snap = await adminDb.collection('partners').limit(50).get();
    partners = snap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      const label =
        (data.businessName as string | undefined) ??
        (data.name as string | undefined) ??
        d.id;
      const biz = data.businessPersona as
        | { identity?: { businessCategories?: Array<{ functionId?: string }> } }
        | undefined;
      const functionId =
        biz?.identity?.businessCategories?.[0]?.functionId ?? null;

      // Post-P3.M03: engines come from the partner's explicit `engines`
      // field only (set by onboarding M14 `applyEngineRecipe`). Partners
      // without `engines` render em-dashes across the matrix.
      const engines = getPartnerEngines(
        data as unknown as Parameters<typeof getPartnerEngines>[0],
      );
      partnerEnginesById[d.id] = engines;

      return { id: d.id, label, functionId };
    });
    partners.sort((a, b) => a.label.localeCompare(b.label));
  } catch {
    // Non-fatal: fall back to empty state.
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <RelayPageIntro
        title="Relay Health"
        description="Partner-scoped engine diagnostics. Pick a partner and an engine to see which flow stages have blocks, which required fields are unbound, which modules are empty, and which blocks have no home in the flow. This is the go-to surface when a partner's chat is misbehaving and you need to pinpoint where the wiring broke."
        links={[
          { href: '/admin/relay/engine', label: 'Block Engine →' },
          { href: '/admin/relay/modules', label: 'Modules ↔ Blocks →' },
        ]}
      />
      <HealthShell partners={partners} partnerEnginesById={partnerEnginesById} />
    </div>
  );
}
