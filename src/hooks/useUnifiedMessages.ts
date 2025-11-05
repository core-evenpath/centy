// src/hooks/useUnifiedMessages.ts
"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { collection, query, where, orderBy, limit, getDocs, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UnifiedMessage, UnifiedConversation } from '@/lib/conversation-grouping-service';

type Platform = 'sms' | 'whatsapp';

interface UseUnifiedMessagesOptions {
  unifiedConversation: UnifiedConversation | null;
  onNewMessage?: () => void;
}

export function useUnifiedMessages({ 
  unifiedConversation, 
  onNewMessage 
}: UseUnifiedMessagesOptions) {
  const [messages, setMessages] = useState<UnifiedMessage[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [allMessagesLoaded, setAllMessagesLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const onNewMessageRef = useRef(onNewMessage);
  onNewMessageRef.current = onNewMessage;

  useEffect(() => {
    setMessages([]);
    setAllMessagesLoaded(false);
    setError(null);
  }, [unifiedConversation?.id]);

  useEffect(() => {
    if (!unifiedConversation || !db) {
      setMessages([]);
      return;
    }

    console.log('📥 Loading messages for:', {
      smsId: unifiedConversation.smsConversationId,
      whatsappId: unifiedConversation.whatsappConversationId
    });

    const loadInitialMessages = async () => {
      try {
        const allMessages: UnifiedMessage[] = [];

        if (unifiedConversation.smsConversationId) {
          console.log('📞 Loading SMS messages from:', unifiedConversation.smsConversationId);
          const smsQuery = query(
            collection(db, 'smsMessages'),
            where('conversationId', '==', unifiedConversation.smsConversationId),
            orderBy('createdAt', 'desc'),
            limit(50)
          );
          
          const smsSnapshot = await getDocs(smsQuery);
          console.log('📞 Found', smsSnapshot.size, 'SMS messages');
          
          const smsMessages = smsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            platform: 'sms' as Platform,
            conversationId: unifiedConversation.smsConversationId!
          } as UnifiedMessage));
          
          allMessages.push(...smsMessages);
        }

        if (unifiedConversation.whatsappConversationId) {
          console.log('💬 Loading WhatsApp messages from:', unifiedConversation.whatsappConversationId);
          const whatsappQuery = query(
            collection(db, 'whatsappMessages'),
            where('conversationId', '==', unifiedConversation.whatsappConversationId),
            orderBy('createdAt', 'desc'),
            limit(50)
          );
          
          const whatsappSnapshot = await getDocs(whatsappQuery);
          console.log('💬 Found', whatsappSnapshot.size, 'WhatsApp messages');
          
          const whatsappMessages = whatsappSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            platform: 'whatsapp' as Platform,
            conversationId: unifiedConversation.whatsappConversationId!
          } as UnifiedMessage));
          
          allMessages.push(...whatsappMessages);
        }

        allMessages.sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeA - timeB;
        });

        console.log('✅ Total loaded:', allMessages.length, 'messages');
        setMessages(allMessages);
      } catch (err) {
        console.error('❌ Error loading messages:', err);
        setError(err as Error);
      }
    };

    loadInitialMessages();
  }, [unifiedConversation?.id, unifiedConversation?.smsConversationId, unifiedConversation?.whatsappConversationId]);

  useEffect(() => {
    if (!unifiedConversation || !db) {
      return;
    }

    console.log('🔥 Setting up listeners');
    const unsubscribers: (() => void)[] = [];

    const setupListener = (
      conversationId: string,
      platform: Platform,
      collectionName: 'smsMessages' | 'whatsappMessages'
    ) => {
      console.log(`🎧 Listening to ${platform} in ${collectionName} for:`, conversationId);
      
      const messagesQuery = query(
        collection(db, collectionName),
        where('conversationId', '==', conversationId),
        orderBy('createdAt', 'asc')
      );

      const unsubscribe = onSnapshot(
        messagesQuery,
        (snapshot) => {
          console.log(`📨 ${platform} snapshot: ${snapshot.size} docs`);
          
          if (snapshot.empty) {
            console.log(`📭 No ${platform} messages`);
            return;
          }

          const allSnapshotMessages = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              platform,
              conversationId
            } as UnifiedMessage;
          });

          console.log(`📦 ${platform} messages:`, allSnapshotMessages.map(m => ({
            id: m.id,
            content: m.content?.substring(0, 20),
            direction: m.direction
          })));

          setMessages(prevMessages => {
            const existingIds = new Set(prevMessages.map(m => m.id));
            const newMessages = allSnapshotMessages.filter(m => !existingIds.has(m.id));
            
            if (newMessages.length > 0) {
              console.log(`✨ ${newMessages.length} new ${platform} message(s)`);
              
              if (newMessages.some(m => m.direction === 'inbound')) {
                onNewMessageRef.current?.();
              }
              
              const merged = [...prevMessages, ...newMessages].sort((a, b) => {
                const timeA = a.createdAt?.toMillis?.() || 0;
                const timeB = b.createdAt?.toMillis?.() || 0;
                return timeA - timeB;
              });
              
              return merged;
            }
            
            return prevMessages;
          });
        },
        (err) => {
          console.error(`❌ ${platform} listener error:`, err);
          setError(err as Error);
        }
      );

      return unsubscribe;
    };

    if (unifiedConversation.smsConversationId) {
      unsubscribers.push(setupListener(
        unifiedConversation.smsConversationId,
        'sms',
        'smsMessages'
      ));
    }

    if (unifiedConversation.whatsappConversationId) {
      unsubscribers.push(setupListener(
        unifiedConversation.whatsappConversationId,
        'whatsapp',
        'whatsappMessages'
      ));
    }

    return () => {
      console.log('🧹 Cleanup listeners');
      unsubscribers.forEach(unsub => unsub());
    };
  }, [unifiedConversation?.id, unifiedConversation?.smsConversationId, unifiedConversation?.whatsappConversationId]);

  const loadMore = useCallback(async () => {
    if (!unifiedConversation || !db || allMessagesLoaded || isLoadingMore || messages.length === 0) {
      return;
    }

    setIsLoadingMore(true);

    try {
      const oldestMessage = messages[0];
      const beforeTime = oldestMessage.createdAt;
      const olderMessages: UnifiedMessage[] = [];

      if (unifiedConversation.smsConversationId) {
        const smsQuery = query(
          collection(db, 'smsMessages'),
          where('conversationId', '==', unifiedConversation.smsConversationId),
          where('createdAt', '<', beforeTime),
          orderBy('createdAt', 'desc'),
          limit(20)
        );

        const smsSnapshot = await getDocs(smsQuery);
        olderMessages.push(...smsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          platform: 'sms' as Platform,
          conversationId: unifiedConversation.smsConversationId!
        } as UnifiedMessage)));
      }

      if (unifiedConversation.whatsappConversationId) {
        const whatsappQuery = query(
          collection(db, 'whatsappMessages'),
          where('conversationId', '==', unifiedConversation.whatsappConversationId),
          where('createdAt', '<', beforeTime),
          orderBy('createdAt', 'desc'),
          limit(20)
        );

        const whatsappSnapshot = await getDocs(whatsappQuery);
        olderMessages.push(...whatsappSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          platform: 'whatsapp' as Platform,
          conversationId: unifiedConversation.whatsappConversationId!
        } as UnifiedMessage)));
      }

      if (olderMessages.length === 0) {
        setAllMessagesLoaded(true);
      } else {
        olderMessages.sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeA - timeB;
        });

        setMessages(prev => [...olderMessages, ...prev]);
      }
    } catch (err) {
      console.error('Error loading more:', err);
      setError(err as Error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [unifiedConversation, messages, allMessagesLoaded, isLoadingMore]);

  return {
    messages,
    isLoadingMore,
    allMessagesLoaded,
    error,
    loadMore
  };
}