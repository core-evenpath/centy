// src/hooks/useConversations.ts
import { useEffect, useState, useCallback } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SMSConversation, WhatsAppConversation } from '@/lib/types';

type Platform = 'sms' | 'whatsapp';
type UnifiedConversation = (SMSConversation | WhatsAppConversation) & { platform: Platform };

export function useConversations(partnerId: string | undefined) {
  const [conversations, setConversations] = useState<UnifiedConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!partnerId || !db) {
      setConversations([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const smsQuery = query(
      collection(db, 'smsConversations'),
      where('partnerId', '==', partnerId),
      orderBy('lastMessageAt', 'desc'),
      limit(50)
    );

    const whatsappQuery = query(
      collection(db, 'whatsappConversations'),
      where('partnerId', '==', partnerId),
      orderBy('lastMessageAt', 'desc'),
      limit(50)
    );

    let smsConvos: UnifiedConversation[] = [];
    let whatsappConvos: UnifiedConversation[] = [];
    let smsLoaded = false;
    let whatsappLoaded = false;

    const updateConversations = () => {
      if (smsLoaded && whatsappLoaded) {
        const combined = [...smsConvos, ...whatsappConvos].sort((a, b) => {
          const timeA = a.lastMessageAt?.toMillis?.() || 0;
          const timeB = b.lastMessageAt?.toMillis?.() || 0;
          return timeB - timeA;
        });
        setConversations(combined);
        setIsLoading(false);
      }
    };

    const unsubSMS = onSnapshot(
      smsQuery, 
      (snapshot) => {
        smsConvos = snapshot.docs.map(doc => ({
          id: doc.id,
          platform: 'sms' as Platform,
          ...doc.data()
        } as UnifiedConversation));
        smsLoaded = true;
        updateConversations();
      },
      (err) => {
        console.error("Error loading SMS conversations:", err);
        setError(err as Error);
        smsLoaded = true;
        updateConversations();
      }
    );

    const unsubWhatsApp = onSnapshot(
      whatsappQuery, 
      (snapshot) => {
        whatsappConvos = snapshot.docs.map(doc => ({
          id: doc.id,
          platform: 'whatsapp' as Platform,
          ...doc.data()
        } as UnifiedConversation));
        whatsappLoaded = true;
        updateConversations();
      },
      (err) => {
        console.error("Error loading WhatsApp conversations:", err);
        setError(err as Error);
        whatsappLoaded = true;
        updateConversations();
      }
    );

    return () => {
      unsubSMS();
      unsubWhatsApp();
    };
  }, [partnerId]);

  return { conversations, isLoading, error };
}