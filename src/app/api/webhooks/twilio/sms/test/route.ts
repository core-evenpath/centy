import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  console.log('🧪 TEST ENDPOINT: SMS Webhook Test');
  
  try {
    const body = await request.json();
    const { from, message, partnerId } = body;

    if (!from || !message) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: from, message'
      }, { status: 400 });
    }

    const logs: string[] = [];
    logs.push(`Testing SMS webhook for: ${from}`);
    logs.push(`Partner ID: ${partnerId || 'Not provided'}`);

    const testToNumber = process.env.TWILIO_PHONE_NUMBER || '+1234567890';
    logs.push(`Simulating message TO: ${testToNumber}`);

    const fromPhone = from.startsWith('+') ? from : `+${from}`;
    
    logs.push('Checking phone mappings...');
    const mappingsSnapshot = await db.collection('twilioPhoneMappings').get();
    const mappingCount = mappingsSnapshot.size;
    logs.push(`Found ${mappingCount} phone mappings`);

    if (mappingCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'No phone mappings configured. Incoming messages will fail.',
        logs,
        details: {
          issue: 'missing_mappings',
          solution: 'Run: npm run create-phone-mapping'
        }
      });
    }

    logs.push('Looking up partner for incoming number...');
    let foundPartnerId = partnerId;
    
    if (!foundPartnerId) {
      const toPhoneDigits = testToNumber.replace(/\D/g, '');
      const partnersSnapshot = await db.collection('partners').get();
      
      for (const partnerDoc of partnersSnapshot.docs) {
        const partnerData = partnerDoc.data();
        const storedPhone = partnerData.phone;
        
        if (storedPhone) {
          const storedPhoneDigits = storedPhone.replace(/\D/g, '');
          if (storedPhoneDigits === toPhoneDigits) {
            foundPartnerId = partnerDoc.id;
            logs.push(`Found partner: ${foundPartnerId}`);
            break;
          }
        }
      }
    }

    if (!foundPartnerId) {
      return NextResponse.json({
        success: false,
        message: 'No partner found for Twilio number',
        logs,
        details: {
          issue: 'no_partner_mapping',
          twilioNumber: testToNumber,
          solution: 'Ensure your Twilio number matches a partner phone number in Firestore'
        }
      });
    }

    logs.push('Checking for existing conversation...');
    const conversationsSnapshot = await db
      .collection('smsConversations')
      .where('customerPhone', '==', fromPhone)
      .where('partnerId', '==', foundPartnerId)
      .limit(1)
      .get();

    let conversationId: string;
    
    if (conversationsSnapshot.empty) {
      logs.push('Creating new conversation...');
      const conversationRef = db.collection('smsConversations').doc();
      conversationId = conversationRef.id;

      await conversationRef.set({
        partnerId: foundPartnerId,
        type: 'direct',
        platform: 'sms',
        title: `SMS: ${fromPhone}`,
        customerPhone: fromPhone,
        participants: [],
        isActive: true,
        messageCount: 1,
        createdBy: 'customer',
        createdAt: FieldValue.serverTimestamp(),
        lastMessageAt: FieldValue.serverTimestamp(),
      });
      logs.push(`Created conversation: ${conversationId}`);
    } else {
      conversationId = conversationsSnapshot.docs[0].id;
      logs.push(`Using existing conversation: ${conversationId}`);
      
      await conversationsSnapshot.docs[0].ref.update({
        lastMessageAt: FieldValue.serverTimestamp(),
        messageCount: FieldValue.increment(1),
      });
    }

    logs.push('Creating test message...');
    const messageRef = await db.collection('smsMessages').add({
      conversationId,
      partnerId: foundPartnerId,
      senderId: `customer:${fromPhone}`,
      type: 'text',
      content: `[TEST] ${message}`,
      direction: 'inbound',
      platform: 'sms',
      smsMetadata: {
        twilioSid: `TEST_${Date.now()}`,
        twilioStatus: 'received',
        to: testToNumber,
        from: fromPhone,
      },
      isEdited: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    logs.push(`Message created: ${messageRef.id}`);

    return NextResponse.json({
      success: true,
      message: 'Test message processed successfully!',
      logs,
      details: {
        conversationId,
        messageId: messageRef.id,
        partnerId: foundPartnerId,
        from: fromPhone,
        to: testToNumber
      }
    });

  } catch (error: any) {
    console.error('Test error:', error);
    return NextResponse.json({
      success: false,
      message: error.message,
      logs: [error.stack]
    }, { status: 500 });
  }
}