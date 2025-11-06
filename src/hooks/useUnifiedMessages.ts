// src/hooks/useUnifiedMessages.ts
"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { collection, query, where, orderBy, getDocs, onSnapshot } from 'firebase/firestore';
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
  const lastMessageCountRef = useRef(0);
  
  onNewMessageRef.current = onNewMessage;

  // Reset everything when conversation changes
  useEffect(() => {
    console.log('🔄 [useUnifiedMessages] Conversation changed - HARD RESET');
    setMessages([]);
    setAllMessagesLoaded(false);
    setError(null);
    setIsLoadingMore(false);
    lastMessageCountRef.current = 0;
  }, [unifiedConversation?.id]);

  // Main effect: Set up real-time listeners
  useEffect(() => {
    if (!unifiedConversation || !db) {
      console.log('❌ [useUnifiedMessages] No conversation or db');
      setMessages([]);
      return;
    }

    console.log('🚀 [useUnifiedMessages] Setting up listeners for:', {
      conversationId: unifiedConversation.id,
      phone: unifiedConversation.customerPhone,
      smsConversationId: unifiedConversation.smsConversationId,
      whatsappConversationId: unifiedConversation.whatsappConversationId,
      platforms: unifiedConversation.availablePlatforms
    });

    // Store all messages from both platforms
    let smsMessages: UnifiedMessage[] = [];
    let whatsappMessages: UnifiedMessage[] = [];
    let smsReady = false;
    let whatsappReady = false;

    // Function to merge and update messages
    const updateMessages = () => {
      console.log('🔀 [useUnifiedMessages] Merging messages:', {
        sms: smsMessages.length,
        whatsapp: whatsappMessages.length,
        smsReady,
        whatsappReady
      });

      // Combine all messages
      const allMessages = [...smsMessages, ...whatsappMessages];

      // Sort chronologically (oldest first)
      allMessages.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeA - timeB;
      });

      console.log('📊 [useUnifiedMessages] Final message counts:', {
        total: allMessages.length,
        inbound: allMessages.filter(m => m.direction === 'inbound').length,
        outbound: allMessages.filter(m => m.direction === 'outbound').length,
        byPlatform: {
          sms: allMessages.filter(m => m.platform === 'sms').length,
          whatsapp: allMessages.filter(m => m.platform === 'whatsapp').length
        }
      });

      // Detect new messages for notification
      const currentCount = allMessages.length;
      const previousCount = lastMessageCountRef.current;

      if (previousCount > 0 && currentCount > previousCount) {
        console.log('🔔 [useUnifiedMessages] NEW MESSAGE DETECTED!', {
          previous: previousCount,
          current: currentCount,
          new: currentCount - previousCount
        });

        // Check if latest message is inbound
        const latestMessage = allMessages[allMessages.length - 1];
        if (latestMessage?.direction === 'inbound') {
          console.log('🔊 [useUnifiedMessages] New INBOUND message - triggering notification');
          if (onNewMessageRef.current) {
            onNewMessageRef.current();
          }
        }
      }

      lastMessageCountRef.current = currentCount;
      setMessages(allMessages);
    };

    const unsubscribers: (() => void)[] = [];

    // Set up SMS listener
    if (unifiedConversation.smsConversationId) {
      console.log('📞 [SMS] Setting up listener for:', unifiedConversation.smsConversationId);

      const smsQuery = query(
        collection(db, 'smsMessages'),
        where('conversationId', '==', unifiedConversation.smsConversationId),
        orderBy('createdAt', 'asc')
      );

      const unsubscribeSMS = onSnapshot(
        smsQuery,
        (snapshot) => {
          console.log('📨 [SMS] Snapshot received:', {
            size: snapshot.size,
            empty: snapshot.empty
          });

          smsMessages = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              platform: 'sms' as Platform,
              conversationId: unifiedConversation.smsConversationId!
            } as UnifiedMessage;
          });

          console.log('📦 [SMS] Messages processed:', {
            count: smsMessages.length,
            inbound: smsMessages.filter(m => m.direction === 'inbound').length,
            outbound: smsMessages.filter(m => m.direction === 'outbound').length,
            sample: smsMessages.slice(0, 3).map(m => ({
              id: m.id.substring(0, 10),
              direction: m.direction,
              content: m.content?.substring(0, 30)
            }))
          });

          smsReady = true;
          updateMessages();
        },
        (err) => {
          console.error('❌ [SMS] Listener error:', err);
          setError(err as Error);
        }
      );

      unsubscribers.push(unsubscribeSMS);
    } else {
      console.log('⏭️ [SMS] No SMS conversation, marking as ready');
      smsReady = true;
    }

    // Set up WhatsApp listener
    if (unifiedConversation.whatsappConversationId) {
      console.log('💬 [WhatsApp] Setting up listener for:', unifiedConversation.whatsappConversationId);

      const whatsappQuery = query(
        collection(db, 'whatsappMessages'),
        where('conversationId', '==', unifiedConversation.whatsappConversationId),
        orderBy('createdAt', 'asc')
      );

      const unsubscribeWhatsApp = onSnapshot(
        whatsappQuery,
        (snapshot) => {
          console.log('📨 [WhatsApp] Snapshot received:', {
            size: snapshot.size,
            empty: snapshot.empty
          });

          whatsappMessages = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              platform: 'whatsapp' as Platform,
              conversationId: unifiedConversation.whatsappConversationId!
            } as UnifiedMessage;
          });

          console.log('📦 [WhatsApp] Messages processed:', {
            count: whatsappMessages.length,
            inbound: whatsappMessages.filter(m => m.direction === 'inbound').length,
            outbound: whatsappMessages.filter(m => m.direction === 'outbound').length,
            sample: whatsappMessages.slice(0, 3).map(m => ({
              id: m.id.substring(0, 10),
              direction: m.direction,
              content: m.content?.substring(0, 30)
            }))
          });

          whatsappReady = true;
          updateMessages();
        },
        (err) => {
          console.error('❌ [WhatsApp] Listener error:', err);
          setError(err as Error);
        }
      );

      unsubscribers.push(unsubscribeWhatsApp);
    } else {
      console.log('⏭️ [WhatsApp] No WhatsApp conversation, marking as ready');
      whatsappReady = true;
    }

    // Initial merge if both are ready
    if (smsReady && whatsappReady) {
      updateMessages();
    }

    // Cleanup
    return () => {
      console.log('🧹 [useUnifiedMessages] Cleaning up listeners');
      unsubscribers.forEach(unsub => unsub());
    };
  }, [
    unifiedConversation?.id,
    unifiedConversation?.smsConversationId,
    unifiedConversation?.whatsappConversationId
  ]);

  // Load more (pagination) - simplified version
  const loadMore = useCallback(async () => {
    console.log('📥 [useUnifiedMessages] Load more requested');
    
    // For now, we're loading all messages in real-time, so nothing to paginate
    // This can be implemented later if needed for very large conversations
    setAllMessagesLoaded(true);
  }, []);

  // Final state log
  console.log('🏁 [useUnifiedMessages] Current state:', {
    totalMessages: messages.length,
    inbound: messages.filter(m => m.direction === 'inbound').length,
    outbound: messages.filter(m => m.direction === 'outbound').length,
    sms: messages.filter(m => m.platform === 'sms').length,
    whatsapp: messages.filter(m => m.platform === 'whatsapp').length,
    hasError: !!error
  });

  return {
    messages,
    isLoadingMore,
    allMessagesLoaded,
    error,
    loadMore
  };
}