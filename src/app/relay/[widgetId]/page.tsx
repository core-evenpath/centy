import { Metadata } from 'next';
import { db } from '@/lib/firebase-admin';
import Script from 'next/script';

interface Props {
  params: Promise<{ widgetId: string }>;
}

async function getWidgetConfig(widgetId: string) {
  if (!db) return null;

  try {
    const snapshot = await db
      .collectionGroup('relayConfig')
      .where('widgetId', '==', widgetId)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return snapshot.docs[0].data();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { widgetId } = await params;
  const config = await getWidgetConfig(widgetId);

  if (!config) {
    return { title: 'Chat Widget' };
  }

  return {
    title: config.brandName ? `Chat with ${config.brandName}` : 'Chat Widget',
    description: config.brandTagline || `Ask questions and get instant answers from ${config.brandName || 'us'}.`,
    robots: { index: false, follow: false },
  };
}

export default async function StandaloneRelayPage({ params }: Props) {
  const { widgetId } = await params;
  const config = await getWidgetConfig(widgetId);

  if (!config || !config.enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8">
          <p className="text-gray-500">This widget is not available.</p>
        </div>
      </div>
    );
  }

  const accent = (config.theme as Record<string, string>)?.accentColor || '#4F46E5';
  const brandName = config.brandName as string || 'Chat';
  const tagline = config.brandTagline as string || '';
  const avatar = config.avatarEmoji as string || '🤖';

  return (
    <>
      <div
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ background: `linear-gradient(135deg, ${accent}15 0%, #f9fafb 100%)` }}
      >
        {/* Brand header */}
        <div className="text-center mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-4xl mx-auto mb-3 shadow-lg"
            style={{ background: accent }}
          >
            {avatar}
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">{brandName}</h1>
          {tagline && <p className="text-sm text-gray-500">{tagline}</p>}
        </div>

        {/* Embedded chat */}
        <div
          className="w-full rounded-2xl overflow-hidden shadow-2xl"
          style={{ maxWidth: '420px', height: '600px' }}
        >
          {/* @ts-expect-error custom element */}
          <pingbox-relay
            id={widgetId}
            style={{ display: 'block', width: '100%', height: '100%' }}
          />
        </div>

        <p className="mt-4 text-xs text-gray-300">
          Powered by{' '}
          <a href="https://pingbox.io" className="text-gray-300 hover:text-gray-500" target="_blank" rel="noopener">
            Pingbox
          </a>
        </p>
      </div>

      <Script src="/relay/widget.js" strategy="afterInteractive" />
    </>
  );
}
