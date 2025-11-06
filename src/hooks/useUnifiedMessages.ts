"use client";

import { useEffect, useState, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UnifiedMessage, UnifiedConversation } from '@/lib/conversation-grouping-service';

interface UseUnifiedMessagesOptions {
  unifiedConversation: UnifiedConversation | null;
  onNewMessage?: () => void;
}

export function useUnifiedMessages({ 
  unifiedConversation, 
  onNewMessage 
}: UseUnifiedMessagesOptions) {
  const [messages, setMessages] = useState<UnifiedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const onNewMessageRef = useRef(onNewMessage);
  const lastMessageCountRef = useRef(0);
  
  onNewMessageRef.current = onNewMessage;

  useEffect(() => {
    if (!unifiedConversation || !db) {
      console.log('❌ [useUnifiedMessages] No conversation or db');
      setMessages([]);
      setIsLoading(false);
      return;
    }

    console.log('🚀 [useUnifiedMessages] Setting up listeners for:', {
      conversationId: unifiedConversation.id,
      phone: unifiedConversation.customerPhone,
      smsConversationId: unifiedConversation.smsConversationId,
      whatsappConversationId: unifiedConversation.whatsappConversationId,
      platforms: unifiedConversation.availablePlatforms
    });

    setIsLoading(true);
    let smsMessages: UnifiedMessage[] = [];
    let whatsappMessages: UnifiedMessage[] = [];
    let smsReady = false;
    let whatsappReady = false;

    const updateMessages = () => {
      const allMessages = [...smsMessages, ...whatsappMessages];
      allMessages.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeA - timeB;
      });

      console.log('📨 [useUnifiedMessages] Combined messages:', {
        total: allMessages.length,
        sms: smsMessages.length,
        whatsapp: whatsappMessages.length
      });

      setMessages(allMessages);
      
      if (smsReady && whatsappReady) {
        setIsLoading(false);
      }

      if (allMessages.length > lastMessageCountRef.current) {
        onNewMessageRef.current?.();
      }
      lastMessageCountRef.current = allMessages.length;
    };

    const unsubscribers: (() => void)[] = [];

    if (unifiedConversation.smsConversationId) {
      const smsQuery = query(
        collection(db, 'smsMessages'),
        where('conversationId', '==', unifiedConversation.smsConversationId),
        orderBy('createdAt', 'asc'),
        limit(100)
      );

      const unsubSms = onSnapshot(
        smsQuery,
        (snapshot) => {
          smsMessages = snapshot.docs.map(doc => ({
            ...(doc.data() as any),
            id: doc.id,
            platform: 'sms' as const,
            conversationId: unifiedConversation.smsConversationId!
          }));
          smsReady = true;
          updateMessages();
        },
        (error) => {
          console.error('❌ [useUnifiedMessages] SMS error:', error);
          smsReady = true;
          updateMessages();
        }
      );
      unsubscribers.push(unsubSms);
    } else {
      smsReady = true;
    }

    if (unifiedConversation.whatsappConversationId) {
      const whatsappQuery = query(
        collection(db, 'whatsappMessages'),
        where('conversationId', '==', unifiedConversation.whatsappConversationId),
        orderBy('createdAt', 'asc'),
        limit(100)
      );

      const unsubWhatsapp = onSnapshot(
        whatsappQuery,
        (snapshot) => {
          whatsappMessages = snapshot.docs.map(doc => ({
            ...(doc.data() as any),
            id: doc.id,
            platform: 'whatsapp' as const,
            conversationId: unifiedConversation.whatsappConversationId!
          }));
          whatsappReady = true;
          updateMessages();
        },
        (error) => {
          console.error('❌ [useUnifiedMessages] WhatsApp error:', error);
          whatsappReady = true;
          updateMessages();
        }
      );
      unsubscribers.push(unsubWhatsapp);
    } else {
      whatsappReady = true;
    }

    return () => {
      console.log('🧹 [useUnifiedMessages] Cleaning up listeners');
      unsubscribers.forEach(unsub => unsub());
    };
  }, [unifiedConversation?.id]);

  return {
    messages,
    isLoading
  };
}