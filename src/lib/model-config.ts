// src/lib/model-config.ts
// Shared constants for AI model configuration — importable from both client and server

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
