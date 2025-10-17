
// src/app/api/broadcast/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendSMSAction } from '@/actions/sms-actions';
import { sendWhatsAppMessageAction } from '@/actions/whatsapp-actions';

interface BroadcastRequest {
  method: 'whatsapp' | 'sms';
  numbers: string[];
  message: string;
  ideaId?: string;
  partnerId: string;
  mediaUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { success: false, message: 'Database not configured' },
        { status: 500 }
      );
    }

    const body: BroadcastRequest = await request.json();
    const { method, numbers, message, ideaId, partnerId, mediaUrl } = body;

    // Validate input
    if (!method || !numbers || !message || !partnerId) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!Array.isArray(numbers) || numbers.length === 0) {
      return NextResponse.json(
        { success: false, message: 'At least one phone number is required' },
        { status: 400 }
      );
    }

    // Get idea details if ideaId is provided
    let ideaDetails = null;
    let ideaRef;
    if (ideaId) {
      ideaRef = db.collection(`partners/${partnerId}/tradingPicks`).doc(ideaId);
      const ideaSnap = await ideaRef.get();
      if (ideaSnap.exists) {
        ideaDetails = { id: ideaSnap.id, ...ideaSnap.data() };
      }
    }

    // Get partner details
    const partnerRef = db.collection('partners').doc(partnerId);
    const partnerSnap = await partnerRef.get();
    const partnerData = partnerSnap.exists ? partnerSnap.data() : null;

    // Create broadcast record in the root 'broadcasts' collection
    const broadcastRef = db.collection('broadcasts').doc();
    const broadcastId = broadcastRef.id;

    const broadcastData = {
      id: broadcastId,
      partnerId,
      partnerName: partnerData?.name || 'Unknown Partner',
      method,
      message,
      mediaUrl: mediaUrl || null,
      ideaId: ideaId || null,
      ideaDetails: ideaDetails ? {
        ticker: ideaDetails.ticker,
        companyName: ideaDetails.companyName,
        action: ideaDetails.action,
      } : null,
      recipientCount: numbers.length,
      recipients: numbers,
      status: 'processing',
      successCount: 0,
      failedCount: 0,
      results: [],
      createdAt: FieldValue.serverTimestamp(),
      completedAt: null,
    };

    await broadcastRef.set(broadcastData);

    // Send messages and track results
    const results: Array<{
      phoneNumber: string;
      status: 'success' | 'failed';
      messageSid?: string | null; // Allow null for Firestore
      error?: string;
    }> = [];

    let successCount = 0;
    let failedCount = 0;

    for (const phoneNumber of numbers) {
      try {
        let twilioResponse;

        if (method === 'whatsapp') {
          twilioResponse = await sendWhatsAppMessageAction({
            partnerId,
            to: phoneNumber,
            message: message,
            mediaUrl: mediaUrl || undefined,
          });
        } else {
          twilioResponse = await sendSMSAction({
            partnerId,
            to: phoneNumber,
            message: message,
          });
        }
        
        if (!twilioResponse.success) {
            throw new Error(twilioResponse.message);
        }

        results.push({
          phoneNumber,
          status: 'success',
          messageSid: twilioResponse.twilioSid,
        });
        successCount++;
      } catch (error: any) {
        results.push({
          phoneNumber,
          status: 'failed',
          error: error.message || 'Unknown error',
          messageSid: null, // Ensure messageSid is null, not undefined
        });
        failedCount++;
      }
    }

    // Update the root broadcast record with final results
    await broadcastRef.update({
      status: 'completed',
      successCount,
      failedCount,
      results,
      completedAt: FieldValue.serverTimestamp(),
    });

    // If an ideaId was provided, update the tradingPick document
    if (ideaRef) {
      const historyEntry = {
        timestamp: FieldValue.serverTimestamp(),
        method,
        recipientCount: numbers.length,
        successful: successCount,
        failed: failedCount,
        broadcastId: broadcastId,
      };
      
      await ideaRef.update({
        broadcasted: true,
        lastBroadcastAt: FieldValue.serverTimestamp(),
        broadcastHistory: FieldValue.arrayUnion(historyEntry)
      });
      console.log(`Updated trading pick ${ideaId} with broadcast history.`);
    }

    return NextResponse.json({
      success: true,
      message: `Broadcast completed: ${successCount} sent, ${failedCount} failed`,
      broadcastId,
      successCount,
      failedCount,
      results,
    });

  } catch (error: any) {
    console.error('Broadcast error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to broadcast' },
      { status: 500 }
    );
  }
}
