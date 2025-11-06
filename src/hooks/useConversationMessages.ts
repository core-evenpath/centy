// src/hooks/useConversationMessages.ts
"use client";

import { useEffect, useState, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type Platform = 'sms' | 'whatsapp';

interface Message {
  id: string;
  conversationId: string;
  direction: 'inbound' | 'outbound';
  content: string;
  status?: string;
  createdAt: any;
  senderId?: string;
  mediaUrl?: string;
  [key: string]: any;
}

interface UseConversationMessagesProps {
  conversationId: string | undefined;
  platform: Platform;
  onNewMessage?: () => void;
}

export function useConversationMessages({
  conversationId,
  platform,
  onNewMessage
}: UseConversationMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const onNewMessageRef = useRef(onNewMessage);
  const previousCountRef = useRef(0);
  
  onNewMessageRef.current = onNewMessage;

  useEffect(() => {
    console.log('🔄 [useConversationMessages] Reset for new conversation');
    setMessages([]);
    setIsLoading(true);
    setError(null);
    previousCountRef.current = 0;
  }, [conversationId, platform]);

  useEffect(() => {
    if (!conversationId || !db) {
      console.log('❌ [useConversationMessages] No conversation ID or db');
      setMessages([]);
      setIsLoading(false);
      return;
    }

    const collectionName = platform === 'sms' ? 'smsMessages' : 'whatsappMessages';
    
    console.log('🚀 [useConversationMessages] Setting up listener:', {
      conversationId,
      platform,
      collection: collectionName
    });

    const messagesQuery = query(
      collection(db, collectionName),
      where('conversationId', '==', conversationId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        console.log(`📨 [${platform.toUpperCase()}] Snapshot received:`, {
          size: snapshot.size,
          empty: snapshot.empty
        });

        const loadedMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Message));

        console.log(`📦 [${platform.toUpperCase()}] Messages loaded:`, {
          total: loadedMessages.length,
          inbound: loadedMessages.filter(m => m.direction === 'inbound').length,
          outbound: loadedMessages.filter(m => m.direction === 'outbound').length,
          sample: loadedMessages.slice(0, 3).map(m => ({
            id: m.id.substring(0, 10),
            direction: m.direction,
            content: m.content?.substring(0, 30)
          }))
        });

        // Detect new messages
        const currentCount = loadedMessages.length;
        const previousCount = previousCountRef.current;

        if (previousCount > 0 && currentCount > previousCount) {
          console.log('🔔 [useConversationMessages] New message detected!');
          const latestMessage = loadedMessages[loadedMessages.length - 1];
          if (latestMessage?.direction === 'inbound' && onNewMessageRef.current) {
            console.log('🔊 [useConversationMessages] Triggering notification');
            onNewMessageRef.current();
          }
        }

        previousCountRef.current = currentCount;
        setMessages(loadedMessages);
        setIsLoading(false);
      },
      (err) => {
        console.error(`❌ [${platform.toUpperCase()}] Listener error:`, err);
        setError(err as Error);
        setIsLoading(false);
      }
    );

    return () => {
      console.log('🧹 [useConversationMessages] Cleaning up listener');
      unsubscribe();
    };
  }, [conversationId, platform]);

  console.log('📊 [useConversationMessages] Current state:', {
    conversationId,
    platform,
    messageCount: messages.length,
    inbound: messages.filter(m => m.direction === 'inbound').length,
    outbound: messages.filter(m => m.direction === 'outbound').length,
    isLoading,
    hasError: !!error
  });

  return {
    messages,
    isLoading,
    error
  };
}
