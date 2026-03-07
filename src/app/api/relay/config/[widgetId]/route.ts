import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getRelayCORSHeaders, relayOptionsResponse } from '@/lib/relay-cors';
import type { RelayConfig } from '@/lib/types-relay';

// Public-safe fields only
function sanitizeConfig(config: RelayConfig) {
  return {
    widgetId: config.widgetId,
    enabled: config.enabled,
    brandName: config.brandName,
    brandTagline: config.brandTagline,
    brandLogo: config.brandLogo,
    avatarEmoji: config.avatarEmoji,
    avatarInitials: config.avatarInitials,
    theme: config.theme,
    welcomeMessage: config.welcomeMessage,
    intents: config.intents.filter(i => i.enabled),
    responseFormat: config.responseFormat,
    whatsappEnabled: config.whatsappEnabled,
    callbackEnabled: config.callbackEnabled,
    directBookingEnabled: config.directBookingEnabled,
    externalBookingUrl: config.externalBookingUrl,
  };
}

export async function OPTIONS(
  _req: NextRequest,
  { params }: { params: Promise<{ widgetId: string }> }
) {
  const { widgetId } = await params;
  return relayOptionsResponse();
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ widgetId: string }> }
) {
  const { widgetId } = await params;

  try {
    // Find partner config by widgetId
    // We query across all partners — widgetId is unique
    // For production scale, maintain a top-level widgetId→partnerId index
    const partnersSnapshot = await db.collection('partners').limit(200).get();

    let config: RelayConfig | null = null;

    for (const partnerDoc of partnersSnapshot.docs) {
      const configSnapshot = await db
        .collection(`partners/${partnerDoc.id}/relayConfig`)
        .where('widgetId', '==', widgetId)
        .limit(1)
        .get();

      if (!configSnapshot.empty) {
        config = { id: configSnapshot.docs[0].id, ...configSnapshot.docs[0].data() } as RelayConfig;
        break;
      }
    }

    if (!config) {
      return NextResponse.json(
        { error: 'Widget not found' },
        {
          status: 404,
          headers: getRelayCORSHeaders(),
        }
      );
    }

    if (!config.enabled) {
      return NextResponse.json(
        { error: 'Widget is not active' },
        {
          status: 403,
          headers: getRelayCORSHeaders(config.embedDomain),
        }
      );
    }

    return NextResponse.json(sanitizeConfig(config), {
      status: 200,
      headers: {
        ...getRelayCORSHeaders(config.embedDomain),
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json(
      { error: message },
      {
        status: 500,
        headers: getRelayCORSHeaders(),
      }
    );
  }
}
