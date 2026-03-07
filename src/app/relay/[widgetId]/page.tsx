import type { Metadata } from 'next';
import Script from 'next/script';

interface Props {
  params: Promise<{ widgetId: string }>;
}

async function getWidgetConfig(widgetId: string) {
  try {
    // Server-side config fetch for metadata
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.centy.dev';
    const res = await fetch(`${baseUrl}/api/relay/config/${widgetId}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { widgetId } = await params;
  const config = await getWidgetConfig(widgetId);

  if (!config) {
    return {
      title: 'Relay | Powered by Pingbox',
    };
  }

  return {
    title: `${config.brandName} | Relay`,
    description: config.brandTagline || `Chat with ${config.brandName}`,
    openGraph: {
      title: `${config.brandName} | Relay`,
      description: config.brandTagline || `Chat with ${config.brandName}`,
    },
  };
}

export default async function RelayStandalonePage({ params }: Props) {
  const { widgetId } = await params;
  const config = await getWidgetConfig(widgetId);

  const accentColor = config?.theme?.accentColor || '#4F46E5';
  const bgColor = config?.theme?.backgroundColor || '#ffffff';
  const brandName = config?.brandName || 'Relay';

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: ${bgColor};
            height: 100dvh;
            overflow: hidden;
          }
          pingbox-relay {
            display: block;
            width: 100%;
            height: 100dvh;
          }
        `}</style>
      </head>
      <body>
        {!config ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            gap: '12px',
            color: '#6b7280',
            fontFamily: 'system-ui',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
            }}>⚡</div>
            <p style={{ fontSize: '14px' }}>Widget not found or not active</p>
          </div>
        ) : (
          <>
            <pingbox-relay
              id={widgetId}
              data-standalone="true"
              style={{ display: 'block', width: '100%', height: '100dvh' }}
            />
            <Script src="/relay/widget.js" strategy="afterInteractive" />
          </>
        )}
      </body>
    </html>
  );
}
