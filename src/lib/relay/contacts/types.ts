// Phase 1 Identity — canonical cross-conversation contact record.
//
// Per ADR-P4-01 §Schema: one contact doc per (partnerId, phone)
// pair. Phone is in E.164 form, source of truth. Same phone across
// different conversations from the same partner resolves to the
// same contact.
//
// Strict invariant: **no engine-specific fields on Contact**. Cart,
// orders, bookings, and service tickets live in their own
// collections and reference `contactId`. Adding an engine field
// here requires a new ADR.
//
// Storage: top-level `contacts` collection, doc id composed as
// `{partnerId}_{phone}` — mirrors `relaySessions/{partnerId}_{conversationId}`
// for consistency. The ADR's conceptual path `contacts/{partnerId}/{phone}`
// maps to a composite doc id in this implementation.

export interface Contact {
  /** Doc id — equals E.164 phone (deterministic per partner). */
  id: string;
  partnerId: string;
  /** E.164 normalized phone. Source of truth + doc id. */
  phone: string;
  /** Optional display name; populated by partner or captured at commit. */
  name?: string;
  /** Partner-specific opaque payload; engines read/write their own keys. */
  metadata?: Record<string, unknown>;
  /** ISO timestamp. */
  createdAt: string;
  /** ISO timestamp. */
  updatedAt: string;
}

export const CONTACTS_COLLECTION = 'contacts';

/**
 * Composite doc id. Stable for a (partnerId, phone) pair; resolves to
 * the same document across conversations. Callers should normalize
 * phone with `normalizePhoneNumber` from `@/utils/phone-utils` before
 * constructing the id.
 */
export function contactDocId(partnerId: string, phone: string): string {
  return `${partnerId}_${phone}`;
}
