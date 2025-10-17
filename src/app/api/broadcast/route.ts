// src/app/api/broadcast/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendWhatsAppMessageAction } from '@/actions/whatsapp-actions';
import { sendSMSAction } from '@/actions/sms-actions';
import { normalizePhoneNumber } from '@/utils/phone-utils';

interface BroadcastRequestBody {
  method: 'whatsapp' | 'sms';
  numbers: string[];
  message: string;
  ideaId?: string;
  partnerId: string;
  mediaUrl?: string;
}

interface BroadcastResultDetail {
  number: string;
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: BroadcastRequestBody = await request.json();
    const { method, numbers, message, ideaId, partnerId, mediaUrl } = body;

    if (!method || !numbers || !message || !partnerId) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const results: BroadcastResultDetail[] = [];
    
    // Process numbers in parallel
    const sendPromises = numbers.map(async (num) => {
      const normalizedNumber = normalizePhoneNumber(num);
      try {
        let result;
        if (method === 'whatsapp') {
          result = await sendWhatsAppMessageAction({
            partnerId,
            to: normalizedNumber,
            message,
            mediaUrl,
          });
        } else {
          // SMS doesn't support mediaUrl in this implementation
          result = await sendSMSAction({
            partnerId,
            to: normalizedNumber,
            message,
          });
        }
        
        if (result.success) {
          return { number: normalizedNumber, success: true, messageId: result.messageId };
        } else {
          return { number: normalizedNumber, success: false, error: result.message };
        }
      } catch (err: any) {
        return { number: normalizedNumber, success: false, error: err.message };
      }
    });

    const settledResults = await Promise.all(sendPromises);
    results.push(...settledResults);

    const successfulSends = results.filter(r => r.success).length;
    const failedSends = results.filter(r => !r.success).length;

    // If an ideaId is provided, update the trading pick document
    if (ideaId) {
      try {
        const ideaRef = db.collection(`partners/${partnerId}/tradingPicks`).doc(ideaId);
        
        const broadcastEvent = {
          timestamp: FieldValue.serverTimestamp(),
          method,
          recipientCount: numbers.length,
          successful: successfulSends,
          failed: failedSends,
        };

        await ideaRef.update({
          broadcasted: true,
          lastBroadcastAt: FieldValue.serverTimestamp(),
          broadcastHistory: FieldValue.arrayUnion(broadcastEvent),
        });

      } catch (dbError: any) {
        console.error(`Failed to update trading pick ${ideaId}:`, dbError);
        // Don't fail the entire broadcast, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      message: `Broadcast completed. ${successfulSends} successful, ${failedSends} failed.`,
      results: {
        successful: successfulSends,
        failed: failedSends,
        details: results,
      },
    });

  } catch (error: any) {
    console.error('Error in /api/broadcast:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
