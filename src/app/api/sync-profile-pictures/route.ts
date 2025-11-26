import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getWhatsAppProfilePicture } from '@/lib/meta-whatsapp-service';

export async function POST(request: NextRequest) {
    try {
        const { partnerId } = await request.json();

        if (!partnerId) {
            return NextResponse.json({ error: 'partnerId required' }, { status: 400 });
        }

        console.log(`🔄 Fetching profile pictures for partner: ${partnerId}`);

        // Get all conversations for this partner
        const conversationsSnapshot = await db
            .collection('metaWhatsAppConversations')
            .where('partnerId', '==', partnerId)
            .get();

        const results = [];
        let successCount = 0;
        let failCount = 0;

        for (const doc of conversationsSnapshot.docs) {
            const conv = doc.data();
            const waId = conv.customerWaId;
            const customerName = conv.customerName || conv.customerPhone;

            // Skip if already has profile picture
            if (conv.customerProfilePicture) {
                results.push({
                    waId,
                    customerName,
                    status: 'skipped',
                    reason: 'Already has profile picture'
                });
                continue;
            }

            try {
                console.log(`📸 Fetching profile picture for ${customerName} (${waId})`);
                const profilePicUrl = await getWhatsAppProfilePicture(partnerId, waId);

                if (profilePicUrl) {
                    // Update conversation with profile picture
                    await doc.ref.update({
                        customerProfilePicture: profilePicUrl,
                        updatedAt: new Date().toISOString()
                    });

                    results.push({
                        waId,
                        customerName,
                        status: 'success',
                        profilePicUrl
                    });
                    successCount++;
                } else {
                    results.push({
                        waId,
                        customerName,
                        status: 'not_found',
                        reason: 'Profile picture not available or private'
                    });
                    failCount++;
                }
            } catch (error: any) {
                console.error(`❌ Error for ${waId}:`, error.message);
                results.push({
                    waId,
                    customerName,
                    status: 'error',
                    error: error.message
                });
                failCount++;
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        return NextResponse.json({
            success: true,
            summary: {
                total: conversationsSnapshot.size,
                successful: successCount,
                failed: failCount,
                skipped: results.filter(r => r.status === 'skipped').length
            },
            results
        });

    } catch (error: any) {
        console.error('❌ Error in sync-profile-pictures:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    return NextResponse.json({
        message: 'Use POST method with { "partnerId": "your-partner-id" } to sync profile pictures'
    });
}
