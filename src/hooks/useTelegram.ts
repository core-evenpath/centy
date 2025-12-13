'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    limit,
    DocumentData,
} from 'firebase/firestore';
import type { TelegramConversation, TelegramStoredMessage } from '@/lib/types-telegram';
import { markTelegramConversationAsRead } from '@/actions/telegram-actions';

export function useTelegramConversations(partnerId: string | undefined) {
    const [conversations, setConversations] = useState<TelegramConversation[]>([]);
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
            collection(db, 'telegramConversations'),
            where('partnerId', '==', partnerId),
            orderBy('lastMessageAt', 'desc'),
            limit(100)
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const convs: TelegramConversation[] = snapshot.docs.map((doc) => {
                    const data = doc.data() as DocumentData;
                    return {
                        id: doc.id,
                        ...data,
                    } as TelegramConversation;
                });
                setConversations(convs);
                setLoading(false);
            },
            (err) => {
                console.error('Error fetching Telegram conversations:', err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [partnerId]);

    const markAsRead = async (conversationId: string) => {
        if (!partnerId) return;
        await markTelegramConversationAsRead(partnerId, conversationId);
    };

    return {
        conversations,
        loading,
        error,
        markAsRead,
    };
}

export function useTelegramMessages(conversationId: string | undefined) {
    const [messages, setMessages] = useState<TelegramStoredMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!conversationId || !db) {
            setMessages([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const q = query(
            collection(db, 'telegramMessages'),
            where('conversationId', '==', conversationId),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const msgs: TelegramStoredMessage[] = snapshot.docs.map((doc) => {
                    const data = doc.data() as DocumentData;
                    return {
                        id: doc.id,
                        ...data,
                    } as TelegramStoredMessage;
                });
                setMessages(msgs);
                setLoading(false);
            },
            (err) => {
                console.error('Error fetching Telegram messages:', err);
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

export function useTelegramUnreadCount(partnerId: string | undefined) {
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!partnerId || !db) {
            return;
        }

        const q = query(
            collection(db, 'telegramConversations'),
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

export function useTelegramConversationSearch(
    partnerId: string | undefined,
    searchTerm: string
) {
    const { conversations, loading, error } = useTelegramConversations(partnerId);

    const filteredConversations = conversations.filter((conv) => {
        if (!searchTerm) return true;

        const search = searchTerm.toLowerCase();
        return (
            conv.customerUsername?.toLowerCase().includes(search) ||
            conv.customerFirstName?.toLowerCase().includes(search) ||
            conv.customerLastName?.toLowerCase().includes(search) ||
            conv.title?.toLowerCase().includes(search) ||
            conv.lastMessagePreview?.toLowerCase().includes(search) ||
            conv.chatId.toString().includes(search)
        );
    });

    return {
        conversations: filteredConversations,
        allConversations: conversations,
        loading,
        error,
    };
}
