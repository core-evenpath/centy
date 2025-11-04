// src/lib/contact-enrichment-service.ts
"use client";

import { db } from './firebase';
import { collection, query, where, getDocs, or } from 'firebase/firestore';
import type { Contact } from './types';

/**
 * Find contacts by phone numbers or emails
 * This supports matching conversations to contacts using either identifier
 */
export async function getContactsForConversations(
  partnerId: string,
  identifiers: { phone?: string; email?: string }[]
): Promise<Map<string, Contact>> {
  if (!partnerId || identifiers.length === 0) {
    return new Map();
  }

  const contactMap = new Map<string, Contact>();
  const contactsRef = collection(db, `partners/${partnerId}/contacts`);

  // Extract unique phone numbers and emails
  const phones = [...new Set(identifiers.map(i => i.phone).filter(Boolean))];
  const emails = [...new Set(identifiers.map(i => i.email).filter(Boolean))];

  // Batch queries in chunks of 10 (Firestore limit for 'in' operator)
  const phoneChunks = chunkArray(phones, 10);
  const emailChunks = chunkArray(emails, 10);

  // Query by phone numbers
  for (const chunk of phoneChunks) {
    if (chunk.length === 0) continue;
    
    const q = query(contactsRef, where('phone', 'in', chunk));
    const snapshot = await getDocs(q);
    
    snapshot.docs.forEach(doc => {
      const contact = { id: doc.id, ...doc.data() } as Contact;
      // Map by phone as primary key
      contactMap.set(`phone:${contact.phone}`, contact);
      // Also map by email if available
      if (contact.email) {
        contactMap.set(`email:${contact.email}`, contact);
      }
    });
  }

  // Query by emails
  for (const chunk of emailChunks) {
    if (chunk.length === 0) continue;
    
    const q = query(contactsRef, where('email', 'in', chunk));
    const snapshot = await getDocs(q);
    
    snapshot.docs.forEach(doc => {
      const contact = { id: doc.id, ...doc.data() } as Contact;
      const emailKey = `email:${contact.email}`;
      
      // Only add if not already present (phone takes precedence)
      if (!contactMap.has(emailKey)) {
        contactMap.set(emailKey, contact);
      }
      // Also map by phone if available
      if (contact.phone) {
        const phoneKey = `phone:${contact.phone}`;
        if (!contactMap.has(phoneKey)) {
          contactMap.set(phoneKey, contact);
        }
      }
    });
  }

  return contactMap;
}

/**
 * Get a single contact by phone or email
 */
export async function findContactByPhoneOrEmail(
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
    portfolio?: string;
    email?: string;
    occupation?: string;
    accountType?: string;
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
      // Populate clientInfo from contact data
      clientInfo: {
        portfolio: contact.portfolio || '',
        email: contact.email || '',
        occupation: contact.occupation || '',
        accountType: contact.accountType || '',
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