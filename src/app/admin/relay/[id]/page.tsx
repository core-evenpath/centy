import { notFound } from 'next/navigation';
import { getRelayBlockConfig } from '@/actions/relay-block-actions';
import { RelayBlockEditor } from '@/components/admin/relay/RelayBlockEditor';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminRelayBlockEditPage({ params }: Props) {
  const { id } = await params;
  const result = await getRelayBlockConfig(id);

  if (!result.success || !result.config) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <RelayBlockEditor config={result.config} />
    </div>
  );
}
