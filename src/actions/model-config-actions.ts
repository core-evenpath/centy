'use server';

import { db } from '@/lib/firebase-admin';
import { DEFAULT_PROCESSES } from '@/lib/model-config';
import type { SystemModelConfig } from '@/lib/model-config';

const CONFIG_DOC_PATH = 'system/modelConfig';

export async function getSystemModelConfig(): Promise<SystemModelConfig> {
  if (!db) {
    const defaults: SystemModelConfig = {};
    for (const proc of DEFAULT_PROCESSES) {
      defaults[proc.processId] = {
        model: proc.currentModel,
        provider: proc.provider,
      };
    }
    return defaults;
  }

  try {
    const doc = await db.doc(CONFIG_DOC_PATH).get();
    if (!doc.exists) {
      const defaults: SystemModelConfig = {};
      for (const proc of DEFAULT_PROCESSES) {
        defaults[proc.processId] = {
          model: proc.currentModel,
          provider: proc.provider,
        };
      }
      return defaults;
    }
    return doc.data() as SystemModelConfig;
  } catch (error) {
    console.error('Error getting system model config:', error);
    const defaults: SystemModelConfig = {};
    for (const proc of DEFAULT_PROCESSES) {
      defaults[proc.processId] = {
        model: proc.currentModel,
        provider: proc.provider,
      };
    }
    return defaults;
  }
}

export async function updateProcessModel(
  processId: string,
  model: string,
  provider: string,
  userId: string
): Promise<{ success: boolean; message: string }> {
  if (!db) {
    return { success: false, message: 'Database not available' };
  }

  try {
    const docRef = db.doc(CONFIG_DOC_PATH);
    await docRef.set(
      {
        [processId]: {
          model,
          provider,
          updatedAt: new Date().toISOString(),
          updatedBy: userId,
        },
      },
      { merge: true }
    );

    console.log(`✅ Updated model for ${processId} to ${model} (${provider})`);
    return { success: true, message: `Updated ${processId} to ${model}` };
  } catch (error) {
    console.error('Error updating model config:', error);
    return { success: false, message: 'Failed to update model configuration' };
  }
}

export async function resetToDefaults(
  userId: string
): Promise<{ success: boolean; message: string }> {
  if (!db) {
    return { success: false, message: 'Database not available' };
  }

  try {
    const defaults: SystemModelConfig = {};
    for (const proc of DEFAULT_PROCESSES) {
      defaults[proc.processId] = {
        model: proc.currentModel,
        provider: proc.provider,
        updatedAt: new Date().toISOString(),
        updatedBy: userId,
      };
    }

    await db.doc(CONFIG_DOC_PATH).set(defaults);
    console.log('✅ Reset all model configs to defaults');
    return { success: true, message: 'All models reset to defaults' };
  } catch (error) {
    console.error('Error resetting model config:', error);
    return { success: false, message: 'Failed to reset model configuration' };
  }
}
