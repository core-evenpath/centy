// src/actions/contact-actions.ts
'use server';

import { db } from '../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Contact } from '../lib/types';

interface CreateContactInput {
  partnerId: string;
  name: string;
  email?: string;
  phone: string;
  status: 'active' | 'inactive';
  groups?: string[];
}

export async function createContactAction(input: CreateContactInput): Promise<{
  success: boolean;
  message: string;
  contactId?: string;
}> {
  if (!db) {
    return {
      success: false,
      message: "Database not available",
    };
  }

  if (!input.partnerId || !input.name || !input.phone) {
    return {
      success: false,
      message: "Partner ID, name, and phone number are required",
    };
  }

  try {
    const contactData: Partial<Contact> = {
      partnerId: input.partnerId,
      name: input.name,
      phone: input.phone,
      email: input.email || '',
      status: input.status,
      groups: input.groups || [],
      createdAt: FieldValue.serverTimestamp(),
    };

    const contactRef = await db.collection(`partners/${input.partnerId}/contacts`).add(contactData);

    return {
      success: true,
      message: "Contact created successfully",
      contactId: contactRef.id,
    };
  } catch (error: any) {
    console.error("Error creating contact:", error);
    return {
      success: false,
      message: `Failed to create contact: ${error.message}`,
    };
  }
}
