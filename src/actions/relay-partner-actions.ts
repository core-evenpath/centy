'use server';

import { db as adminDb } from '@/lib/firebase-admin';
import type { RelaySlugValidation } from '@/lib/types-relay';
import { RESERVED_SUBDOMAINS } from '@/lib/types-relay';
import type { RelayConfig } from '@/actions/relay-actions';

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]$/;

export async function validateRelaySlug(
  slug: string,
  currentPartnerId: string
): Promise<RelaySlugValidation> {
  if (!slug || slug.length < 3) {
    return { valid: false, error: 'too_short' };
  }
  if (slug.length > 48) {
    return { valid: false, error: 'too_long' };
  }
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return { valid: false, error: 'hyphen_boundary' };
  }
  if (!SLUG_REGEX.test(slug)) {
    return { valid: false, error: 'invalid_chars' };
  }
  if (RESERVED_SUBDOMAINS.has(slug)) {
    return { valid: false, error: 'reserved' };
  }

  try {
    const slugDoc = await adminDb.collection('relaySlugs').doc(slug).get();
    if (slugDoc.exists && slugDoc.data()?.partnerId !== currentPartnerId) {
      return { valid: false, error: 'taken' };
    }
  } catch {
    return { valid: false, error: 'taken' };
  }

  return { valid: true };
}

export async function updateRelaySlug(
  partnerId: string,
  slug: string
): Promise<{ success: boolean; message: string }> {
  const validation = await validateRelaySlug(slug, partnerId);
  if (!validation.valid) {
    return { success: false, message: `Invalid slug: ${validation.error}` };
  }

  try {
    const configRef = adminDb
      .collection('partners')
      .doc(partnerId)
      .collection('relayConfig')
      .doc('config');

    const configSnap = await configRef.get();
    const oldSlug = configSnap.exists ? configSnap.data()?.relaySlug : null;

    const batch = adminDb.batch();

    if (oldSlug && oldSlug !== slug) {
      batch.delete(adminDb.collection('relaySlugs').doc(oldSlug));
    }

    batch.set(adminDb.collection('relaySlugs').doc(slug), {
      partnerId,
      createdAt: new Date().toISOString(),
    });

    batch.set(
      configRef,
      { relaySlug: slug, updatedAt: new Date().toISOString() },
      { merge: true }
    );

    await batch.commit();
    return { success: true, message: 'Relay link updated' };
  } catch (e: any) {
    console.error('Failed to update relay slug:', e);
    return { success: false, message: e.message || 'Failed to update relay link' };
  }
}

export async function getRelayPartnerBySlug(
  slug: string
): Promise<{ partnerId: string; relayConfig: RelayConfig } | null> {
  try {
    const slugDoc = await adminDb.collection('relaySlugs').doc(slug).get();
    if (!slugDoc.exists) return null;

    const partnerId = slugDoc.data()?.partnerId;
    if (!partnerId) return null;

    const configSnap = await adminDb
      .collection('partners')
      .doc(partnerId)
      .collection('relayConfig')
      .doc('config')
      .get();

    if (!configSnap.exists) return null;

    return {
      partnerId,
      relayConfig: configSnap.data() as RelayConfig,
    };
  } catch {
    return null;
  }
}
