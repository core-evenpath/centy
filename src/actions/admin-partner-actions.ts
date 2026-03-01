'use server';

import { db } from '@/lib/firebase-admin';
import type { AdminPartnerStats } from '@/lib/types';

export async function getAdminPartnerStatsAction(partnerId: string): Promise<{
  success: boolean;
  data?: AdminPartnerStats;
  error?: string;
}> {
  if (!db) {
    return { success: false, error: 'Database not available' };
  }

  try {
    const partnerDoc = await db.collection('partners').doc(partnerId).get();
    if (!partnerDoc.exists) {
      return { success: false, error: 'Partner not found' };
    }

    const partnerData = partnerDoc.data()!;

    const whatsappConfig = partnerData.metaWhatsAppConfig;
    const whatsappChannel: AdminPartnerStats['channels']['whatsapp'] = whatsappConfig
      ? {
          connected: whatsappConfig.status === 'active' || whatsappConfig.status === 'pending_billing',
          status: whatsappConfig.status || 'not_connected',
          phoneNumber: whatsappConfig.displayPhoneNumber,
          wabaId: whatsappConfig.wabaId,
          qualityRating: whatsappConfig.qualityRating,
          lastVerifiedAt: whatsappConfig.lastVerifiedAt,
        }
      : { connected: false, status: 'not_connected' };

    const telegramConfig = partnerData.telegramConfig;
    const telegramChannel: AdminPartnerStats['channels']['telegram'] = telegramConfig
      ? {
          connected: !!telegramConfig.isConnected,
          botUsername: telegramConfig.botUsername,
        }
      : { connected: false };

    const [
      waConversationsSnapshot,
      telegramConversationsSnapshot,
      contactsSnapshot,
      hubDocumentsSnapshot,
      activeAgentsSnapshot,
      teamMembersSnapshot,
    ] = await Promise.all([
      db.collection('metaWhatsAppConversations').where('partnerId', '==', partnerId).get(),
      db.collection('telegramConversations').where('partnerId', '==', partnerId).get(),
      db.collection('partners').doc(partnerId).collection('contacts').get(),
      db.collection('partners').doc(partnerId).collection('hubDocuments').get(),
      db.collection('partners').doc(partnerId).collection('hubAgents').where('isActive', '==', true).get(),
      db.collection('teamMembers').where('partnerId', '==', partnerId).get(),
    ]);

    let totalMessages = 0;
    waConversationsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      totalMessages += data.messageCount || 0;
    });
    telegramConversationsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      totalMessages += data.messageCount || 0;
    });

    const totalConversations = waConversationsSnapshot.size + telegramConversationsSnapshot.size;

    let adminCount = 0;
    teamMembersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.role === 'partner_admin') {
        adminCount++;
      }
    });

    const stats: AdminPartnerStats = {
      channels: {
        whatsapp: whatsappChannel,
        telegram: telegramChannel,
      },
      messaging: {
        totalConversations,
        totalMessages,
        activeContactsCount: contactsSnapshot.size,
      },
      ai: {
        totalDocuments: hubDocumentsSnapshot.size,
        activeAgents: activeAgentsSnapshot.size,
        personaCompleteness: partnerData.aiProfileCompleteness || 0,
      },
      team: {
        totalMembers: teamMembersSnapshot.size,
        adminCount,
      },
    };

    return { success: true, data: stats };
  } catch (error: any) {
    console.error('Error fetching admin partner stats:', error);
    return { success: false, error: error.message };
  }
}
