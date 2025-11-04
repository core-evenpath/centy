// src/lib/contact-enrichment-service.ts
"use client";

import type { Contact } from './types';

/**
 * Enrich a single conversation object with contact details from a pre-fetched map.
 * This is a client-side utility function.
 */
export function enrichConversationWithContact<T extends { customerPhone: string; customerName?: string; }>(
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
  // Normalize the phone number for lookup
  const normalizedPhone = conversation.customerPhone.replace(/\D/g, '');

  // Find a contact whose phone number matches when both are normalized
  let contact: Contact | undefined;
  for (const c of contactMap.values()) {
    if (c.phone && c.phone.replace(/\D/g, '') === normalizedPhone) {
      contact = c;
      break;
    }
  }

  // Fallback: If no match and customerName looks like an email, try matching by email
  if (!contact && conversation.customerName?.includes('@')) {
     for (const c of contactMap.values()) {
      if (c.email && c.email.toLowerCase() === conversation.customerName.toLowerCase()) {
        contact = c;
        break;
      }
    }
  }

  if (contact) {
    return {
      ...conversation,
      contactName: contact.name,
      contactEmail: contact.email,
      contactId: contact.id,
      clientInfo: {
        portfolio: contact.portfolio || '',
        email: contact.email || '',
        occupation: contact.occupation || '',
        accountType: contact.accountType || '',
        notes: contact.notes || '',
      },
    };
  }

  return {
    ...conversation,
    contactName: conversation.customerName, // Fallback to original name
  };
}
