import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getRelayCORSHeaders, relayOptionsResponse } from '@/lib/relay-cors';

async function resolveWidgetId(widgetId: string): Promise<{
  partnerId: string;
  config: Record<string, unknown>;
} | null> {
  if (!db) return null;

  try {
    const snapshot = await db
      .collectionGroup('relayConfig')
      .where('widgetId', '==', widgetId)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
      partnerId: data.partnerId as string,
      config: data,
    };
  } catch {
    return null;
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || undefined;
  return relayOptionsResponse(origin);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ widgetId: string }> }
) {
  const { widgetId } = await params;
  const origin = request.headers.get('origin') || undefined;
  const corsHeaders = getRelayCORSHeaders(origin);

  const resolved = await resolveWidgetId(widgetId);
  if (!resolved) {
    return NextResponse.json(
      { error: 'Widget not found' },
      { status: 404, headers: corsHeaders }
    );
  }

  const { config } = resolved;

  // Return public-safe config (strip sensitive internals)
  const publicConfig = {
    widgetId: config.widgetId,
    enabled: config.enabled,
    brandName: config.brandName,
    brandTagline: config.brandTagline,
    brandLogo: config.brandLogo,
    avatarEmoji: config.avatarEmoji,
    avatarInitials: config.avatarInitials,
    welcomeMessage: config.welcomeMessage,
    intents: config.intents,
    theme: config.theme,
    responseFormat: config.responseFormat,
    whatsappEnabled: config.whatsappEnabled,
    callbackEnabled: config.callbackEnabled,
    directBookingEnabled: config.directBookingEnabled,
    externalBookingUrl: config.externalBookingUrl,
  };

  return NextResponse.json(publicConfig, {
    headers: {
      ...corsHeaders,
      'Cache-Control': 'public, max-age=300',
    },
  });
}
