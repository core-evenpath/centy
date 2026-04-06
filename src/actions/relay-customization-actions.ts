'use server';

import { revalidatePath } from 'next/cache';
import { db as adminDb } from '@/lib/firebase-admin';
import { GoogleGenAI } from '@google/genai';
import { getGlobalBlockConfigs, getBlockConfig } from '@/lib/relay/block-config-service';

export interface PartnerBlockOverride {
  enabled: boolean;
  fieldPriority?: string[];
  labelOverrides?: Record<string, string>;
  customConfig?: Record<string, any>;
}

export interface PartnerHomeScreenOverride {
  sectionOrder?: string[];
  hiddenSections?: string[];
}

export interface PartnerRelayCustomization {
  blockOverrides: Record<string, PartnerBlockOverride>;
  homeScreenOverrides: PartnerHomeScreenOverride;
  flowTemplateId?: string;
  updatedAt: string;
}

export async function getPartnerCustomizationAction(
  partnerId: string
): Promise<{
  success: boolean;
  customization?: PartnerRelayCustomization;
  error?: string;
}> {
  try {
    if (!adminDb) {
      return { success: false, error: 'Database not available' };
    }

    const doc = await adminDb
      .collection(`partners/${partnerId}/relayConfig`)
      .doc('blockOverrides')
      .get();

    if (!doc.exists) {
      return {
        success: true,
        customization: {
          blockOverrides: {},
          homeScreenOverrides: {},
          updatedAt: '',
        },
      };
    }

    const data = doc.data() || {};

    return {
      success: true,
      customization: {
        blockOverrides: data.blockOverrides || {},
        homeScreenOverrides: data.homeScreenOverrides || {},
        flowTemplateId: data.flowTemplateId || undefined,
        updatedAt: data.updatedAt || '',
      },
    };
  } catch (error: any) {
    console.error('[Customization] Failed to get partner customization:', error);
    return { success: false, error: error.message };
  }
}

export async function savePartnerCustomizationAction(
  partnerId: string,
  customization: Omit<PartnerRelayCustomization, 'updatedAt'>
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!adminDb) {
      return { success: false, error: 'Database not available' };
    }

    const now = new Date().toISOString();

    await adminDb
      .collection(`partners/${partnerId}/relayConfig`)
      .doc('blockOverrides')
      .set(
        {
          ...customization,
          updatedAt: now,
        },
        { merge: true }
      );

    revalidatePath('/partner/relay');

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleBlockAction(
  partnerId: string,
  blockId: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!adminDb) {
      return { success: false, error: 'Database not available' };
    }

    if (!(await getBlockConfig(blockId))) {
      return { success: false, error: `Block "${blockId}" not found in registry` };
    }

    const docRef = adminDb
      .collection(`partners/${partnerId}/relayConfig`)
      .doc('blockOverrides');

    const doc = await docRef.get();
    const data = doc.exists ? doc.data() || {} : {};
    const overrides: Record<string, PartnerBlockOverride> = data.blockOverrides || {};

    if (overrides[blockId]) {
      overrides[blockId].enabled = enabled;
    } else {
      overrides[blockId] = { enabled };
    }

    await docRef.set(
      {
        blockOverrides: overrides,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    revalidatePath('/partner/relay');

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function setBlockFieldPriorityAction(
  partnerId: string,
  blockId: string,
  fieldPriority: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!adminDb) {
      return { success: false, error: 'Database not available' };
    }

    const docRef = adminDb
      .collection(`partners/${partnerId}/relayConfig`)
      .doc('blockOverrides');

    const doc = await docRef.get();
    const data = doc.exists ? doc.data() || {} : {};
    const overrides: Record<string, PartnerBlockOverride> = data.blockOverrides || {};

    if (!overrides[blockId]) {
      overrides[blockId] = { enabled: true };
    }
    overrides[blockId].fieldPriority = fieldPriority;

    await docRef.set(
      {
        blockOverrides: overrides,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    revalidatePath('/partner/relay');

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function setBlockLabelOverridesAction(
  partnerId: string,
  blockId: string,
  labelOverrides: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!adminDb) {
      return { success: false, error: 'Database not available' };
    }

    const docRef = adminDb
      .collection(`partners/${partnerId}/relayConfig`)
      .doc('blockOverrides');

    const doc = await docRef.get();
    const data = doc.exists ? doc.data() || {} : {};
    const overrides: Record<string, PartnerBlockOverride> = data.blockOverrides || {};

    if (!overrides[blockId]) {
      overrides[blockId] = { enabled: true };
    }
    overrides[blockId].labelOverrides = labelOverrides;

    await docRef.set(
      {
        blockOverrides: overrides,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    revalidatePath('/partner/relay');

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateHomeScreenOverridesAction(
  partnerId: string,
  homeScreenOverrides: PartnerHomeScreenOverride
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!adminDb) {
      return { success: false, error: 'Database not available' };
    }

    await adminDb
      .collection(`partners/${partnerId}/relayConfig`)
      .doc('blockOverrides')
      .set(
        {
          homeScreenOverrides,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

    revalidatePath('/partner/relay');

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function assignFlowToPartnerAction(
  partnerId: string,
  flowTemplateId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!adminDb) {
      return { success: false, error: 'Database not available' };
    }

    const templateDoc = await adminDb
      .collection('systemFlowTemplates')
      .doc(flowTemplateId)
      .get();

    if (!templateDoc.exists) {
      return { success: false, error: 'Flow template not found' };
    }

    await adminDb
      .collection(`partners/${partnerId}/relayConfig`)
      .doc('blockOverrides')
      .set(
        {
          flowTemplateId,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

    revalidatePath('/partner/relay');

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function applyPartnerPromptAction(
  partnerId: string,
  prompt: string
): Promise<{
  success: boolean;
  changes?: Array<{
    blockId: string;
    changeType: 'field_priority' | 'label_override' | 'toggle' | 'config';
    description: string;
    before?: any;
    after?: any;
  }>;
  error?: string;
}> {
  if (!adminDb) {
    return { success: false, error: 'Database not available' };
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'AI service not configured' };
  }

  try {
    const allBlocks = await getGlobalBlockConfigs();
    const blockSummary = allBlocks
      .map(
        (b) =>
          `- ${b.id} (${b.label}): fields=[${b.fields_req
            .concat(b.fields_opt)
            .join(', ')}]`
      )
      .join('\n');

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You interpret natural language customization requests for a chat commerce widget. The widget shows product blocks with various fields. You output ONLY valid JSON describing the changes.

Available blocks and their fields:
${blockSummary}

Change types:
- field_priority: reorder which fields show first (array of field IDs)
- label_override: change a display label (e.g. "Add to Bag" → "Order Now")
- toggle: enable/disable a block (boolean)
- config: change block config (key-value)

Respond with JSON:
{"changes": [{"blockId": "...", "changeType": "...", "key": "...", "value": ...}]}`;

    const result = await ai.models.generateContent({
      model: process.env.RELAY_AI_MODEL || 'gemini-2.5-flash',
      contents: `Partner request: "${prompt}"`,
      config: {
        systemInstruction,
        temperature: 0.3,
        maxOutputTokens: 500,
        responseMimeType: 'application/json',
      },
    });

    const responseText = (result.text || '').trim();

    let parsed: any;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      return { success: false, error: 'AI returned invalid JSON' };
    }

    if (!parsed || !Array.isArray(parsed.changes)) {
      return { success: false, error: 'AI did not return valid changes' };
    }

    const docRef = adminDb
      .collection(`partners/${partnerId}/relayConfig`)
      .doc('blockOverrides');

    const doc = await docRef.get();
    const data = doc.exists ? doc.data() || {} : {};
    const overrides: Record<string, PartnerBlockOverride> = data.blockOverrides || {};

    const appliedChanges: Array<{
      blockId: string;
      changeType: 'field_priority' | 'label_override' | 'toggle' | 'config';
      description: string;
      before?: any;
      after?: any;
    }> = [];

    for (const change of parsed.changes) {
      const blockId = change.blockId;
      const blockExists = allBlocks.some(b => b.id === blockId);
      if (!blockId || !blockExists) continue;

      if (!overrides[blockId]) {
        overrides[blockId] = { enabled: true };
      }

      switch (change.changeType) {
        case 'field_priority': {
          const before = overrides[blockId].fieldPriority;
          overrides[blockId].fieldPriority = change.value;
          appliedChanges.push({
            blockId,
            changeType: 'field_priority',
            description: `Reordered fields: ${(change.value as string[]).join(', ')}`,
            before,
            after: change.value,
          });
          break;
        }
        case 'label_override': {
          if (!overrides[blockId].labelOverrides) {
            overrides[blockId].labelOverrides = {};
          }
          const key = change.key || '';
          const before = overrides[blockId].labelOverrides![key];
          overrides[blockId].labelOverrides![key] = change.value;
          appliedChanges.push({
            blockId,
            changeType: 'label_override',
            description: `Changed "${key}" label to "${change.value}"`,
            before,
            after: change.value,
          });
          break;
        }
        case 'toggle': {
          const before = overrides[blockId].enabled;
          overrides[blockId].enabled = !!change.value;
          appliedChanges.push({
            blockId,
            changeType: 'toggle',
            description: change.value ? `Enabled ${blockId}` : `Disabled ${blockId}`,
            before,
            after: change.value,
          });
          break;
        }
        case 'config': {
          if (!overrides[blockId].customConfig) {
            overrides[blockId].customConfig = {};
          }
          const key = change.key || '';
          overrides[blockId].customConfig![key] = change.value;
          appliedChanges.push({
            blockId,
            changeType: 'config',
            description: `Set ${key} = ${JSON.stringify(change.value)}`,
          });
          break;
        }
      }
    }

    if (appliedChanges.length > 0) {
      await docRef.set(
        {
          blockOverrides: overrides,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      revalidatePath('/partner/relay');
    }

    return { success: true, changes: appliedChanges };
  } catch (error: any) {
    console.error('[Customization] Prompt application failed:', error);
    return { success: false, error: error.message };
  }
}

export async function resetPartnerCustomizationAction(
  partnerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!adminDb) {
      return { success: false, error: 'Database not available' };
    }

    await adminDb
      .collection(`partners/${partnerId}/relayConfig`)
      .doc('blockOverrides')
      .delete();

    revalidatePath('/partner/relay');

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
