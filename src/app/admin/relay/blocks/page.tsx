import { db as adminDb } from '@/lib/firebase-admin';
import BlocksEngineShell from './components/BlocksEngineShell';
import type { PartnerOption } from './components/PartnerSelector';

export default async function BlockRegistryPage() {
  let initialBlocks: Array<{ id: string; status: string }> = [];
  let partners: PartnerOption[] = [];

  try {
    const snap = await adminDb.collection('relayBlockConfigs').get();
    initialBlocks = snap.docs.map((d) => ({
      id: d.id,
      status: (d.data().status as string) || 'active',
    }));
  } catch {
    // Collection may not exist yet — AdminRelayBlocks falls back to
    // registry defaults.
  }

  try {
    // Lightweight partner list for the engine-tab selector. Cap at 50
    // to avoid full-collection dumps in admin; operators searching for
    // a specific partner can be handled in a follow-up milestone if the
    // list grows large.
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
      return { id: d.id, label, functionId };
    });
    partners.sort((a, b) => a.label.localeCompare(b.label));
  } catch {
    // Non-fatal: fall back to catalog view.
  }

  return (
    <BlocksEngineShell initialBlocks={initialBlocks} partners={partners} />
  );
}
