// src/lib/contact-enrichment-service.ts
"use client";

import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Contact } from './types';

/**
 * Find a contact by phone number or email
 */
export async function findContact(
  partnerId: string,
  phone?: string,
  email?: string
): Promise<Contact | null> {
  if (!partnerId || (!phone && !email)) {
    return null;
  }

  const contactsRef = collection(db, `partners/${partnerId}/contacts`);

  // Try phone first
  if (phone) {
    const q = query(contactsRef, where('phone', '==', phone));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Contact;
    }
  }

  // Fallback to email
  if (email) {
    const q = query(contactsRef, where('email', '==', email));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Contact;
    }
  }

  return null;
}

/**
 * Enrich a conversation with contact information
 */
export function enrichConversationWithContact<T extends { customerPhone: string; customerName?: string; clientInfo?: any }>(
  conversation: T,
  contactMap: Map<string, Contact>
): T & { 
  contactName?: string; 
  contactEmail?: string; 
  contactId?: string;
  clientInfo?: {
    lifetimeValue?: string;
    email?: string;
    company?: string;
    category?: string;
    notes?: string;
  };
} {
  // Try to find contact by phone
  const phoneKey = `phone:${conversation.customerPhone}`;
  let contact = contactMap.get(phoneKey);

  // If not found by phone and conversation has a name that looks like an email, try that
  if (!contact && conversation.customerName?.includes('@')) {
    const emailKey = `email:${conversation.customerName}`;
    contact = contactMap.get(emailKey);
  }

  if (contact) {
    return {
      ...conversation,
      customerName: contact.name || conversation.customerName,
      contactName: contact.name,
      contactEmail: contact.email,
      contactId: contact.id,
      // Populate clientInfo from contact data with generic fields
      clientInfo: {
        lifetimeValue: contact.lifetimeValue || '',
        email: contact.email || '',
        company: contact.company || '',
        category: contact.category || '',
        notes: contact.notes || '',
      },
    };
  }

  return conversation;
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}