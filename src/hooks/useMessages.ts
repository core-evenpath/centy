// src/hooks/useMessages.ts
import { useEffect, useState, useRef, useCallback } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SMSMessage, WhatsAppMessage } from '@/lib/types';

type Platform = 'sms' | 'whatsapp';
type UnifiedMessage = (SMSMessage | WhatsAppMessage) & { platform: Platform };

const PAGINATION_LIMIT = 50;

interface UseMessagesProps {
  conversationId: string | undefined;
  platform: Platform | undefined;
  initialRecentMessages: UnifiedMessage[];
  onNewMessage?: () => void;
}

export function useMessages({ 
  conversationId, 
  platform, 
  initialRecentMessages, 
  onNewMessage 
}: UseMessagesProps) {
  
  const [messages, setMessages] = useState<UnifiedMessage[]>(initialRecentMessages);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [allMessagesLoaded, setAllMessagesLoaded] = useState(false);

  const onNewMessageRef = useRef(onNewMessage);

  // Update ref when callback changes
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);

  // Reset messages when conversation changes
  useEffect(() => {
    // Sort initial messages just in case
    const sortedInitial = [...initialRecentMessages].sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() || 0;
      const timeB = b.createdAt?.toMillis?.() || 0;
      return timeA - timeB;
    });
    setMessages(sortedInitial);
    // If we got less than 20 (the denormalized amount), we can assume that's all of them
    setAllMessagesLoaded(initialRecentMessages.length < 20); 
    setIsLoadingMore(false);
  }, [conversationId, initialRecentMessages]);

  // Effect for listening to NEW messages
  useEffect(() => {
    if (!conversationId || !platform || !db || conversationId === 'pending') {
      return;
    }

    console.log('🔍 useMessages: Subscribing to NEW messages for', { conversationId, platform });

    const collectionName = platform === 'sms' ? 'smsMessages' : 'whatsappMessages';
    
    // Get the timestamp of the newest message we have
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    const lastMessageTime = lastMessage?.createdAt || new Timestamp(0, 0);

    console.log('🔥 Listening for messages AFTER:', lastMessageTime.toDate());

    const messagesQuery = query(
      collection(db, collectionName),
      where('conversationId', '==', conversationId),
      where('createdAt', '>', lastMessageTime),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      messagesQuery, 
      (snapshot) => {
        if (snapshot.empty) return; // No new messages

        const newMessages = snapshot.docs.map(doc => {
          return {
            id: doc.id, 
            ...doc.data(), 
            platform
          } as UnifiedMessage;
        });
        
        console.log('📨 Received', newMessages.length, 'new messages');
        
        setMessages(prevMessages => {
          const messageIds = new Set(prevMessages.map(m => m.id));
          const uniqueNewMessages = newMessages.filter(m => !messageIds.has(m.id));
          
          if (uniqueNewMessages.length > 0) {
            // Check if the new message is inbound
            const lastNew = uniqueNewMessages[uniqueNewMessages.length - 1];
            if (lastNew.direction === 'inbound') {
              onNewMessageRef.current?.();
            }
            return [...prevMessages, ...uniqueNewMessages];
          }
          return prevMessages;
        });
      },
      (err) => {
        console.error("❌ Error loading new messages:", err);
        setError(err as Error);
      }
    );

    return () => {
      console.log('🧹 Cleaning up NEW messages listener');
      unsubscribe();
    };
  // We only want this to re-run when the *core* identifiers change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, platform]);

  // Function for loading OLDER messages (pagination)
  const loadMore = useCallback(async () => {
    if (!conversationId || !platform || !db || allMessagesLoaded || isLoadingMore) {
      return;
    }

    console.log('🔍 useMessages: Loading OLDER messages for', { conversationId });
    setIsLoadingMore(true);

    try {
      const collectionName = platform === 'sms' ? 'smsMessages' : 'whatsappMessages';
      
      // Get the timestamp of the oldest message we have
      const firstMessage = messages[0];
      if (!firstMessage) {
        setIsLoadingMore(false);
        setAllMessagesLoaded(true);
        return;
      }
      
      const firstMessageTime = firstMessage.createdAt;
      console.log('📖 Loading messages BEFORE:', firstMessageTime.toDate());

      const messagesQuery = query(
        collection(db, collectionName),
        where('conversationId', '==', conversationId),
        where('createdAt', '<', firstMessageTime),
        orderBy('createdAt', 'desc'),
        limit(PAGINATION_LIMIT)
      );

      const snapshot = await getDocs(messagesQuery);

      if (snapshot.empty) {
        setAllMessagesLoaded(true);
        setIsLoadingMore(false);
        return;
      }

      if (snapshot.docs.length < PAGINATION_LIMIT) {
        setAllMessagesLoaded(true);
      }

      const olderMessages = snapshot.docs.map(doc => {
        return {
          id: doc.id, 
          ...doc.data(), 
          platform
        } as UnifiedMessage;
      }).reverse(); // Reverse to maintain ascending order

      setMessages(prevMessages => [...olderMessages, ...prevMessages]);
      
    } catch (err: any) {
      console.error("❌ Error loading older messages:", err);
      setError(err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [conversationId, platform, allMessagesLoaded, isLoadingMore, messages]);

  // Note: We no longer return `isLoading` as the initial load is handled
  // by passing `initialRecentMessages`. We return `isLoadingMore` instead.
  return { messages, isLoadingMore, error, loadMore, allMessagesLoaded };
}