// src/lib/conversation-grouping-service.ts
"use client";

import type { SMSConversation, WhatsAppConversation, SMSMessage, WhatsAppMessage } from './types';
import type { Timestamp } from 'firebase/firestore';

type Platform = 'sms' | 'whatsapp';

export type UnifiedConversation = {
  id: string;
  customerPhone: string;
  customerName?: string;
  contactName?: string;
  contactEmail?: string;
  contactId?: string;
  
  availablePlatforms: Platform[];
  
  smsConversationId?: string;
  whatsappConversationId?: string;
  
  lastMessageAt: Timestamp | null;
  messageCount: number;
  recentMessages: any[];
  isActive: boolean;
  
  clientInfo?: {
    lifetimeValue?: string;
    email?: string;
    company?: string;
    category?: string;
    notes?: string;
  };
  
  partnerId: string;
  createdAt: Timestamp | null;
};

export type UnifiedMessage = (SMSMessage | WhatsAppMessage) & { 
  platform: Platform;
  conversationId: string;
};

export function groupConversationsByPhone(
  conversations: Array<(SMSConversation | WhatsAppConversation) & { 
    platform: Platform; 
    contactName?: string; 
    contactEmail?: string; 
    contactId?: string; 
    clientInfo?: any 
  }>
): UnifiedConversation[] {
  console.log('🔄 Grouping', conversations.length, 'conversations');
  
  const grouped = new Map<string, UnifiedConversation>();

  conversations.forEach(convo => {
    const phone = convo.customerPhone;
    console.log(`📱 Processing ${convo.platform} conversation:`, {
      id: convo.id,
      phone,
      platform: convo.platform,
      messageCount: convo.messageCount
    });
    
    if (!grouped.has(phone)) {
      const unified: UnifiedConversation = {
        id: `unified-${phone}`,
        customerPhone: phone,
        customerName: convo.customerName || convo.contactName,
        contactName: convo.contactName,
        contactEmail: convo.contactEmail,
        contactId: convo.contactId,
        availablePlatforms: [convo.platform],
        lastMessageAt: convo.lastMessageAt || null,
        messageCount: convo.messageCount || 0,
        recentMessages: convo.recentMessages || [],
        isActive: convo.isActive,
        clientInfo: convo.clientInfo,
        partnerId: convo.partnerId,
        createdAt: convo.createdAt || null,
      };
      
      if (convo.platform === 'sms') {
        unified.smsConversationId = convo.id;
      } else {
        unified.whatsappConversationId = convo.id;
      }
      
      console.log(`✨ Created unified conversation for ${phone}:`, unified);
      grouped.set(phone, unified);
    } else {
      const unified = grouped.get(phone)!;
      
      if (!unified.availablePlatforms.includes(convo.platform)) {
        unified.availablePlatforms.push(convo.platform);
        console.log(`➕ Added ${convo.platform} to ${phone}`);
      }
      
      if (convo.platform === 'sms') {
        unified.smsConversationId = convo.id;
      } else {
        unified.whatsappConversationId = convo.id;
      }
      
      const convoTime = convo.lastMessageAt?.toMillis?.() || 0;
      const unifiedTime = unified.lastMessageAt?.toMillis?.() || 0;
      
      if (convoTime > unifiedTime) {
        unified.lastMessageAt = convo.lastMessageAt;
      }
      
      unified.messageCount += convo.messageCount || 0;
      
      unified.recentMessages = [
        ...unified.recentMessages,
        ...(convo.recentMessages || [])
      ].sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      }).slice(0, 5);
      
      if (convo.contactName && !unified.contactName) {
        unified.contactName = convo.contactName;
      }
      if (convo.contactEmail && !unified.contactEmail) {
        unified.contactEmail = convo.contactEmail;
      }
      if (convo.contactId && !unified.contactId) {
        unified.contactId = convo.contactId;
      }
      if (convo.clientInfo) {
        unified.clientInfo = {
          ...unified.clientInfo,
          ...convo.clientInfo
        };
      }
      
      console.log(`🔄 Updated unified conversation for ${phone}:`, {
        platforms: unified.availablePlatforms,
        smsId: unified.smsConversationId,
        whatsappId: unified.whatsappConversationId,
        messageCount: unified.messageCount
      });
    }
  });

  const result = Array.from(grouped.values()).sort((a, b) => {
    const timeA = a.lastMessageAt?.toMillis?.() || 0;
    const timeB = b.lastMessageAt?.toMillis?.() || 0;
    return timeB - timeA;
  });
  
  console.log('✅ Grouped into', result.length, 'unified conversations');
  result.forEach(convo => {
    console.log(`  📞 ${convo.customerPhone}:`, {
      platforms: convo.availablePlatforms,
      smsId: convo.smsConversationId,
      whatsappId: convo.whatsappConversationId,
      messages: convo.messageCount
    });
  });
  
  return result;
}

export function getConversationIdForPlatform(
  unifiedConversation: UnifiedConversation,
  platform: Platform
): string | undefined {
  const id = platform === 'sms' 
    ? unifiedConversation.smsConversationId 
    : unifiedConversation.whatsappConversationId;
  
  console.log(`🔍 Getting ${platform} conversation ID:`, id);
  return id;
}

export function getPreferredPlatform(unifiedConversation: UnifiedConversation): Platform {
  const preferred = unifiedConversation.availablePlatforms.includes('whatsapp') ? 'whatsapp' : 'sms';
  console.log('🎯 Preferred platform:', preferred, 'from', unifiedConversation.availablePlatforms);
  return preferred;
}