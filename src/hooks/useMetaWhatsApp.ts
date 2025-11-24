'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    collection,
    query,
    where,
    onSnapshot,
    orderBy,
    doc,
    updateDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { MetaWhatsAppConversation, MetaWhatsAppMessage } from '@/lib/types-meta-whatsapp';

export function useMetaConversations(partnerId: string | undefined) {
    const [conversations, setConversations] = useState<MetaWhatsAppConversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!partnerId || !db) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const q = query(
            collection(db, 'metaWhatsAppConversations'),
            where('partnerId', '==', partnerId),
            orderBy('lastMessageAt', 'desc')
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const convs = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as MetaWhatsAppConversation[];

                setConversations(convs);
                setLoading(false);
            },
            (err) => {
                console.error('Error fetching conversations:', err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [partnerId]);

    const markAsRead = useCallback(async (conversationId: string) => {
        if (!db) return;

        try {
            await updateDoc(doc(db, 'metaWhatsAppConversations', conversationId), {
                unreadCount: 0,
            });
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    }, []);

    const getTotalUnread = useCallback(() => {
        return conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
    }, [conversations]);

    return {
        conversations,
        loading,
        error,
        markAsRead,
        getTotalUnread,
    };
}

export function useMetaMessages(conversationId: string | undefined) {
    const [messages, setMessages] = useState<MetaWhatsAppMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!conversationId || !db) {
            setLoading(false);
            setMessages([]);
            return;
        }

        setLoading(true);
        setError(null);

        const q = query(
            collection(db, 'metaWhatsAppMessages'),
            where('conversationId', '==', conversationId),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const msgs = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as MetaWhatsAppMessage[];

                setMessages(msgs);
                setLoading(false);
            },
            (err) => {
                console.error('Error fetching messages:', err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [conversationId]);

    return {
        messages,
        loading,
        error,
    };
}

export function useMetaConversationSearch(
    partnerId: string | undefined,
    searchTerm: string
) {
    const { conversations, loading, error } = useMetaConversations(partnerId);

    const filteredConversations = conversations.filter(conv => {
        if (!searchTerm) return true;

        const search = searchTerm.toLowerCase();
        return (
            conv.customerName?.toLowerCase().includes(search) ||
            conv.customerPhone.includes(search) ||
            conv.lastMessagePreview?.toLowerCase().includes(search) ||
            conv.tags?.some(tag => tag.toLowerCase().includes(search))
        );
    });

    return {
        conversations: filteredConversations,
        allConversations: conversations,
        loading,
        error,
    };
}

export function useMetaUnreadCount(partnerId: string | undefined) {
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!partnerId || !db) {
            return;
        }

        const q = query(
            collection(db, 'metaWhatsAppConversations'),
            where('partnerId', '==', partnerId),
            where('unreadCount', '>', 0)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const total = snapshot.docs.reduce((sum, doc) => {
                return sum + (doc.data().unreadCount || 0);
            }, 0);
            setUnreadCount(total);
        });

        return () => unsubscribe();
    }, [partnerId]);

    return unreadCount;
}
