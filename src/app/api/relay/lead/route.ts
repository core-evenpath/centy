import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getRelayCORSHeaders, relayOptionsResponse } from '@/lib/relay-cors';
import { calculateLeadScore } from '@/lib/relay-ai';
import { resolveWidgetId } from '@/actions/relay-partner-actions';
import type { RelayConversation } from '@/lib/types-relay';

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || undefined;
  return relayOptionsResponse(origin);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin') || undefined;
  const corsHeaders = getRelayCORSHeaders(origin);

  try {
    const body = await request.json();
    const { widgetId, conversationId, name, contact, contactType, conversionType } = body as {
      widgetId: string;
      conversationId: string;
      name?: string;
      contact?: string;
      contactType?: 'whatsapp' | 'phone' | 'email';
      conversionType?: 'direct_book' | 'whatsapp' | 'callback' | 'save_quote' | 'share';
    };

    if (!widgetId || !conversationId) {
      return NextResponse.json(
        { error: 'widgetId and conversationId are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const resolved = await resolveWidgetId(widgetId);
    if (!resolved) {
      return NextResponse.json(
        { error: 'Widget not found' },
        { status: 404, headers: corsHeaders }
      );
    }
    const { partnerId } = resolved;

    if (!db) {
      return NextResponse.json({ success: true }, { headers: corsHeaders });
    }

    const now = new Date().toISOString();

    const updates: Partial<RelayConversation> & Record<string, unknown> = {
      updatedAt: now,
    };

    if (name) updates.visitorName = name;
    if (contact) updates.visitorContact = contact;
    if (contactType) updates.visitorContactType = contactType;
    if (conversionType) {
      updates.conversionType = conversionType;
      updates.convertedAt = now;
      updates.status = 'converted';
    }

    await db
      .collection(`partners/${partnerId}/relayConversations`)
      .doc(conversationId)
      .update(updates);

    // Recalculate lead score
    const convDoc = await db
      .collection(`partners/${partnerId}/relayConversations`)
      .doc(conversationId)
      .get();

    if (convDoc.exists) {
      const convData = { id: convDoc.id, ...convDoc.data() } as RelayConversation;
      const newScore = calculateLeadScore({ ...convData, ...updates } as RelayConversation);
      await convDoc.ref.update({ leadScore: newScore });
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error('Relay lead error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
