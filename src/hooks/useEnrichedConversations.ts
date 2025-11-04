// src/hooks/useEnrichedConversations.ts
"use client";

import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Contact } from '@/lib/types';
import { enrichConversationWithContact } from '@/lib/contact-enrichment-service';

type ConversationWithPhone = {
  id: string;
  customerPhone: string;
  customerName?: string;
  [key: string]: any;
};

/**
 * Hook to enrich conversations with contact data
 * Listens to contacts collection in real-time and matches them with conversations
 */
export function useEnrichedConversations<T extends ConversationWithPhone>(
  conversations: T[],
  partnerId: string | undefined
) {
  const [contacts, setContacts] = useState<Map<string, Contact>>(new Map());
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);

  // Listen to contacts collection in real-time
  useEffect(() => {
    if (!partnerId || !db) {
      setIsLoadingContacts(false);
      setContacts(new Map());
      return;
    }

    setIsLoadingContacts(true);

    const contactsRef = collection(db, `partners/${partnerId}/contacts`);
    const q = query(contactsRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const contactMap = new Map<string, Contact>();

        snapshot.docs.forEach(doc => {
          const contact = { id: doc.id, ...doc.data() } as Contact;
          
          // Map by phone number as primary key
          if (contact.phone) {
            contactMap.set(`phone:${contact.phone}`, contact);
          }
          
          // Also map by email if available
          if (contact.email) {
            contactMap.set(`email:${contact.email}`, contact);
          }
        });

        setContacts(contactMap);
        setIsLoadingContacts(false);
      },
      (error) => {
        console.error('Error loading contacts:', error);
        setIsLoadingContacts(false);
      }
    );

    return () => unsubscribe();
  }, [partnerId]);

  // Enrich conversations with contact data
  const enrichedConversations = useMemo(() => {
    if (isLoadingContacts) {
      // Return conversations with a loading state for contact info
      return conversations.map(convo => ({
        ...convo,
        contactName: convo.customerName, // Fallback
      }));
    }
    
    return conversations.map(conversation => 
      enrichConversationWithContact(conversation, contacts)
    );
  }, [conversations, contacts, isLoadingContacts]);

  return {
    enrichedConversations,
    contacts,
    isLoadingContacts
  };
}
