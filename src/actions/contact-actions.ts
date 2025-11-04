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
  // Generic CRM fields
  company?: string;
  lifetimeValue?: string;
  category?: string;
  notes?: string;
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
      company: input.company || '',
      lifetimeValue: input.lifetimeValue || '',
      category: input.category || '',
      notes: input.notes || '',
      createdAt: FieldValue.serverTimestamp() as any,
      updatedAt: FieldValue.serverTimestamp() as any,
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

interface UpdateContactInput {
  partnerId: string;
  contactId: string;
  name: string;
  email?: string;
  phone: string;
  status: 'active' | 'inactive';
  groups?: string[];
  // Generic CRM fields
  lifetimeValue?: string;
  company?: string;
  category?: string;
}

export async function updateContactAction(input: UpdateContactInput): Promise<{
  success: boolean;
  message: string;
}> {
  if (!db) {
    return {
      success: false,
      message: "Database not available",
    };
  }

  const { partnerId, contactId, ...updateData } = input;

  if (!partnerId || !contactId || !updateData.name || !updateData.phone) {
    return {
      success: false,
      message: "Partner ID, contact ID, name, and phone are required",
    };
  }

  try {
    const contactRef = db.collection(`partners/${partnerId}/contacts`).doc(contactId);

    // Verify the contact belongs to the partner before updating
    const contactDoc = await contactRef.get();
    if (!contactDoc.exists || contactDoc.data()?.partnerId !== partnerId) {
      return {
        success: false,
        message: "Contact not found or you do not have permission to edit it.",
      };
    }

    await contactRef.update({
      ...updateData,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: "Contact updated successfully",
    };
  } catch (error: any) {
    console.error("Error updating contact:", error);
    return {
      success: false,
      message: `Failed to update contact: ${error.message}`,
    };
  }
}

export async function deleteContactAction(partnerId: string, contactId: string): Promise<{
  success: boolean;
  message: string;
}> {
  if (!db) {
    return {
      success: false,
      message: "Database not available",
    };
  }

  if (!partnerId || !contactId) {
    return {
      success: false,
      message: "Partner ID and contact ID are required",
    };
  }

  try {
    const contactRef = db.collection(`partners/${partnerId}/contacts`).doc(contactId);

    // Verify the contact belongs to the partner before deleting
    const contactDoc = await contactRef.get();
    if (!contactDoc.exists || contactDoc.data()?.partnerId !== partnerId) {
      return {
        success: false,
        message: "Contact not found or you do not have permission to delete it.",
      };
    }

    await contactRef.delete();

    return {
      success: true,
      message: "Contact deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting contact:", error);
    return {
      success: false,
      message: `Failed to delete contact: ${error.message}`,
    };
  }
}