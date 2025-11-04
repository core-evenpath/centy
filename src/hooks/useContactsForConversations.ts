// src/hooks/useContactsForConversations.ts
"use client";

import { useState, useEffect } from 'react';
import { getContactsForConversations } from '@/lib/contact-messaging-service';
import type { Contact } from '@/lib/types';

export function useContactsForConversations(
  partnerId: string | undefined,
  phoneNumbers: string[]
) {
  const [contacts, setContacts] = useState<Map<string, Contact>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!partnerId || phoneNumbers.length === 0) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchContacts() {
      try {
        setIsLoading(true);
        const contactMap = await getContactsForConversations(partnerId, phoneNumbers);
        
        if (isMounted) {
          setContacts(contactMap);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
          console.error('Error fetching contacts for conversations:', err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchContacts();

    return () => {
      isMounted = false;
    };
  }, [partnerId, phoneNumbers.join(',')]);

  return { contacts, isLoading, error };
}

