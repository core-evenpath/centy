// src/actions/contact-actions.ts
'use server';

import { db } from '../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Contact } from '../lib/types';
import {
  normalizePhoneNumber,
  isValidPhoneNumber,
} from '@/utils/phone-utils';
import {
  CONTACTS_COLLECTION,
  contactDocId,
  type Contact as RelayContact,
} from '@/lib/relay/contacts/types';

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

// ── Phase 1 Identity — runtime contact resolution ─────────────────────
//
// Per ADR-P4-01 §Schema + §Anon handling. Resolves a raw phone string
// to a canonical contact doc at `contacts/{partnerId}_{phone}` (top-
// level collection, composite doc id mirroring relaySessions).
//
// Distinct from the CRM contact CRUD above (which writes
// `partners/{partnerId}/contacts/{autoId}` with name/email/groups/etc.).
// The runtime contact has a tight ADR-defined shape with no engine-
// specific fields.
//
// NOT health-gated: identity resolution is a prerequisite for commit
// actions, not itself a commit action. Gating fires at commit (order-
// create, booking-confirm) via `requireIdentityOrThrow` (Phase 1 M04).

export interface ResolveContactSuccess {
  success: true;
  contactId: string;
  created: boolean;
}

export interface ResolveContactFailure {
  success: false;
  error: string;
  code: 'INVALID_PARTNER' | 'INVALID_PHONE' | 'INTERNAL_ERROR';
}

export type ResolveContactResult = ResolveContactSuccess | ResolveContactFailure;

export async function resolveContact(
  partnerId: string,
  phone: string,
): Promise<ResolveContactResult> {
  if (!partnerId) {
    return {
      success: false,
      error: 'partnerId is required',
      code: 'INVALID_PARTNER',
    };
  }

  const normalizedPhone = normalizePhoneNumber(phone);
  if (!normalizedPhone || !isValidPhoneNumber(normalizedPhone)) {
    return {
      success: false,
      error: `Phone number could not be normalized to E.164: ${phone}`,
      code: 'INVALID_PHONE',
    };
  }

  const docId = contactDocId(partnerId, normalizedPhone);
  const ref = db.collection(CONTACTS_COLLECTION).doc(docId);

  try {
    const snap = await ref.get();
    if (snap.exists) {
      return {
        success: true,
        contactId: normalizedPhone,
        created: false,
      };
    }

    const now = new Date().toISOString();
    const contact: RelayContact = {
      id: normalizedPhone,
      partnerId,
      phone: normalizedPhone,
      createdAt: now,
      updatedAt: now,
    };
    await ref.set(contact);

    return {
      success: true,
      contactId: normalizedPhone,
      created: true,
    };
  } catch (error: any) {
    console.error('[contact-actions] resolveContact failed', {
      partnerId,
      phone,
      err: error?.message,
    });
    return {
      success: false,
      error: error?.message ?? 'Internal error resolving contact',
      code: 'INTERNAL_ERROR',
    };
  }
}