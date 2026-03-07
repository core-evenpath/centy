import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getRelayCORSHeaders, relayOptionsResponse } from '@/lib/relay-cors';
import { calculateLeadScore } from '@/lib/relay-ai';
import type { RelayConversation } from '@/lib/types-relay';
import { FieldValue } from 'firebase-admin/firestore';

export async function OPTIONS() {
  return relayOptionsResponse();
}

interface LeadRequest {
  widgetId: string;
  conversationId: string;
  name?: string;
  contact?: string;
  contactType?: 'whatsapp' | 'phone' | 'email';
  conversionType: 'direct_book' | 'whatsapp' | 'callback' | 'save_quote' | 'share';
}

async function findPartnerByWidgetId(widgetId: string): Promise<string | null> {
  const partnersSnapshot = await db.collection('partners').limit(200).get();

  for (const partnerDoc of partnersSnapshot.docs) {
    const configSnapshot = await db
      .collection(`partners/${partnerDoc.id}/relayConfig`)
      .where('widgetId', '==', widgetId)
      .limit(1)
      .get();

    if (!configSnapshot.empty) return partnerDoc.id;
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body: LeadRequest = await req.json();
    const { widgetId, conversationId, name, contact, contactType, conversionType } = body;

    if (!widgetId || !conversationId || !conversionType) {
      return NextResponse.json(
        { error: 'widgetId, conversationId, and conversionType are required' },
        { status: 400, headers: getRelayCORSHeaders() }
      );
    }

    const partnerId = await findPartnerByWidgetId(widgetId);
    if (!partnerId) {
      return NextResponse.json(
        { error: 'Widget not found' },
        { status: 404, headers: getRelayCORSHeaders() }
      );
    }

    const convRef = db
      .collection(`partners/${partnerId}/relayConversations`)
      .doc(conversationId);

    const convDoc = await convRef.get();
    if (!convDoc.exists) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404, headers: getRelayCORSHeaders() }
      );
    }

    const existingData = convDoc.data() as RelayConversation;
    const now = new Date().toISOString();

    const updates: Partial<RelayConversation> = {
      status: 'converted',
      conversionType,
      convertedAt: now,
      lastMessageAt: now,
    };

    if (name) updates.visitorName = name;
    if (contact) updates.visitorContact = contact;
    if (contactType) updates.visitorContactType = contactType;

    updates.leadScore = calculateLeadScore({ ...existingData, ...updates } as RelayConversation);

    await convRef.update(updates);

    // Update partner analytics
    try {
      const configSnapshot = await db
        .collection(`partners/${partnerId}/relayConfig`)
        .limit(1)
        .get();

      if (!configSnapshot.empty) {
        await configSnapshot.docs[0].ref.update({
          totalLeads: FieldValue.increment(1),
        });
      }
    } catch {
      // Non-critical
    }

    return NextResponse.json(
      { success: true },
      { status: 200, headers: getRelayCORSHeaders() }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal error';
    console.error('[Relay Lead API]', message);
    return NextResponse.json(
      { error: message },
      { status: 500, headers: getRelayCORSHeaders() }
    );
  }
}
