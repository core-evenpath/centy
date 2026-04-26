'use server';

// ── Partner identity slice (Phase 3A) ────────────────────────────────
//
// Tiny read-only helper that resolves the partner's business persona
// down to the flat shape the identity-prefill helper consumes. Pulls
// from `partners/{id}.businessPersona.identity` plus a couple of
// fallback paths for tagline (which lives under personality/knowledge
// for some partner generations).

import { db as adminDb } from '@/lib/firebase-admin';
import type { PartnerIdentity } from '@/lib/partner/identity-prefill';

export interface GetPartnerIdentityResult {
  success: boolean;
  identity: PartnerIdentity | null;
  error?: string;
}

export async function getPartnerIdentityAction(
  partnerId: string,
): Promise<GetPartnerIdentityResult> {
  try {
    if (!partnerId) {
      return { success: false, identity: null, error: 'partnerId is required' };
    }
    const doc = await adminDb.collection('partners').doc(partnerId).get();
    if (!doc.exists) return { success: true, identity: null };
    const data = doc.data() as Record<string, any>;
    const persona = data?.businessPersona as Record<string, any> | undefined;
    const id = persona?.identity as Record<string, any> | undefined;
    if (!id) return { success: true, identity: null };

    // Tagline can live in three places depending on how the persona
    // was generated. Same precedence as buildContact in admin-block-data.
    const tagline =
      typeof persona?.personality?.tagline === 'string'
        ? persona.personality.tagline
        : typeof persona?.knowledge?.tagline === 'string'
          ? persona.knowledge.tagline
          : typeof id.tagline === 'string'
            ? id.tagline
            : undefined;

    const identity: PartnerIdentity = {
      name: pickStr(id.name),
      phone: pickStr(id.phone),
      whatsapp: pickStr(id.whatsAppNumber) ?? pickStr(id.whatsapp),
      email: pickStr(id.email),
      website: pickStr(id.website),
      country: pickStr(id.address?.country) ?? pickStr(id.country),
      city: pickStr(id.address?.city) ?? pickStr(id.city),
      street: pickStr(id.address?.street),
      currency: pickStr(id.currency),
      tagline: pickStr(tagline),
    };
    return { success: true, identity };
  } catch (err: any) {
    console.error('[partner-identity] failed:', err);
    return { success: false, identity: null, error: err?.message ?? 'unknown' };
  }
}

function pickStr(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}
