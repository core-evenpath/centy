import { RelayBlockEditor } from '@/components/admin/relay/RelayBlockEditor';
import { getRelayBlockConfig } from '@/actions/relay-admin-actions';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RelayBlockEditPage({ params }: Props) {
  const { id } = await params;

  if (id === 'new') {
    return (
      <div className="container mx-auto py-8 max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight mb-8">New Relay Block</h1>
        <RelayBlockEditor />
      </div>
    );
  }

  const result = await getRelayBlockConfig(id);
  if (!result.success || !result.config) notFound();

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Edit Relay Block</h1>
      <RelayBlockEditor config={result.config} />
    </div>
  );
}
