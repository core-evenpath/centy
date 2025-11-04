// src/lib/contact-messaging-service.ts
"use client";

import { db } from './firebase';
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import type { Contact } from './types';

/**
 * Find a contact by phone number for a specific partner
 */
export async function findContactByPhone(
  partnerId: string,
  phoneNumber: string
): Promise<Contact | null> {
  try {
    const contactsRef = collection(db, `partners/${partnerId}/contacts`);
    const q = query(contactsRef, where('phone', '==', phoneNumber));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const contactDoc = snapshot.docs[0];
    return {
      id: contactDoc.id,
      ...contactDoc.data()
    } as Contact;
  } catch (error) {
    console.error('Error finding contact by phone:', error);
    return null;
  }
}

/**
 * Get contact details for a conversation
 */
export async function getContactForConversation(
  partnerId: string,
  phoneNumber: string
): Promise<Contact | null> {
  return findContactByPhone(partnerId, phoneNumber);
}

/**
 * Update contact information
 */
export async function updateContactInfo(
  partnerId: string,
  contactId: string,
  updates: Partial<Contact>
): Promise<void> {
  const contactRef = doc(db, `partners/${partnerId}/contacts`, contactId);
  await updateDoc(contactRef, {
    ...updates,
    updatedAt: new Date()
  });
}

/**
 * Create a new contact from a conversation
 */
export async function createContactFromConversation(
  partnerId: string,
  phoneNumber: string,
  customerName?: string
): Promise<string> {
  const contactsRef = collection(db, `partners/${partnerId}/contacts`);
  const newContactRef = doc(contactsRef);
  
  const contactData: Partial<Contact> = {
    id: newContactRef.id,
    partnerId,
    phone: phoneNumber,
    name: customerName || phoneNumber,
    email: '',
    groups: [],
    tags: [],
    notes: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    // Generic CRM fields
    lifetimeValue: '',
    company: '',
    category: '',
  };
  
  await setDoc(newContactRef, contactData);
  return newContactRef.id;
}

/**
 * Batch fetch contacts for multiple conversations
 */
export async function getContactsForConversations(
  partnerId: string,
  phoneNumbers: string[]
): Promise<Map<string, Contact>> {
  const contactMap = new Map<string, Contact>();
  
  // Firestore 'in' queries are limited to 10 items, so we need to batch
  const chunks = chunkArray(phoneNumbers, 10);
  
  for (const chunk of chunks) {
    const contactsRef = collection(db, `partners/${partnerId}/contacts`);
    const q = query(contactsRef, where('phone', 'in', chunk));
    const snapshot = await getDocs(q);
    
    snapshot.docs.forEach(doc => {
      const contact = { id: doc.id, ...doc.data() } as Contact;
      contactMap.set(contact.phone, contact);
    });
  }
  
  return contactMap;
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}