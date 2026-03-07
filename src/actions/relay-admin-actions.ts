'use server';

import { db } from '@/lib/firebase-admin';
import { GoogleGenAI } from '@google/genai';
import type { RelayBlockConfig, RelayBlockType } from '@/lib/types-relay';
import { FieldValue } from 'firebase-admin/firestore';

const COLLECTION = 'relayBlockConfigs';

// ===== READ =====

export async function getRelayBlockConfigs(): Promise<{ success: boolean; configs?: RelayBlockConfig[]; error?: string }> {
  try {
    const snapshot = await db.collection(COLLECTION).orderBy('createdAt', 'desc').get();
    const configs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as RelayBlockConfig);
    return { success: true, configs };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export async function getRelayBlockConfig(id: string): Promise<{ success: boolean; config?: RelayBlockConfig; error?: string }> {
  try {
    const doc = await db.collection(COLLECTION).doc(id).get();
    if (!doc.exists) return { success: false, error: 'Block config not found' };
    return { success: true, config: { id: doc.id, ...doc.data() } as RelayBlockConfig };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

// ===== CREATE / UPDATE =====

export async function createRelayBlockConfig(
  data: Omit<RelayBlockConfig, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const now = new Date().toISOString();
    const docRef = await db.collection(COLLECTION).add({
      ...data,
      createdAt: now,
      updatedAt: now,
    });
    return { success: true, id: docRef.id };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export async function updateRelayBlockConfig(
  id: string,
  data: Partial<Omit<RelayBlockConfig, 'id' | 'createdAt'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.collection(COLLECTION).doc(id).update({
      ...data,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export async function deleteRelayBlockConfig(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await db.collection(COLLECTION).doc(id).delete();
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

// ===== AI GENERATOR =====

export async function generateRelayBlocksForCategory(
  industry: string,
  businessFunction: string
): Promise<{ success: boolean; configs?: Omit<RelayBlockConfig, 'id' | 'createdAt' | 'updatedAt'>[]; error?: string }> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

    const prompt = `Generate a set of Relay UI block configurations for a ${industry} business (${businessFunction}).

For each block type relevant to this business, return a JSON array with objects matching this schema:
{
  "blockType": "rooms|book|compare|activities|location|contact|gallery|info|menu|services|text",
  "label": "Human readable label",
  "description": "What this block does",
  "applicableIndustries": ["${industry}"],
  "applicableFunctions": ["${businessFunction}"],
  "aiPromptFragment": "Instruction for the AI on when and how to use this block type (2-3 sentences)",
  "dataSchema": {
    "sourceCollection": "modules or vaultFiles",
    "sourceFields": ["field1", "field2"],
    "displayTemplate": "template_name",
    "maxItems": 6,
    "sortBy": "price",
    "sortOrder": "asc"
  },
  "defaultIntent": {
    "icon": "emoji",
    "label": "Short label",
    "prompt": "What gets sent to AI when user taps this intent"
  },
  "status": "active"
}

Generate 4-6 blocks most relevant to this business type. Return ONLY valid JSON array.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '[]';
    const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    const configs = JSON.parse(cleaned);

    if (!Array.isArray(configs)) {
      return { success: false, error: 'AI returned invalid format' };
    }

    const validBlockTypes: RelayBlockType[] = [
      'rooms', 'book', 'compare', 'activities', 'location',
      'contact', 'gallery', 'info', 'menu', 'services', 'text'
    ];

    const validConfigs = configs.filter((c: Partial<RelayBlockConfig>) =>
      c.blockType && validBlockTypes.includes(c.blockType as RelayBlockType)
    );

    return { success: true, configs: validConfigs };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}
