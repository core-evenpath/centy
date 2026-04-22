import 'server-only';

import { googleAI } from '@genkit-ai/google-genai';
import { FieldValue } from 'firebase-admin/firestore';

import { ai } from '@/ai/genkit';
import { db } from '@/lib/firebase-admin';
import type { BusinessPersona, BusinessPolicies } from '@/lib/business-persona-types';

// Mirror the embedder config from index-items.ts (D6: reuse same model).
const embedder = googleAI.embedder('gemini-embedding-001', {
  outputDimensionality: 768,
});

// Typed policy fields and their display labels for sectionId + text prefix.
const POLICY_FIELDS: Array<[keyof BusinessPolicies, string]> = [
  ['returnPolicy', 'return'],
  ['refundPolicy', 'refund'],
  ['warrantyInfo', 'warranty'],
  ['shippingInfo', 'shipping'],
  ['deliveryInfo', 'delivery'],
  ['cancellationPolicy', 'cancellation'],
  ['privacyPolicy', 'privacy'],
  ['termsOfService', 'terms'],
  ['paymentTerms', 'payment'],
];

function formatHours(
  operatingHours: BusinessPersona['identity']['operatingHours'] | undefined,
): string {
  if (!operatingHours) return '';
  if (operatingHours.isOpen24x7) return 'hours: open 24/7';
  if (operatingHours.appointmentOnly) return 'hours: by appointment only';
  if (operatingHours.specialNote) return `hours: ${operatingHours.specialNote}`;
  return '';
}

interface PersonaChunk {
  sectionId: string;
  kind: 'faq' | 'policy' | 'identity';
  text: string;
}

/**
 * Re-index a partner's business persona into relayRetrieval/{pid}/persona.
 *
 * Strategy: delete-then-rewrite. Clears all existing persona chunks in the
 * collection, then writes fresh chunks per strategy.md D4. Idempotent —
 * re-running produces the same end state.
 *
 * Fire-and-forget: callers MUST NOT await this on a user-facing path.
 *
 * Skips (logged, not errored) if:
 *   - Partner has no businessPersona doc
 *   - A chunk's text would be empty (e.g. policy field is '')
 */
export async function indexBusinessPersona(partnerId: string): Promise<void> {
  const start = Date.now();

  const partnerDoc = await db.collection('partners').doc(partnerId).get();
  if (!partnerDoc.exists) {
    console.warn(`[relay-index] skip persona ${partnerId}: partner missing`);
    return;
  }

  const persona = partnerDoc.data()?.businessPersona as BusinessPersona | undefined;
  if (!persona) {
    console.warn(`[relay-index] skip persona ${partnerId}: no businessPersona`);
    return;
  }

  const personaCol = db.collection('relayRetrieval').doc(partnerId).collection('persona');

  // Delete existing chunks before rewriting (resolves strategy.md open question #2:
  // faq_{i} sectionIds are order-dependent — upsert risks stale chunks on deletion).
  const existing = await personaCol.get();
  if (existing.docs.length > 0) {
    const deleteBatch = db.batch();
    for (const doc of existing.docs) {
      deleteBatch.delete(personaCol.doc(doc.id));
    }
    await deleteBatch.commit();
  }
  const cleared = existing.docs.length;

  // Build chunks from persona per strategy.md D4.
  const chunks: PersonaChunk[] = [];

  // Identity chunk: name + description + USPs + hours + contact.
  const id = persona.identity;
  if (id) {
    const parts = [
      id.name,
      persona.personality?.description,
      ...(persona.personality?.uniqueSellingPoints ?? []),
      formatHours(id.operatingHours),
      id.email ? `contact: ${id.email}` : '',
      id.phone,
    ].filter(Boolean) as string[];
    const text = parts.join(' | ');
    if (text) {
      chunks.push({ sectionId: 'identity', kind: 'identity', text });
    }
  }

  // FAQ chunks: one per non-empty knowledge.faqs[] entry.
  for (let i = 0; i < (persona.knowledge?.faqs ?? []).length; i++) {
    const faq = persona.knowledge.faqs[i];
    if (!faq.question || !faq.answer) continue;
    chunks.push({
      sectionId: `faq_${i}`,
      kind: 'faq',
      text: `Q: ${faq.question}\nA: ${faq.answer}`,
    });
  }

  // Policy chunks: one per non-empty typed policy field.
  const policies = persona.knowledge?.policies ?? {};
  for (const [field, label] of POLICY_FIELDS) {
    const text = policies[field] as string | undefined;
    if (!text) continue;
    chunks.push({
      sectionId: `policy_${label}`,
      kind: 'policy',
      text: `${label}: ${text}`,
    });
  }

  // Embed each chunk and batch-write.
  const writeBatch = db.batch();
  for (const chunk of chunks) {
    const embeddingResult = (
      await ai.embed({ embedder, content: chunk.text })
    )[0].embedding;

    writeBatch.set(personaCol.doc(chunk.sectionId), {
      text: chunk.text,
      embedding: FieldValue.vector(embeddingResult),
      partnerId,
      sectionId: chunk.sectionId,
      kind: chunk.kind,
      indexedAt: new Date().toISOString(),
    });
  }

  if (chunks.length > 0) {
    await writeBatch.commit();
  }

  const faqCount = chunks.filter((c) => c.kind === 'faq').length;
  const policyCount = chunks.filter((c) => c.kind === 'policy').length;
  const identityCount = chunks.filter((c) => c.kind === 'identity').length;
  console.log(
    `[relay-index] persona ${partnerId}: cleared=${cleared} → faqs=${faqCount} policies=${policyCount} identity=${identityCount} total=${chunks.length} in ${Date.now() - start}ms`,
  );
}
