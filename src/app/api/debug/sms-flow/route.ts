import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const partnerId = searchParams.get('partnerId');
  const customerPhone = searchParams.get('customerPhone');

  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    checks: [],
    rawError: null
  };

  try {
    diagnostics.checks.push({
      name: 'API Endpoint',
      status: 'OK',
      details: { message: 'Debug endpoint is reachable' }
    });

    diagnostics.checks.push({
      name: 'Input Parameters',
      status: 'INFO',
      details: { partnerId, customerPhone }
    });

    if (!db) {
      diagnostics.checks.push({
        name: 'Database Connection',
        status: 'FAILED',
        message: 'Firebase Admin SDK not initialized',
        details: { error: 'db is null or undefined' }
      });
      return NextResponse.json(diagnostics);
    }

    diagnostics.checks.push({
      name: 'Database Connection',
      status: 'OK',
      message: 'Firebase Admin initialized successfully'
    });

    let partnersSnapshot;
    try {
      partnersSnapshot = await db.collection('partners').get();
      diagnostics.checks.push({
        name: 'Partners Collection',
        status: partnersSnapshot.empty ? 'WARNING' : 'OK',
        count: partnersSnapshot.size,
        message: partnersSnapshot.empty ? 'No partners found' : `Found ${partnersSnapshot.size} partner(s)`,
        partners: partnersSnapshot.docs.map(doc => ({
          id: doc.id,
          phone: doc.data().phone || null,
          whatsAppPhone: doc.data().whatsAppPhone || null,
          name: doc.data().name || 'Unnamed'
        }))
      });
    } catch (error: any) {
      diagnostics.checks.push({
        name: 'Partners Collection',
        status: 'FAILED',
        message: 'Failed to query partners collection',
        details: { error: error.message }
      });
    }

    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
    diagnostics.checks.push({
      name: 'Twilio Phone Number (ENV)',
      status: twilioPhone ? 'OK' : 'WARNING',
      value: twilioPhone || 'NOT SET',
      message: twilioPhone ? `Configured: ${twilioPhone}` : 'TWILIO_PHONE_NUMBER environment variable not set'
    });

    if (twilioPhone && partnersSnapshot && !partnersSnapshot.empty) {
      const twilioPhoneDigits = twilioPhone.replace(/\D/g, '');
      let foundPartner = null;

      for (const partnerDoc of partnersSnapshot.docs) {
        const partnerData = partnerDoc.data();
        const storedPhone = partnerData.phone;

        if (storedPhone) {
          const storedPhoneDigits = storedPhone.replace(/\D/g, '');
          if (storedPhoneDigits === twilioPhoneDigits) {
            foundPartner = {
              id: partnerDoc.id,
              phone: storedPhone,
              name: partnerData.name
            };
            break;
          }
        }
      }

      diagnostics.checks.push({
        name: 'Phone Number Mapping',
        status: foundPartner ? 'OK' : 'FAILED',
        twilioPhone: twilioPhone,
        twilioPhoneDigits: twilioPhoneDigits,
        foundPartner: foundPartner,
        message: foundPartner 
          ? `✅ Found partner: ${foundPartner.name} (${foundPartner.id})`
          : `❌ No partner found with phone matching ${twilioPhone}. Add "phone" field to your partner document with value: ${twilioPhone}`
      });
    }

    if (partnerId && customerPhone) {
      try {
        const conversationsSnapshot = await db
          .collection('smsConversations')
          .where('customerPhone', '==', customerPhone)
          .where('partnerId', '==', partnerId)
          .get();

        diagnostics.checks.push({
          name: 'SMS Conversations',
          status: conversationsSnapshot.empty ? 'WARNING' : 'OK',
          count: conversationsSnapshot.size,
          message: conversationsSnapshot.empty 
            ? 'No conversations found for this customer/partner combination'
            : `Found ${conversationsSnapshot.size} conversation(s)`,
          conversations: conversationsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              partnerId: data.partnerId,
              customerPhone: data.customerPhone,
              messageCount: data.messageCount,
              platform: data.platform,
              createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
              lastMessageAt: data.lastMessageAt?.toDate?.()?.toISOString() || null
            };
          })
        });

        if (!conversationsSnapshot.empty) {
          const conversationId = conversationsSnapshot.docs[0].id;
          
          try {
            const messagesSnapshot = await db
              .collection('smsMessages')
              .where('conversationId', '==', conversationId)
              .orderBy('createdAt', 'desc')
              .limit(10)
              .get();

            diagnostics.checks.push({
              name: 'SMS Messages',
              status: messagesSnapshot.empty ? 'WARNING' : 'OK',
              count: messagesSnapshot.size,
              message: messagesSnapshot.empty
                ? 'No messages found in this conversation'
                : `Found ${messagesSnapshot.size} message(s)`,
              messages: messagesSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                  id: doc.id,
                  content: data.content || '',
                  direction: data.direction,
                  platform: data.platform,
                  createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
                  twilioSid: data.smsMetadata?.twilioSid || null
                };
              })
            });
          } catch (error: any) {
            diagnostics.checks.push({
              name: 'SMS Messages',
              status: 'FAILED',
              message: 'Failed to query messages',
              details: { error: error.message }
            });
          }
        }
      } catch (error: any) {
        diagnostics.checks.push({
          name: 'SMS Conversations',
          status: 'FAILED',
          message: 'Failed to query conversations',
          details: { error: error.message }
        });
      }
    }

    try {
      const recentWebhookLogs = await db
        .collection('webhookLogs')
        .where('platform', '==', 'sms')
        .orderBy('timestamp', 'desc')
        .limit(5)
        .get();

      diagnostics.checks.push({
        name: 'Recent SMS Webhook Logs',
        status: recentWebhookLogs.empty ? 'WARNING' : 'OK',
        count: recentWebhookLogs.size,
        message: recentWebhookLogs.empty
          ? 'No webhook logs found - webhooks may not be configured or no messages received yet'
          : `Found ${recentWebhookLogs.size} recent webhook call(s)`,
        logs: recentWebhookLogs.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            success: data.success,
            error: data.error || null,
            from: data.from || null,
            to: data.to || null,
            body: data.body || null,
            timestamp: data.timestamp?.toDate?.()?.toISOString() || null
          };
        })
      });
    } catch (error: any) {
      diagnostics.checks.push({
        name: 'Recent SMS Webhook Logs',
        status: 'FAILED',
        message: 'Failed to query webhook logs',
        details: { error: error.message }
      });
    }

    return NextResponse.json(diagnostics);

  } catch (error: any) {
    console.error('Debug API Error:', error);
    diagnostics.rawError = {
      message: error.message,
      stack: error.stack
    };
    diagnostics.checks.push({
      name: 'Critical Error',
      status: 'FAILED',
      message: error.message,
      details: { stack: error.stack }
    });
    return NextResponse.json(diagnostics, { status: 500 });
  }
}