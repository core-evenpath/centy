'use server';

import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// All processes that use AI models in the system
export interface ModelProcessConfig {
  processId: string;
  label: string;
  description: string;
  category: 'generation' | 'embedding' | 'image' | 'retrieval';
  currentModel: string;
  provider: 'Google' | 'Anthropic' | 'OpenAI';
  sourceFile: string;
}

export interface SystemModelConfig {
  [processId: string]: {
    model: string;
    provider: string;
    updatedAt?: string;
    updatedBy?: string;
  };
}

// Available models grouped by provider
export const AVAILABLE_MODELS = {
  Google: [
    { value: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro Preview', capability: 'Text, Image, Video, Audio, PDF' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', capability: 'Text, Image, Video, Audio' },
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', capability: 'Fast, lightweight tasks' },
    { value: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash Image', capability: 'Image generation' },
    { value: 'text-embedding-004', label: 'Text Embedding 004', capability: 'Embeddings only' },
  ],
  Anthropic: [
    { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4', capability: 'Best quality, slower' },
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude Sonnet 3.5', capability: 'Great quality, balanced' },
    { value: 'claude-3-5-haiku-20241022', label: 'Claude Haiku 3.5', capability: 'Fast, cost-effective' },
  ],
  OpenAI: [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini', capability: 'Fast, affordable' },
  ],
} as const;

// Default process configurations (what's currently hardcoded)
export const DEFAULT_PROCESSES: ModelProcessConfig[] = [
  {
    processId: 'document-processing',
    label: 'Document Processing & RAG',
    description: 'Core document analysis, transcription, and RAG responses',
    category: 'generation',
    currentModel: 'gemini-3.1-pro-preview',
    provider: 'Google',
    sourceFile: 'gemini-service.ts',
  },
  {
    processId: 'relay-chat',
    label: 'Relay Chat (Public Widget)',
    description: 'Customer-facing chat widget on partner websites',
    category: 'generation',
    currentModel: 'gemini-3.1-pro-preview',
    provider: 'Google',
    sourceFile: 'relay/chat/route.ts',
  },
  {
    processId: 'inbox-suggestions',
    label: 'Inbox Fast Suggestions',
    description: 'Quick reply suggestions for inbox messages',
    category: 'generation',
    currentModel: 'gemini-3.1-pro-preview',
    provider: 'Google',
    sourceFile: 'inbox-fast-actions.ts',
  },
  {
    processId: 'data-import',
    label: 'Data Import Mapping',
    description: 'CSV column mapping to schema fields during import',
    category: 'generation',
    currentModel: 'gemini-3.1-pro-preview',
    provider: 'Google',
    sourceFile: 'import-actions.ts',
  },
  {
    processId: 'rag-query-engine',
    label: 'RAG Query Engine',
    description: 'Knowledge base retrieval and query answering',
    category: 'retrieval',
    currentModel: 'gemini-3.1-pro-preview',
    provider: 'Google',
    sourceFile: 'rag-query-engine.ts',
  },
  {
    processId: 'tag-extraction',
    label: 'Tag Extraction',
    description: 'Automatic tag extraction from documents and content',
    category: 'generation',
    currentModel: 'gemini-3.1-pro-preview',
    provider: 'Google',
    sourceFile: 'tag-extraction.ts',
  },
  {
    processId: 'partnerhub-ai',
    label: 'PartnerHub AI Actions',
    description: 'AI-powered partner hub features and automation',
    category: 'generation',
    currentModel: 'gemini-3.1-pro-preview',
    provider: 'Google',
    sourceFile: 'partnerhub-actions.ts',
  },
  {
    processId: 'vault-queries',
    label: 'Vault Document Queries',
    description: 'Claude-powered vault document analysis with prompt caching',
    category: 'retrieval',
    currentModel: 'claude-3-5-haiku-20241022',
    provider: 'Anthropic',
    sourceFile: 'claude-rag.ts',
  },
  {
    processId: 'default-anthropic',
    label: 'Default Anthropic Model',
    description: 'Default model for Anthropic API calls',
    category: 'generation',
    currentModel: 'claude-sonnet-4-20250514',
    provider: 'Anthropic',
    sourceFile: 'anthropic.ts',
  },
  {
    processId: 'persona-generation',
    label: 'Persona Generation',
    description: 'Customer persona extraction from conversation history',
    category: 'generation',
    currentModel: 'gemini-2.5-flash',
    provider: 'Google',
    sourceFile: 'persona-generator.ts',
  },
  {
    processId: 'image-generation',
    label: 'Image Generation',
    description: 'AI image generation and editing',
    category: 'image',
    currentModel: 'gemini-2.5-flash-image',
    provider: 'Google',
    sourceFile: 'gemini-service.ts',
  },
  {
    processId: 'embeddings',
    label: 'Vector Embeddings',
    description: 'Document chunk embeddings for semantic search',
    category: 'embedding',
    currentModel: 'text-embedding-004',
    provider: 'Google',
    sourceFile: 'gemini-service.ts',
  },
];

const CONFIG_DOC_PATH = 'system/modelConfig';

export async function getSystemModelConfig(): Promise<SystemModelConfig> {
  if (!db) {
    // Return defaults from hardcoded values
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
      // Return defaults
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
