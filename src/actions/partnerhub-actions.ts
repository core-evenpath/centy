"use server";

// ============================================================================
// PARTNERHUB SERVER ACTIONS
// Server-side actions for document processing, AI generation, and CRUD operations
// ============================================================================

import { db, adminStorage } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import {
    ProcessingStatus,
    FileCategory,
    ChatContextType,
    getFileCategory,
    generateId,
} from '@/lib/partnerhub-types';
import {
    processDocumentWithGemini,
    generateEmbedding,
    generateRAGResponseStream,
} from '@/lib/gemini-service';



// ============================================================================
// UTILITIES
// ============================================================================

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retry wrapper for API calls with exponential backoff
 */
async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries = 5,
    initialDelay = 2000
): Promise<T> {
    let attempt = 0;
    while (attempt < retries) {
        try {
            return await fn();
        } catch (error: any) {
            const message = error?.message || '';
            const status = error?.status || error?.code || 0;

            const isRetryable =
                status === 429 ||
                status === 500 ||
                status === 503 ||
                message.includes('429') ||
                message.includes('quota') ||
                message.includes('RESOURCE_EXHAUSTED') ||
                message.includes('overloaded');

            if (isRetryable && attempt < retries - 1) {
                const delay = initialDelay * Math.pow(2, attempt) + Math.random() * 1000;
                console.warn(`API Error, retrying in ${Math.round(delay)}ms... (Attempt ${attempt + 1}/${retries})`);
                await wait(delay);
                attempt++;
            } else {
                throw error;
            }
        }
    }
    throw new Error('Max retries exceeded');
}

// ============================================================================
// DOCUMENT PROCESSING
// ============================================================================

interface ExtractionResult {
    text: string;
    tags: string[];
    summary: string;
}

/**
 * Process a document with Gemini AI to extract text, tags, and summary
 */
export async function processDocumentAction(
    partnerId: string,
    documentId: string,
    base64Data: string,
    mimeType: string,
    fileName: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Update status to PROCESSING
        const docRef = db
            .collection('partners')
            .doc(partnerId)
            .collection('hubDocuments')
            .doc(documentId);

        await docRef.update({
            status: ProcessingStatus.PROCESSING,
            updatedAt: Timestamp.now(),
        });

        // Determine prompt based on file type
        let prompt = '';
        if (mimeType.startsWith('audio/')) {
            prompt = 'Listen to this audio clip. Transcribe the spoken content verbatim. Then, provide a brief summary and generate relevant tags.';
        } else if (mimeType.startsWith('video/')) {
            prompt = 'Watch this video. Describe the visual content and transcribe any spoken audio. Provide a summary and relevant tags.';
        } else if (mimeType.startsWith('image/')) {
            prompt = 'Analyze this image. Describe all visible text, objects, and context. Provide a summary and relevant tags.';
        } else {
            prompt = 'Analyze this document. Extract all readable text, provide a brief 2-sentence summary, and generate 3-5 relevant categorization tags.';
        }

        // Call Gemini for extraction
        let extraction: ExtractionResult;
        try {
            extraction = await processDocumentWithGemini(base64Data, mimeType);
        } catch (extractionError) {
            console.warn('Gemini extraction failed, using fallback:', extractionError);
            extraction = {
                text: '',
                summary: 'Processing partially failed.',
                tags: ['error'],
            };
        }

        // Update status to EMBEDDING
        await docRef.update({
            status: ProcessingStatus.EMBEDDING,
            extractedText: extraction.text?.substring(0, 50000) || '', // Limit text size
            summary: extraction.summary || '',
            tags: extraction.tags || [],
            updatedAt: Timestamp.now(),
        });

        // Generate embedding
        const textForEmbedding = (extraction.text || '').substring(0, 9000);
        let embedding: number[] = [];

        if (textForEmbedding) {
            embedding = await generateEmbedding(textForEmbedding);
        }

        // Update to COMPLETED
        await docRef.update({
            status: ProcessingStatus.COMPLETED,
            embedding: embedding,
            updatedAt: Timestamp.now(),
        });

        return { success: true };
    } catch (error: any) {
        console.error('Document processing error:', error);

        // Update status to ERROR
        try {
            const docRef = db
                .collection('partners')
                .doc(partnerId)
                .collection('hubDocuments')
                .doc(documentId);

            await docRef.update({
                status: ProcessingStatus.ERROR,
                error: error.message || 'Processing failed',
                updatedAt: Timestamp.now(),
            });
        } catch (updateError) {
            console.error('Failed to update error status:', updateError);
        }

        return { success: false, error: error.message };
    }
}

// ============================================================================
// MESSAGE GENERATION (RAG)
// ============================================================================

export async function generatePartnerHubResponseAction(
    partnerId: string,
    threadId: string,
    userMessage: string,
    options?: {
        agentId?: string;
        documentIds?: string[];
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        const threadRef = db
            .collection('partners')
            .doc(partnerId)
            .collection('hubThreads')
            .doc(threadId);

        const messagesRef = threadRef.collection('messages');

        // Save user message
        const userMsgId = generateId();
        await messagesRef.doc(userMsgId).set({
            id: userMsgId,
            threadId,
            role: 'user',
            content: userMessage,
            createdAt: Timestamp.now(),
        });

        // Fetch documents for RAG context
        const docsSnapshot = await db
            .collection('partners')
            .doc(partnerId)
            .collection('hubDocuments')
            .where('status', '==', ProcessingStatus.COMPLETED)
            .limit(10)
            .get();

        const contextSnippets: { source: string; text: string }[] = [];
        docsSnapshot.docs.forEach((doc) => {
            const data = doc.data();
            if (data.extractedText) {
                contextSnippets.push({
                    source: data.name || doc.id,
                    text: data.extractedText.substring(0, 3000),
                });
            }
        });

        // Build context string
        const contextString = contextSnippets
            .map((c) => `[Source: ${c.source}]\n${c.text}`)
            .join('\n\n---\n\n');

        // Get agent system prompt if provided
        let systemPrompt = `You are a helpful AI assistant. Answer questions based on the provided context. If the answer is not in the context, say so politely.`;

        if (options?.agentId) {
            const agentDoc = await db
                .collection('partners')
                .doc(partnerId)
                .collection('hubAgents')
                .doc(options.agentId)
                .get();

            if (agentDoc.exists) {
                const agentData = agentDoc.data();
                if (agentData?.systemPrompt) {
                    systemPrompt = agentData.systemPrompt;
                }
            }
        }

        // Generate response using RAG stream (consumed fully here)
        const stream = generateRAGResponseStream(
            userMessage,
            contextSnippets,
            systemPrompt
        );

        let responseText = '';
        for await (const chunk of stream) {
            responseText += chunk;
        }

        // Save assistant message
        const assistantMsgId = generateId();
        await messagesRef.doc(assistantMsgId).set({
            id: assistantMsgId,
            threadId,
            role: 'assistant',
            content: responseText,
            citations: contextSnippets.map((c) => c.source),
            agentId: options?.agentId,
            createdAt: Timestamp.now(),
        });

        // Update thread last message
        await threadRef.update({
            lastMessage: responseText.substring(0, 100),
            lastMessageAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            messageCount: FieldValue.increment(2),
        });

        return { success: true };
    } catch (error: any) {
        console.error('Message generation error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// THREAD CRUD
// ============================================================================

export async function createThreadAction(
    partnerId: string,
    data: {
        title: string;
        contextType?: ChatContextType | string;
        contextId?: string;
        createdBy: string;
    }
): Promise<{ success: boolean; threadId?: string; error?: string }> {
    try {
        const threadId = generateId();
        const threadRef = db
            .collection('partners')
            .doc(partnerId)
            .collection('hubThreads')
            .doc(threadId);

        await threadRef.set({
            id: threadId,
            partnerId,
            title: data.title || 'New Conversation',
            contextType: data.contextType || ChatContextType.AGENT,
            contextId: data.contextId,
            isActive: true,
            createdBy: data.createdBy,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            messageCount: 0,
        });

        return { success: true, threadId };
    } catch (error: any) {
        console.error('Create thread error:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteThreadAction(
    partnerId: string,
    threadId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const threadRef = db
            .collection('partners')
            .doc(partnerId)
            .collection('hubThreads')
            .doc(threadId);

        // Soft delete - just mark as inactive
        await threadRef.update({
            isActive: false,
            updatedAt: Timestamp.now(),
        });

        return { success: true };
    } catch (error: any) {
        console.error('Delete thread error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// DOCUMENT CRUD
// ============================================================================

export async function deleteDocumentAction(
    partnerId: string,
    documentId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const docRef = db
            .collection('partners')
            .doc(partnerId)
            .collection('hubDocuments')
            .doc(documentId);

        const docSnapshot = await docRef.get();
        if (!docSnapshot.exists) {
            return { success: false, error: 'Document not found' };
        }

        const docData = docSnapshot.data();

        // Delete from storage if path exists
        if (docData?.storagePath) {
            try {
                const bucket = adminStorage.bucket();
                await bucket.file(docData.storagePath).delete();
            } catch (storageError) {
                console.warn('Storage deletion failed:', storageError);
            }
        }

        // Delete Firestore document
        await docRef.delete();

        return { success: true };
    } catch (error: any) {
        console.error('Delete document error:', error);
        return { success: false, error: error.message };
    }
}

export async function addTagToDocumentAction(
    partnerId: string,
    documentId: string,
    tag: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const cleanTag = tag.trim().replace(/^#/, '').toLowerCase();
        if (!cleanTag) {
            return { success: false, error: 'Invalid tag' };
        }

        const docRef = db
            .collection('partners')
            .doc(partnerId)
            .collection('hubDocuments')
            .doc(documentId);

        await docRef.update({
            tags: FieldValue.arrayUnion(cleanTag),
            updatedAt: Timestamp.now(),
        });

        return { success: true };
    } catch (error: any) {
        console.error('Add tag error:', error);
        return { success: false, error: error.message };
    }
}

export async function removeTagFromDocumentAction(
    partnerId: string,
    documentId: string,
    tag: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const docRef = db
            .collection('partners')
            .doc(partnerId)
            .collection('hubDocuments')
            .doc(documentId);

        await docRef.update({
            tags: FieldValue.arrayRemove(tag),
            updatedAt: Timestamp.now(),
        });

        return { success: true };
    } catch (error: any) {
        console.error('Remove tag error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// AGENT CRUD
// ============================================================================

export async function createAgentAction(
    partnerId: string,
    data: {
        name: string;
        description?: string;
        systemPrompt: string;
        personality: {
            tone: string;
            style: string;
            traits: string[];
        };
        createdBy: string;
    }
): Promise<{ success: boolean; agentId?: string; error?: string }> {
    try {
        const agentId = generateId();
        const agentRef = db
            .collection('partners')
            .doc(partnerId)
            .collection('hubAgents')
            .doc(agentId);

        await agentRef.set({
            id: agentId,
            partnerId,
            name: data.name,
            description: data.description || '',
            type: 'custom',
            systemPrompt: data.systemPrompt,
            personality: data.personality,
            capabilities: [],
            knowledgeDocIds: [],
            isActive: true,
            isDefault: false,
            temperature: 0.7,
            maxTokens: 2048,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            usageCount: 0,
        });

        return { success: true, agentId };
    } catch (error: any) {
        console.error('Create agent error:', error);
        return { success: false, error: error.message };
    }
}

export async function updateAgentAction(
    partnerId: string,
    agentId: string,
    updates: Partial<{
        name: string;
        description: string;
        systemPrompt: string;
        personality: any;
        isActive: boolean;
        temperature: number;
        maxTokens: number;
    }>
): Promise<{ success: boolean; error?: string }> {
    try {
        const agentRef = db
            .collection('partners')
            .doc(partnerId)
            .collection('hubAgents')
            .doc(agentId);

        await agentRef.update({
            ...updates,
            updatedAt: Timestamp.now(),
        });

        return { success: true };
    } catch (error: any) {
        console.error('Update agent error:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteAgentAction(
    partnerId: string,
    agentId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const agentRef = db
            .collection('partners')
            .doc(partnerId)
            .collection('hubAgents')
            .doc(agentId);

        // Soft delete
        await agentRef.update({
            isActive: false,
            updatedAt: Timestamp.now(),
        });

        return { success: true };
    } catch (error: any) {
        console.error('Delete agent error:', error);
        return { success: false, error: error.message };
    }
}
