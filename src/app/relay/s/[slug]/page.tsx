import { Metadata } from 'next';
import { getRelayPartnerBySlug } from '@/actions/relay-partner-actions';
import RelayFullPage from '@/components/relay/RelayFullPage';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getRelayPartnerBySlug(slug);

  if (!result) {
    return { title: 'Not Found — Pingbox' };
  }

  return {
    title: result.relayConfig.brandName || 'Chat',
    description: result.relayConfig.tagline || 'Start a conversation',
  };
}

export default async function RelaySubdomainPage({ params }: PageProps) {
  const { slug } = await params;
  const result = await getRelayPartnerBySlug(slug);

  if (!result || !result.relayConfig.enabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="text-center space-y-4 px-6">
          <div className="text-4xl mb-2">💬</div>
          <h1 className="text-xl font-semibold text-gray-900">
            This relay link doesn&apos;t exist.
          </h1>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            The business may have changed their link or it was typed incorrectly.
          </p>
          <a
            href="https://pingbox.io"
            className="inline-block mt-4 px-6 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            Visit pingbox.io
          </a>
        </div>
      </div>
    );
  }

  return <RelayFullPage partnerId={result.partnerId} config={result.relayConfig} />;
}
