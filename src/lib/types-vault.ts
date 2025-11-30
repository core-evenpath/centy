export interface VaultFileTags {
    primaryCategory: string;
    topics: string[];
    entities: string[];
    keywords: string[];
    documentType: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
    language?: string;
    dateReferences?: string[];
    confidence: number;
    extractedAt: string;
    version: number;
}

export interface VaultFileRagMetadata {
    chunkSize: number;
    chunkOverlap: number;
    embeddingModel: string;
    embeddingDimension: number;
    estimatedChunks: number;
    actualChunks?: number;
    actualEmbeddings?: number;
    extractedTextLength: number;
    indexedAt?: string;
    processingTimeMs?: number;
    processingStartedAt: string;
    processingCompletedAt?: string;
    hasMetadata: boolean;
    metadataKeys: string[];
}

export interface VaultFile {
    id: string;
    name: string;
    displayName: string;
    mimeType: string;
    sizeBytes: number;
    uri: string;
    state: 'PROCESSING' | 'ACTIVE' | 'FAILED';
    uploadedAt: string;
    uploadedBy: string;
    uploadedByEmail?: string;
    partnerId: string;
    geminiFileUri?: string;
    geminiFileName?: string;
    createdAt: string;
    errorMessage?: string;
    firebaseStoragePath: string;
    metadata?: Record<string, any>;
    sourceType?: 'upload' | 'training' | 'conversation';
    conversationId?: string;
    conversationPlatform?: 'sms' | 'whatsapp';
    customerPhone?: string;
    customerName?: string;
    processingStep?: number;
    processingDescription?: string;
    ragMetadata?: VaultFileRagMetadata;
    extractedText?: string;
    trainingData?: string;
    tags?: VaultFileTags;
    tagsStatus?: 'pending' | 'processing' | 'completed' | 'failed';
    tagsError?: string;
}

export interface FileSearchStore {
    id: string;
    name: string;
    displayName: string;
    partnerId: string;
    createdAt: string;
    updatedAt: string;
    fileCount: number;
    totalSizeBytes: number;
    state: 'ACTIVE' | 'INACTIVE';
}

export interface GroundingChunk {
    content: string;
    source: string;
    sourceFileId?: string;
    sourceFileName?: string;
    score?: number;
    pageNumber?: number;
}

export interface VaultQuerySource {
    fileId: string;
    fileName: string;
    relevanceScore: number;
    excerpts: string[];
    tags?: string[];
}

export interface VaultQueryResult {
    success: boolean;
    message: string;
    response?: string;
    sources?: VaultQuerySource[];
    groundingChunks?: GroundingChunk[];
    consolidatedTags?: string[];
    usage?: {
        model: string;
        inputTokens?: number;
        outputTokens?: number;
    };
    timings?: {
        totalMs: number;
        retrievalMs: number;
        generationMs: number;
    };
    queryId?: string;
}

export interface VaultQuery {
    id: string;
    query: string;
    response: string;
    partnerId: string;
    userId: string;
    selectedFileIds?: string[];
    selectedFileNames?: string[];
    provider: 'gemini-3-pro';
    sources?: VaultQuerySource[];
    consolidatedTags?: string[];
    usage?: {
        model: string;
        inputTokens?: number;
        outputTokens?: number;
    };
    timings?: {
        totalMs: number;
        retrievalMs: number;
        generationMs: number;
    };
    createdAt: string;
}

export interface TagExtractionResult {
    success: boolean;
    message: string;
    tags?: VaultFileTags;
    processingTimeMs?: number;
}

export interface UploadFileResult {
    success: boolean;
    message: string;
    file?: VaultFile;
}

export interface DeleteFileResult {
    success: boolean;
    message: string;
    deletedFrom?: {
        gemini: boolean;
        storage: boolean;
        firestore: boolean;
    };
}