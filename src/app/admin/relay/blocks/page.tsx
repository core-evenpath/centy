import { getRelayBlockConfigsWithModulesAction } from '@/actions/relay-actions';
import AdminRelayBlocks from './AdminRelayBlocks';

export default async function BlockRegistryPage() {
  const result = await getRelayBlockConfigsWithModulesAction();
  const initialBlocks = result.configs.map(c => ({ id: c.id, status: c.status }));
  return <AdminRelayBlocks initialBlocks={initialBlocks} />;
}
