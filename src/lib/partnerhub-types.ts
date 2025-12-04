// src/lib/partnerhub-types.ts
// ============================================================================
// PARTNERHUB TYPE DEFINITIONS
// Types for Inbox (AI Chat) and Core Memory (Assets/Agents) features
// ============================================================================

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// ENUMS
// ============================================================================

export enum ProcessingStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    ACTIVE = 'ACTIVE',
}

export enum FileCategory {
    DOCUMENT = 'document',
    IMAGE = 'image',
    VIDEO = 'video',
    AUDIO = 'audio',
    SPREADSHEET = 'spreadsheet',
    PRESENTATION = 'presentation',
    CODE = 'code',
    OTHER = 'other',
}

export enum AgentType {
    SYSTEM = 'system',
    CUSTOM = 'custom',
}

export enum ChatContextType {
    AGENT = 'agent',
    DOCUMENT = 'document',
    THREAD = 'thread',
}

// ============================================================================
// DOCUMENT MANAGEMENT
// ============================================================================

export interface DocumentMetadata {
    id: string;
    partnerId: string;
    name: string;
    originalName: string;
    mimeType: string;
    size: number;
    category: FileCategory;

    // Storage
    storagePath: string;
    storageUrl: string;
    thumbnailUrl?: string;

    // AI Processing
    status: ProcessingStatus;
    extractedText?: string;
    summary?: string;
    embedding?: number[];
    tags: string[];

    // Metadata
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
    processedAt?: Timestamp | Date;
    uploadedBy: string;

    // Error handling
    errorMessage?: string;
}

export interface DocumentUploadResult {
    success: boolean;
    documentId?: string;
    error?: string;
}

// ============================================================================
// CHAT & MESSAGES
// ============================================================================

export interface Attachment {
    id: string;
    type: 'image' | 'document' | 'audio' | 'video';
    name: string;
    url: string;
    mimeType: string;
    size: number;
    thumbnailUrl?: string;
}

export interface PartnerHubChatMessage {
    id: string;
    threadId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    attachments?: Attachment[];

    // AI metadata
    model?: string;
    tokensUsed?: number;
    groundingChunks?: GroundingChunk[];

    // Timestamps
    createdAt: Timestamp | Date;
    updatedAt?: Timestamp | Date;
}

export interface GroundingChunk {
    documentId: string;
    documentName: string;
    text: string;
    score: number;
}

export interface Thread {
    id: string;
    partnerId: string;
    title: string;
    description?: string;

    // Context
    contextType: ChatContextType;
    contextId?: string; // agentId or documentId

    // State
    isActive: boolean;
    isPinned: boolean;
    messageCount: number;
    lastMessageAt?: Timestamp | Date;

    // Metadata
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
    createdBy: string;
}

export interface ChatContext {
    type: ChatContextType;
    id: string;
    name: string;
    avatar?: string;
    description?: string;
}

// ============================================================================
// AGENTS & PERSONAS
// ============================================================================

export interface AgentProfile {
    id: string;
    partnerId: string;
    name: string;
    description: string;
    avatar: string;
    type: AgentType;

    // Personality
    systemPrompt: string;
    personality: AgentPersonality;
    capabilities: string[];

    // Knowledge
    knowledgeDocIds: string[];

    // Settings
    isActive: boolean;
    isDefault: boolean;
    temperature: number;
    maxTokens: number;

    // Metadata
    createdAt: Timestamp | Date;
    updatedAt: Timestamp | Date;
    createdBy?: string;
    usageCount: number;
}

export interface AgentPersonality {
    tone: 'professional' | 'friendly' | 'casual' | 'formal' | 'technical';
    style: 'concise' | 'detailed' | 'balanced';
    traits: string[];
}

export interface CustomAgent extends AgentProfile {
    type: AgentType.CUSTOM;
    trainingExamples?: TrainingExample[];
}

export interface TrainingExample {
    id: string;
    userInput: string;
    idealResponse: string;
    category?: string;
    createdAt: Timestamp | Date;
}

// ============================================================================
// VECTOR SEARCH
// ============================================================================

export interface VectorSearchResult {
    documentId: string;
    documentName: string;
    text: string;
    score: number;
    metadata?: Record<string, any>;
}

export interface EmbeddingResult {
    success: boolean;
    embedding?: number[];
    error?: string;
}

// ============================================================================
// SIMULATOR / TRAINING ARENA
// ============================================================================

export interface SimulatorSession {
    id: string;
    partnerId: string;
    agentId: string;
    scenario: string;
    messages: PartnerHubChatMessage[];
    feedback?: SimulatorFeedback;
    createdAt: Timestamp | Date;
    completedAt?: Timestamp | Date;
}

export interface SimulatorFeedback {
    rating: number;
    notes: string;
    improvements: string[];
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

export interface PartnerHubState {
    // Documents
    documents: DocumentMetadata[];
    documentsLoading: boolean;
    documentsError: string | null;

    // Threads
    threads: Thread[];
    activeThreadId: string | null;
    threadsLoading: boolean;

    // Messages
    messages: PartnerHubChatMessage[];
    messagesLoading: boolean;

    // Agents
    agents: AgentProfile[];
    activeAgentId: string | null;
    agentsLoading: boolean;

    // Context
    activeContext: ChatContext | null;

    // UI State
    isUploading: boolean;
    isGenerating: boolean;
    generationStatus: string;
}

// ============================================================================
// API TYPES
// ============================================================================

export interface GenerateResponseInput {
    partnerId: string;
    threadId: string;
    message: string;
    attachments?: Attachment[];
    agentId?: string;
    documentIds?: string[];
}

export interface GenerateResponseResult {
    success: boolean;
    response?: string;
    groundingChunks?: GroundingChunk[];
    messageId?: string;
    error?: string;
}

export interface ProcessDocumentInput {
    partnerId: string;
    documentId: string;
    storagePath: string;
    mimeType: string;
}

export interface ProcessDocumentResult {
    success: boolean;
    extractedText?: string;
    summary?: string;
    embedding?: number[];
    tags?: string[];
    error?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getFileCategory(mimeType: string): FileCategory {
    if (mimeType.startsWith('image/')) return FileCategory.IMAGE;
    if (mimeType.startsWith('video/')) return FileCategory.VIDEO;
    if (mimeType.startsWith('audio/')) return FileCategory.AUDIO;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType === 'text/csv') {
        return FileCategory.SPREADSHEET;
    }
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
        return FileCategory.PRESENTATION;
    }
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text/')) {
        return FileCategory.DOCUMENT;
    }
    if (mimeType.includes('javascript') || mimeType.includes('typescript') || mimeType.includes('python') || mimeType.includes('java')) {
        return FileCategory.CODE;
    }
    return FileCategory.OTHER;
}

export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
