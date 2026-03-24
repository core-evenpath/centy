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
  usedIn: string;
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
  // ── Text Generation (Gemini 3.1 Pro) ──────────────────────────────
  {
    processId: 'document-processing',
    label: 'Document Processing & RAG',
    description: 'Core document analysis, transcription, and RAG responses',
    category: 'generation',
    currentModel: 'gemini-3.1-pro-preview',
    provider: 'Google',
    sourceFile: 'gemini-service.ts',
    usedIn: '/partner/vault, /api/vault/*',
  },
  {
    processId: 'relay-chat',
    label: 'Relay Chat (Public Widget)',
    description: 'Customer-facing chat widget on partner websites',
    category: 'generation',
    currentModel: 'gemini-3.1-pro-preview',
    provider: 'Google',
    sourceFile: 'relay/chat/route.ts',
    usedIn: 'https://*.pingbox.io, /api/relay/chat',
  },
  {
    processId: 'inbox-suggestions',
    label: 'Inbox Fast Suggestions',
    description: 'Quick reply suggestions for inbox messages',
    category: 'generation',
    currentModel: 'gemini-3.1-pro-preview',
    provider: 'Google',
    sourceFile: 'inbox-fast-actions.ts',
    usedIn: '/partner/inbox',
  },
  {
    processId: 'data-import',
    label: 'Data Import Mapping',
    description: 'CSV column mapping to schema fields during import',
    category: 'generation',
    currentModel: 'gemini-3.1-pro-preview',
    provider: 'Google',
    sourceFile: 'import-actions.ts',
    usedIn: '/partner/settings/import-center',
  },
  {
    processId: 'tag-extraction',
    label: 'Tag Extraction',
    description: 'Automatic tag extraction from documents and content',
    category: 'generation',
    currentModel: 'gemini-3.1-pro-preview',
    provider: 'Google',
    sourceFile: 'tag-extraction.ts',
    usedIn: '/partner/vault',
  },
  {
    processId: 'partnerhub-ai',
    label: 'PartnerHub AI Actions',
    description: 'AI-powered partner hub features and automation',
    category: 'generation',
    currentModel: 'gemini-3.1-pro-preview',
    provider: 'Google',
    sourceFile: 'partnerhub-actions.ts',
    usedIn: '/partner/* (multiple partner pages)',
  },

  // ── Text Generation (Anthropic) ───────────────────────────────────
  {
    processId: 'default-anthropic',
    label: 'Default Anthropic Model',
    description: 'Default model for Anthropic API calls (relay, modules, imports)',
    category: 'generation',
    currentModel: 'claude-sonnet-4-20250514',
    provider: 'Anthropic',
    sourceFile: 'anthropic.ts',
    usedIn: '/admin/modules, /partner/relay, /partner/settings',
  },
  {
    processId: 'module-generation',
    label: 'Module Schema Generation',
    description: 'Generates comprehensive module configs, schemas, and fields using Gemini',
    category: 'generation',
    currentModel: 'gemini-3.1-pro-preview',
    provider: 'Google',
    sourceFile: 'module-generator-actions.ts',
    usedIn: '/partner/settings/ai-workflow, /admin/modules',
  },
  {
    processId: 'module-ai-actions',
    label: 'Module AI Operations',
    description: 'AI-powered module operations: bulk generation, field suggestions, and discovery',
    category: 'generation',
    currentModel: 'gemini-3.1-pro-preview',
    provider: 'Google',
    sourceFile: 'module-ai-actions.ts',
    usedIn: '/admin/modules, /api/admin/seed-modules',
  },

  // ── Text Generation (Gemini 2.5 Flash) ────────────────────────────
  {
    processId: 'persona-generation',
    label: 'Persona Generation',
    description: 'Customer persona extraction from conversation history',
    category: 'generation',
    currentModel: 'gemini-2.5-flash',
    provider: 'Google',
    sourceFile: 'persona-generator.ts',
    usedIn: '/partner/settings',
  },
  {
    processId: 'template-generation',
    label: 'Template Generation',
    description: 'Generates system templates for business industries',
    category: 'generation',
    currentModel: 'gemini-2.5-flash',
    provider: 'Google',
    sourceFile: 'template-generator-actions.ts',
    usedIn: '/admin/templates',
  },
  {
    processId: 'broadcast-ideas',
    label: 'Broadcast Idea Generation',
    description: 'Generates marketing campaign ideas for WhatsApp broadcasts',
    category: 'generation',
    currentModel: 'gemini-2.5-flash',
    provider: 'Google',
    sourceFile: 'broadcast-idea-actions.ts',
    usedIn: '/partner/broadcast',
  },
  {
    processId: 'broadcast-images',
    label: 'Broadcast Image Prompts',
    description: 'Generates image prompts for broadcast marketing content',
    category: 'generation',
    currentModel: 'gemini-2.5-flash',
    provider: 'Google',
    sourceFile: 'broadcast-image-actions.ts',
    usedIn: '/partner/broadcast',
  },
  {
    processId: 'business-autofill',
    label: 'Business Profile Autofill',
    description: 'Auto-populates business profiles from web search data',
    category: 'generation',
    currentModel: 'gemini-2.5-flash',
    provider: 'Google',
    sourceFile: 'business-autofill-service.ts',
    usedIn: '/partner/settings, /partner/settings/import-center',
  },
  {
    processId: 'hotel-import',
    label: 'Hotel Import Extraction',
    description: 'Hotel inventory extraction with Google Search grounding',
    category: 'generation',
    currentModel: 'gemini-2.5-flash',
    provider: 'Google',
    sourceFile: 'hotel-import-service.ts',
    usedIn: '/partner/settings (via autofill)',
  },
  {
    processId: 'website-scraping',
    label: 'Website Content Extraction',
    description: 'Multi-pass website scraping and content extraction',
    category: 'generation',
    currentModel: 'gemini-2.5-flash',
    provider: 'Google',
    sourceFile: 'website-scrape-service.ts',
    usedIn: '/partner/settings, /partner/settings/import-center',
  },
  {
    processId: 'profile-tags',
    label: 'Profile Tag Generation',
    description: 'Deep analysis profile tags and customer search tags',
    category: 'generation',
    currentModel: 'gemini-2.5-flash',
    provider: 'Google',
    sourceFile: 'profile-tags-actions.ts',
    usedIn: '/partner/settings/import-center',
  },
  {
    processId: 'business-persona',
    label: 'Business Persona Extraction',
    description: 'Extracts business persona from conversation context',
    category: 'generation',
    currentModel: 'gemini-2.5-flash',
    provider: 'Google',
    sourceFile: 'business-persona-actions.ts',
    usedIn: '/partner/settings, /partner/agents, /partner/settings/core-data',
  },

  // ── Retrieval & Search ────────────────────────────────────────────
  {
    processId: 'rag-query-engine',
    label: 'RAG Query Engine',
    description: 'Knowledge base retrieval and query answering',
    category: 'retrieval',
    currentModel: 'gemini-3.1-pro-preview',
    provider: 'Google',
    sourceFile: 'rag-query-engine.ts',
    usedIn: '/partner/vault, /api/vault/chat',
  },
  {
    processId: 'vault-queries',
    label: 'Vault Document Queries',
    description: 'Claude-powered vault document analysis with prompt caching',
    category: 'retrieval',
    currentModel: 'claude-3-5-haiku-20241022',
    provider: 'Anthropic',
    sourceFile: 'claude-rag.ts',
    usedIn: '/partner/vault, /api/vault/query',
  },
  {
    processId: 'conversation-rag',
    label: 'Conversation RAG',
    description: 'Combines vault documents with conversation history for context-aware responses',
    category: 'retrieval',
    currentModel: 'gemini-2.5-flash',
    provider: 'Google',
    sourceFile: 'conversation-rag-actions.ts',
    usedIn: 'Internal service (vault + conversation context)',
  },

  // ── Image Generation ──────────────────────────────────────────────
  {
    processId: 'image-generation',
    label: 'Image Generation',
    description: 'AI image generation and editing',
    category: 'image',
    currentModel: 'gemini-2.5-flash-image',
    provider: 'Google',
    sourceFile: 'gemini-service.ts',
    usedIn: '/partner/vault',
  },

  // ── Embeddings ────────────────────────────────────────────────────
  {
    processId: 'embeddings',
    label: 'Vector Embeddings',
    description: 'Document chunk embeddings for semantic search',
    category: 'embedding',
    currentModel: 'text-embedding-004',
    provider: 'Google',
    sourceFile: 'gemini-service.ts',
    usedIn: '/partner/vault (document indexing)',
  },
];
