import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET() {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    checks: [],
    issues: [],
    recommendations: []
  };

  try {
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    diagnostics.checks.push({
      name: 'Environment Variables',
      status: !!(twilioPhone && accountSid && authToken) ? 'OK' : 'FAILED',
      details: {
        TWILIO_PHONE_NUMBER: twilioPhone ? `${twilioPhone.substring(0, 6)}...` : 'MISSING',
        TWILIO_ACCOUNT_SID: accountSid ? 'Present' : 'MISSING',
        TWILIO_AUTH_TOKEN: authToken ? 'Present' : 'MISSING'
      }
    });

    if (!db) {
      diagnostics.checks.push({
        name: 'Database Connection',
        status: 'FAILED',
        details: 'Firebase Admin not initialized'
      });
      return NextResponse.json(diagnostics);
    }

    diagnostics.checks.push({
      name: 'Database Connection',
      status: 'OK',
      details: 'Firebase Admin initialized'
    });

    const partnersSnapshot = await db.collection('partners').get();
    const partnersWithPhone = partnersSnapshot.docs.filter(doc => doc.data().phone);

    diagnostics.checks.push({
      name: 'Partner Phone Mappings',
      status: partnersWithPhone.length > 0 ? 'OK' : 'FAILED',
      details: {
        totalPartners: partnersSnapshot.size,
        partnersWithPhone: partnersWithPhone.length,
        partners: partnersWithPhone.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          phone: doc.data().phone
        }))
      }
    });

    if (partnersWithPhone.length === 0) {
      diagnostics.issues.push({
        severity: 'CRITICAL',
        issue: 'No partners have a phone field',
        solution: `Add "phone" field to a partner document with value: ${twilioPhone}`,
        steps: [
          'Go to Firebase Console → Firestore',
          'Select partners collection',
          'Choose a partner document',
          `Add field: phone = ${twilioPhone}`,
          'Save the document'
        ]
      });
    } else {
      const matchingPartner = partnersWithPhone.find(doc => {
        const partnerPhone = doc.data().phone?.replace(/\D/g, '');
        const twilioDigits = twilioPhone?.replace(/\D/g, '');
        return partnerPhone === twilioDigits;
      });

      if (!matchingPartner) {
        diagnostics.issues.push({
          severity: 'CRITICAL',
          issue: `No partner phone matches Twilio number ${twilioPhone}`,
          solution: 'Update a partner document phone field to match Twilio number',
          existingPhones: partnersWithPhone.map(doc => doc.data().phone)
        });
      } else {
        diagnostics.checks.push({
          name: 'Partner-Twilio Phone Match',
          status: 'OK',
          details: {
            partnerId: matchingPartner.id,
            partnerName: matchingPartner.data().name,
            phone: matchingPartner.data().phone
          }
        });
      }
    }

    const webhookLogsSnapshot = await db
      .collection('webhookLogs')
      .where('platform', '==', 'sms')
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();

    diagnostics.checks.push({
      name: 'Webhook Logs',
      status: webhookLogsSnapshot.size > 0 ? 'OK' : 'WARNING',
      details: {
        count: webhookLogsSnapshot.size,
        message: webhookLogsSnapshot.size === 0
          ? 'No webhook calls received - Twilio may not be configured to call this endpoint'
          : `Found ${webhookLogsSnapshot.size} recent webhook calls`,
        recentLogs: webhookLogsSnapshot.docs.slice(0, 3).map(doc => ({
          success: doc.data().success,
          from: doc.data().from,
          to: doc.data().to,
          timestamp: doc.data().timestamp?.toDate?.()?.toISOString()
        }))
      }
    });

    if (webhookLogsSnapshot.size === 0) {
      diagnostics.issues.push({
        severity: 'CRITICAL',
        issue: 'No webhook logs found - Twilio is NOT calling your webhook',
        solution: 'Configure webhook URL in Twilio Console',
        steps: [
          'Go to https://console.twilio.com/us1/develop/phone-numbers/manage/incoming',
          'Click on your SMS phone number',
          'Scroll to "Messaging Configuration"',
          'Under "A MESSAGE COMES IN":',
          '  - Select "Webhook"',
          '  - Method: POST',
          '  - URL: https://www.centy.dev/api/webhooks/twilio/sms',
          'Click Save',
          'Send a test SMS to verify'
        ]
      });
    }

    const conversationsSnapshot = await db
      .collection('smsConversations')
      .orderBy('lastMessageAt', 'desc')
      .limit(5)
      .get();

    diagnostics.checks.push({
      name: 'SMS Conversations',
      status: conversationsSnapshot.size > 0 ? 'OK' : 'WARNING',
      details: {
        count: conversationsSnapshot.size,
        conversations: conversationsSnapshot.docs.map(doc => ({
          id: doc.id,
          customerPhone: doc.data().customerPhone,
          messageCount: doc.data().messageCount,
          lastMessageAt: doc.data().lastMessageAt?.toDate?.()?.toISOString()
        }))
      }
    });

    const messagesSnapshot = await db
      .collection('smsMessages')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const inboundMessages = messagesSnapshot.docs.filter(doc => doc.data().direction === 'inbound');

    diagnostics.checks.push({
      name: 'SMS Messages',
      status: 'INFO',
      details: {
        total: messagesSnapshot.size,
        inbound: inboundMessages.length,
        outbound: messagesSnapshot.size - inboundMessages.length,
        recentMessages: messagesSnapshot.docs.slice(0, 3).map(doc => ({
          direction: doc.data().direction,
          content: doc.data().content?.substring(0, 30),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString()
        }))
      }
    });

    if (inboundMessages.length === 0 && messagesSnapshot.size > 0) {
      diagnostics.issues.push({
        severity: 'HIGH',
        issue: 'No inbound SMS messages found (only outbound)',
        solution: 'This confirms Twilio is not calling your webhook for incoming messages'
      });
    }

    const overallStatus = diagnostics.issues.filter((i: any) => i.severity === 'CRITICAL').length === 0;

    diagnostics.summary = {
      status: overallStatus ? 'OK' : 'ISSUES_FOUND',
      criticalIssues: diagnostics.issues.filter((i: any) => i.severity === 'CRITICAL').length,
      warnings: diagnostics.issues.filter((i: any) => i.severity === 'WARNING').length,
      recommendation: overallStatus
        ? 'System is configured correctly. If issues persist, check Twilio Console → Monitor → Logs → Errors'
        : 'Critical issues found. Follow the solutions provided above.'
    };

    if (!overallStatus) {
      diagnostics.recommendations.push(
        'Step 1: Fix all CRITICAL issues listed above',
        'Step 2: Send a test SMS to your Twilio number',
        'Step 3: Run this diagnostic again to verify',
        'Step 4: Check webhook logs'
      );
    }

  } catch (error: any) {
    diagnostics.checks.push({
      name: 'Error',
      status: 'FAILED',
      details: {
        error: error.message,
        stack: error.stack
      }
    });
  }

  return NextResponse.json(diagnostics, { status: 200 });
}