// src/hooks/useMessages.ts
import { useEffect, useState, useRef } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SMSMessage, WhatsAppMessage } from '@/lib/types';

type Platform = 'sms' | 'whatsapp';
type UnifiedMessage = (SMSMessage | WhatsAppMessage) & { platform: Platform };

// Global cache for messages
const messageCache = new Map<string, UnifiedMessage[]>();

interface UseMessagesProps {
  conversationId: string | undefined;
  platform: Platform | undefined;
  onNewMessage?: () => void;
}

export function useMessages({ conversationId, platform, onNewMessage }: UseMessagesProps) {
  const [messages, setMessages] = useState<UnifiedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const lastMessageCountRef = useRef(0);
  const onNewMessageRef = useRef(onNewMessage);

  // Update ref when callback changes
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);

  useEffect(() => {
    if (!conversationId || !platform || !db) {
      console.log('🔍 useMessages: Missing required params', { conversationId, platform, hasDb: !!db });
      setMessages([]);
      lastMessageCountRef.current = 0;
      setIsLoading(false);
      return;
    }

    console.log('🔍 useMessages: Starting to load messages for', { conversationId, platform });

    // Check cache first
    const cacheKey = `${platform}-${conversationId}`;
    const cachedMessages = messageCache.get(cacheKey);
    if (cachedMessages && cachedMessages.length > 0) {
      console.log('📦 Using cached messages:', cachedMessages.length);
      setMessages(cachedMessages);
      lastMessageCountRef.current = cachedMessages.length;
    }

    setIsLoading(true);

    const collectionName = platform === 'sms' ? 'smsMessages' : 'whatsappMessages';
    
    console.log('🔍 Query collection:', collectionName, 'for conversationId:', conversationId);

    const messagesQuery = query(
      collection(db, collectionName),
      where('conversationId', '==', conversationId),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      messagesQuery, 
      (snapshot) => {
        console.log('📨 Received snapshot with', snapshot.docs.length, 'messages');
        
        const newMessages = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('📝 Message data:', { id: doc.id, direction: data.direction, content: data.content?.substring(0, 50) });
          return {
            id: doc.id, 
            ...data, 
            platform
          } as UnifiedMessage;
        });
        
        console.log('✅ Processed messages:', newMessages.length);
        
        // Update cache
        messageCache.set(cacheKey, newMessages);
        
        // Check if there are new incoming messages
        if (newMessages.length > lastMessageCountRef.current && lastMessageCountRef.current > 0) {
          const lastNewMessage = newMessages[newMessages.length - 1];
          console.log('🔔 New message detected:', lastNewMessage.direction);
          if (lastNewMessage.direction === 'inbound') {
            onNewMessageRef.current?.();
          }
        }
        
        lastMessageCountRef.current = newMessages.length;
        setMessages(newMessages);
        setIsLoading(false);
      },
      (err) => {
        console.error("❌ Error loading messages:", err);
        setError(err as Error);
        setIsLoading(false);
      }
    );

    return () => {
      console.log('🧹 Cleaning up messages listener');
      unsubscribe();
    };
  }, [conversationId, platform]);

  return { messages, isLoading, error };
}