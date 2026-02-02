'use client';

import { useMemo } from 'react';
import { useEnrichedMetaConversations, EnrichedMetaConversation } from '@/hooks/useEnrichedMetaConversations';
import { useTelegramConversations } from '@/hooks/useTelegram';
import { useContacts } from '@/hooks/useContacts';
import type { TelegramConversation } from '@/lib/types-telegram';
import type { Contact } from '@/lib/types';

export type Platform = 'meta_whatsapp' | 'telegram';

export interface UnifiedConversation {
    id: string;
    partnerId: string;
    platform: Platform;
    customerIdentifier: string;
    customerName?: string;
    customerUsername?: string;
    title: string;
    isActive: boolean;
    messageCount: number;
    unreadCount: number;
    lastMessageAt: any;
    lastMessagePreview?: string;
    createdAt: any;
    updatedAt?: any;
    contactId?: string;
    contact?: Contact;
    contactName?: string;
    contactEmail?: string;
    contactCompany?: string;
    contactTags?: string[];
    tags?: string[];
    assignedAssistantIds?: string[];
    whatsAppData?: EnrichedMetaConversation;
    telegramData?: TelegramConversation;
}

export function useUnifiedConversations(partnerId?: string) {
    const {
        conversations: whatsAppConversations,
        loading: whatsAppLoading,
        markAsRead: markWhatsAppAsRead,
    } = useEnrichedMetaConversations(partnerId);

    const {
        conversations: telegramConversations,
        loading: telegramLoading,
        markAsRead: markTelegramAsRead,
    } = useTelegramConversations(partnerId);

    const { contacts, loading: contactsLoading } = useContacts(partnerId);

    const unifiedConversations = useMemo(() => {
        const unified: UnifiedConversation[] = [];

        whatsAppConversations.forEach((conv) => {
            unified.push({
                id: conv.id,
                partnerId: conv.partnerId,
                platform: 'meta_whatsapp',
                customerIdentifier: conv.customerPhone,
                customerName: conv.customerName,
                title: conv.contactName || conv.customerName || conv.customerPhone,
                isActive: conv.isActive,
                messageCount: conv.messageCount,
                unreadCount: conv.unreadCount,
                lastMessageAt: conv.lastMessageAt,
                lastMessagePreview: conv.lastMessagePreview,
                createdAt: conv.createdAt,
                updatedAt: conv.updatedAt,
                contactId: conv.contactId,
                contact: conv.contact,
                contactName: conv.contactName,
                contactEmail: conv.contactEmail,
                contactCompany: conv.contactCompany,
                contactTags: conv.contactTags,
                tags: conv.tags,
                assignedAssistantIds: conv.assignedAssistantIds,
                whatsAppData: conv,
            });
        });

        telegramConversations.forEach((conv) => {
            const contact = contacts.find((c) => {
                if (conv.contactId && c.id === conv.contactId) return true;
                if ((c as any).telegramId && (c as any).telegramId === conv.customerTelegramId.toString()) return true;
                if ((c as any).telegramUsername && conv.customerUsername) {
                    return (c as any).telegramUsername.toLowerCase() === conv.customerUsername.toLowerCase();
                }
                return false;
            });

            const displayName = contact?.name
                || (conv.customerFirstName
                    ? `${conv.customerFirstName} ${conv.customerLastName || ''}`.trim()
                    : conv.customerUsername
                        ? `@${conv.customerUsername}`
                        : `Telegram: ${conv.chatId}`);

            unified.push({
                id: conv.id,
                partnerId: conv.partnerId,
                platform: 'telegram',
                customerIdentifier: conv.chatId.toString(),
                customerName: conv.customerFirstName,
                customerUsername: conv.customerUsername,
                title: displayName,
                isActive: conv.isActive,
                messageCount: conv.messageCount,
                unreadCount: conv.unreadCount,
                lastMessageAt: conv.lastMessageAt,
                lastMessagePreview: conv.lastMessagePreview,
                createdAt: conv.createdAt,
                updatedAt: conv.updatedAt,
                contactId: conv.contactId || contact?.id,
                contact,
                contactName: contact?.name,
                contactEmail: contact?.email,
                contactCompany: contact?.company,
                contactTags: contact?.tags,
                tags: conv.tags,
                assignedAssistantIds: conv.assignedAssistantIds,
                telegramData: conv,
            });
        });

        unified.sort((a, b) => {
            const aTime = a.lastMessageAt?.toDate?.() || a.lastMessageAt || new Date(0);
            const bTime = b.lastMessageAt?.toDate?.() || b.lastMessageAt || new Date(0);
            return bTime.getTime() - aTime.getTime();
        });

        return unified;
    }, [whatsAppConversations, telegramConversations, contacts]);

    const loading = whatsAppLoading || telegramLoading || contactsLoading;

    const markAsRead = async (conversationId: string, platform: Platform) => {
        if (platform === 'meta_whatsapp') {
            await markWhatsAppAsRead(conversationId);
        } else if (platform === 'telegram') {
            await markTelegramAsRead(conversationId);
        }
    };

    const totalUnreadCount = useMemo(() => {
        return unifiedConversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
    }, [unifiedConversations]);

    return {
        conversations: unifiedConversations,
        loading,
        markAsRead,
        totalUnreadCount,
        whatsAppCount: whatsAppConversations.length,
        telegramCount: telegramConversations.length,
    };
}

export function useUnifiedConversationSearch(
    partnerId: string | undefined,
    searchTerm: string,
    platformFilter?: Platform | 'all'
) {
    const { conversations, loading, markAsRead, totalUnreadCount } = useUnifiedConversations(partnerId);

    const filteredConversations = useMemo(() => {
        let filtered = conversations;

        if (platformFilter && platformFilter !== 'all') {
            filtered = filtered.filter((conv) => conv.platform === platformFilter);
        }

        if (!searchTerm) return filtered;

        const search = searchTerm.toLowerCase();
        return filtered.filter((conv) =>
            conv.title.toLowerCase().includes(search) ||
            conv.customerIdentifier.includes(search) ||
            conv.customerName?.toLowerCase().includes(search) ||
            conv.customerUsername?.toLowerCase().includes(search) ||
            conv.lastMessagePreview?.toLowerCase().includes(search) ||
            conv.contactName?.toLowerCase().includes(search) ||
            conv.contactEmail?.toLowerCase().includes(search) ||
            conv.contactCompany?.toLowerCase().includes(search)
        );
    }, [conversations, searchTerm, platformFilter]);

    return {
        conversations: filteredConversations,
        allConversations: conversations,
        loading,
        markAsRead,
        totalUnreadCount,
    };
}
