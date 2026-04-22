import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  firestoreStore,
  makeFirestoreAdminMock,
  resetFirestoreMock,
  seedMockDoc,
} from '@/__tests__/helpers/firestore-admin-mock';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/firebase-admin', () => makeFirestoreAdminMock());
vi.mock('@/ai/genkit', () => ({
  ai: {
    embed: vi.fn(async () => [{ embedding: new Array(768).fill(0.1) }]),
  },
}));
vi.mock('@genkit-ai/google-genai', () => ({
  googleAI: {
    embedder: vi.fn(() => ({ name: 'mock-embedder' })),
  },
}));

import { indexBusinessPersona } from '../index-persona';

const PARTNER = 'p1';
const COL = `relayRetrieval/${PARTNER}/persona`;

function seedPersona(persona: Record<string, unknown>): void {
  seedMockDoc(`partners/${PARTNER}`, { businessPersona: persona });
}

function personaDocs(): string[] {
  return [...firestoreStore.keys()].filter((k) => k.startsWith(COL));
}

beforeEach(() => {
  resetFirestoreMock();
});

describe('indexBusinessPersona', () => {
  it('indexes a full persona end-to-end', async () => {
    seedPersona({
      identity: {
        name: 'Cafe Luna',
        email: 'cafe@luna.com',
        phone: '9999900000',
        operatingHours: { isOpen24x7: false },
      },
      personality: {
        description: 'A cozy specialty coffee shop.',
        uniqueSellingPoints: ['single-origin beans', 'vegan menu'],
      },
      knowledge: {
        faqs: [
          { id: 'f0', question: 'Do you take reservations?', answer: 'Yes, we do!' },
          { id: 'f1', question: 'Is there parking?', answer: 'Street parking only.' },
          { id: 'f2', question: 'Do you deliver?', answer: 'No delivery — dine-in only.' },
        ],
        policies: {
          shippingInfo: 'No shipping — in-store only.',
          returnPolicy: 'No returns on beverages.',
        },
      },
    });

    await indexBusinessPersona(PARTNER);

    const docs = personaDocs();
    expect(docs).toHaveLength(6); // 1 identity + 3 faqs + 2 policies

    const identity = firestoreStore.get(`${COL}/identity`);
    expect(identity).toBeDefined();
    expect(identity!.data.text as string).toContain('Cafe Luna');

    const faq0 = firestoreStore.get(`${COL}/faq_0`);
    expect((faq0!.data.text as string).startsWith('Q: ')).toBe(true);

    const shipping = firestoreStore.get(`${COL}/policy_shipping`);
    expect((shipping!.data.text as string).startsWith('shipping: ')).toBe(true);

    // Verify embedding populated (FieldValue.vector sentinel, not plain array)
    expect(identity!.data.embedding).toBeDefined();
  });

  it('delete-then-rewrite clears stale chunks', async () => {
    seedPersona({
      identity: { name: 'Cafe Luna', email: '', phone: '', operatingHours: { isOpen24x7: false } },
      personality: { description: '', uniqueSellingPoints: [] },
      knowledge: {
        faqs: [
          { id: 'f0', question: 'Q1', answer: 'A1' },
          { id: 'f1', question: 'Q2', answer: 'A2' },
          { id: 'f2', question: 'Q3', answer: 'A3' },
        ],
        policies: {},
      },
    });

    await indexBusinessPersona(PARTNER);
    expect(personaDocs()).toHaveLength(4); // identity + 3 faqs

    // Update source to 2 FAQs
    seedPersona({
      identity: { name: 'Cafe Luna', email: '', phone: '', operatingHours: { isOpen24x7: false } },
      personality: { description: '', uniqueSellingPoints: [] },
      knowledge: {
        faqs: [
          { id: 'f0', question: 'Q1', answer: 'A1' },
          { id: 'f1', question: 'Q2', answer: 'A2' },
        ],
        policies: {},
      },
    });

    await indexBusinessPersona(PARTNER);

    expect(firestoreStore.has(`${COL}/faq_2`)).toBe(false);
    expect(firestoreStore.has(`${COL}/faq_0`)).toBe(true);
    expect(firestoreStore.has(`${COL}/faq_1`)).toBe(true);
    expect(personaDocs()).toHaveLength(3); // identity + 2 faqs
  });

  it('reflects updated FAQ answer after re-index', async () => {
    seedPersona({
      identity: { name: 'Cafe Luna', email: '', phone: '', operatingHours: { isOpen24x7: false } },
      personality: { description: '', uniqueSellingPoints: [] },
      knowledge: {
        faqs: [{ id: 'f0', question: 'Do you deliver?', answer: 'No.' }],
        policies: {},
      },
    });

    await indexBusinessPersona(PARTNER);
    expect((firestoreStore.get(`${COL}/faq_0`)!.data.text as string)).toContain('A: No.');

    seedPersona({
      identity: { name: 'Cafe Luna', email: '', phone: '', operatingHours: { isOpen24x7: false } },
      personality: { description: '', uniqueSellingPoints: [] },
      knowledge: {
        faqs: [{ id: 'f0', question: 'Do you deliver?', answer: 'Yes, within 5km.' }],
        policies: {},
      },
    });

    await indexBusinessPersona(PARTNER);
    expect((firestoreStore.get(`${COL}/faq_0`)!.data.text as string)).toContain(
      'A: Yes, within 5km.',
    );
  });

  it('skips FAQ entries with empty question or answer', async () => {
    seedPersona({
      identity: { name: 'Shop', email: '', phone: '', operatingHours: { isOpen24x7: false } },
      personality: { description: '', uniqueSellingPoints: [] },
      knowledge: {
        faqs: [
          { id: 'f0', question: '', answer: 'Something.' },
          { id: 'f1', question: 'Valid?', answer: '' },
          { id: 'f2', question: 'Good?', answer: 'Yes!' },
        ],
        policies: {},
      },
    });

    await indexBusinessPersona(PARTNER);

    expect(firestoreStore.has(`${COL}/faq_0`)).toBe(false);
    expect(firestoreStore.has(`${COL}/faq_1`)).toBe(false);
    expect(firestoreStore.has(`${COL}/faq_2`)).toBe(true);
  });

  it('skips empty policy fields', async () => {
    seedPersona({
      identity: { name: 'Shop', email: '', phone: '', operatingHours: { isOpen24x7: false } },
      personality: { description: '', uniqueSellingPoints: [] },
      knowledge: {
        faqs: [],
        policies: {
          returnPolicy: '',
          shippingInfo: 'Ships in 3–5 days.',
        },
      },
    });

    await indexBusinessPersona(PARTNER);

    expect(firestoreStore.has(`${COL}/policy_return`)).toBe(false);
    expect(firestoreStore.has(`${COL}/policy_shipping`)).toBe(true);
  });

  it('handles partner with no businessPersona gracefully', async () => {
    seedMockDoc(`partners/${PARTNER}`, { businessName: 'Ghost Shop' });

    await expect(indexBusinessPersona(PARTNER)).resolves.toBeUndefined();
    expect(personaDocs()).toHaveLength(0);
  });

  it('indexes identity-only persona (no FAQs, no policies)', async () => {
    seedPersona({
      identity: {
        name: 'Just A Shop',
        email: 'hi@shop.com',
        phone: '123',
        operatingHours: { isOpen24x7: true },
      },
      personality: { description: '', uniqueSellingPoints: [] },
      knowledge: { faqs: [], policies: {} },
    });

    await indexBusinessPersona(PARTNER);

    expect(personaDocs()).toHaveLength(1);
    const identity = firestoreStore.get(`${COL}/identity`);
    expect(identity).toBeDefined();
    expect(identity!.data.text as string).toContain('Just A Shop');
  });
});
