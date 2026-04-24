import { db as adminDb } from '@/lib/firebase-admin';
import AdminRelayBlocks from './AdminRelayBlocks';

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

  return <AdminRelayBlocks initialBlocks={initialBlocks} />;
}
