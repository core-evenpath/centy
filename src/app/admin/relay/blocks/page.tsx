import { db as adminDb } from '@/lib/firebase-admin';
import AdminRelayBlocks from './AdminRelayBlocks';
import RelayPageIntro from '../components/RelayPageIntro';
import RelaySubNav from '../components/RelaySubNav';

export default async function BlockRegistryPage() {
  let initialBlocks: Array<{ id: string; status: string }> = [];

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>
      <RelaySubNav />
      <RelayPageIntro
        title="Block Registry"
        description="The master catalog of every Relay block across every vertical. Enable or disable individual blocks, sync the code registry with Firestore, and inspect each block's definition (family, stage, module binding, sync health). This controls which blocks can render in any partner's chat."
      />
      <AdminRelayBlocks initialBlocks={initialBlocks} />
    </div>
  );
}
