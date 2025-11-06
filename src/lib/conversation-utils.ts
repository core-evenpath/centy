// src/lib/conversation-utils.ts

type Platform = 'sms' | 'whatsapp';

interface RawConversation {
  id: string;
  platform: Platform;
  customerPhone: string;
  customerName?: string;
  contactName?: string;
  contactEmail?: string;
  contactId?: string;
  lastMessageAt: any;
  messageCount: number;
  isActive: boolean;
  partnerId: string;
  createdAt: any;
  clientInfo?: any;
  isPinned?: boolean;
}

interface UnifiedConversation {
  id: string;
  customerPhone: string;
  customerName?: string;
  contactName?: string;
  contactEmail?: string;
  contactId?: string;
  lastMessageAt: any;
  messageCount: number;
  isActive: boolean;
  partnerId: string;
  createdAt: any;
  clientInfo?: any;
  availablePlatforms: Platform[];
  smsConversationId?: string;
  whatsappConversationId?: string;
  platform: Platform;
  isPinned: boolean;
}

export function groupConversationsByPhone(conversations: RawConversation[]): UnifiedConversation[] {
  const grouped = new Map<string, UnifiedConversation>();

  conversations.forEach((convo) => {
    const phone = convo.customerPhone;
    
    if (!grouped.has(phone)) {
      grouped.set(phone, {
        id: convo.id,
        customerPhone: convo.customerPhone,
        customerName: convo.customerName,
        contactName: convo.contactName,
        contactEmail: convo.contactEmail,
        contactId: convo.contactId,
        lastMessageAt: convo.lastMessageAt,
        messageCount: convo.messageCount,
        isActive: convo.isActive,
        partnerId: convo.partnerId,
        createdAt: convo.createdAt,
        clientInfo: convo.clientInfo,
        availablePlatforms: [convo.platform],
        platform: convo.platform,
        isPinned: convo.isPinned || false,
        [`${convo.platform}ConversationId`]: convo.id,
      });
    } else {
      const existing = grouped.get(phone)!;
      
      if (!existing.availablePlatforms.includes(convo.platform)) {
        existing.availablePlatforms.push(convo.platform);
      }
      
      existing[`${convo.platform}ConversationId`] = convo.id;
      
      existing.messageCount += convo.messageCount;
      
      const existingTime = existing.lastMessageAt?.toMillis?.() || 0;
      const newTime = convo.lastMessageAt?.toMillis?.() || 0;
      if (newTime > existingTime) {
        existing.lastMessageAt = convo.lastMessageAt;
      }
      
      if (convo.isPinned) {
        existing.isPinned = true;
      }
      
      if (convo.contactName && !existing.contactName) {
        existing.contactName = convo.contactName;
        existing.contactEmail = convo.contactEmail;
        existing.contactId = convo.contactId;
      }
    }
  });

  const result = Array.from(grouped.values());
  
  result.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    const timeA = a.lastMessageAt?.toMillis?.() || 0;
    const timeB = b.lastMessageAt?.toMillis?.() || 0;
    return timeB - timeA;
  });

  return result;
}