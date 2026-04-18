import { db as adminDb } from '@/lib/firebase-admin';
import HealthShell from './components/HealthShell';
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

      // Resolve engines per the M03 recipe (partner.engines override →
      // functionId derivation). M11's getPartnerEngines accepts a loose
      // structural shape; cast is explicit via the exported param type.
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
    <HealthShell partners={partners} partnerEnginesById={partnerEnginesById} />
  );
}
