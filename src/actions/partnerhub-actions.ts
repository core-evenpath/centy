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
    EssentialAgent,
} from '@/lib/partnerhub-types';
import {
    processDocumentWithGemini,
    generateEmbedding,
    generateRAGResponseStream,
    generateImage,
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
            status: ProcessingStatus.PROCESSING,
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
                status: ProcessingStatus.FAILED,
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
        isImageMode?: boolean;
        referenceImageUrl?: string;
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
        // If specific documentIds are provided, only fetch those documents
        // Otherwise, fetch all completed documents (limited to 10)
        let docsSnapshot;
        if (options?.documentIds && options.documentIds.length > 0) {
            // Fetch specific documents by ID
            const docPromises = options.documentIds.map(docId =>
                db.collection('partners')
                    .doc(partnerId)
                    .collection('hubDocuments')
                    .doc(docId)
                    .get()
            );
            const docs = await Promise.all(docPromises);
            docsSnapshot = { docs: docs.filter(doc => doc.exists) };
        } else {
            // Fetch all completed documents (fallback)
            docsSnapshot = await db
                .collection('partners')
                .doc(partnerId)
                .collection('hubDocuments')
                .where('status', '==', ProcessingStatus.COMPLETED)
                .limit(10)
                .get();
        }

        const contextSnippets: { source: string; text: string }[] = [];
        docsSnapshot.docs.forEach((doc) => {
            const data = doc.data();
            if (data && data.extractedText) {
                // Use more text for specific document queries (15k chars), less for general queries (3k chars)
                const textLimit = options?.documentIds ? 15000 : 3000;
                contextSnippets.push({
                    source: data.name || doc.id,
                    text: data.extractedText.substring(0, textLimit),
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

        let responseText = '';
        let responseImageUrl: string | undefined;

        // Handle image generation mode
        if (options?.isImageMode) {
            try {
                // If we have a reference image, fetch it and convert to base64
                let referenceImage: { base64: string; mimeType: string } | undefined;

                if (options.referenceImageUrl) {
                    try {
                        const response = await fetch(options.referenceImageUrl);
                        const arrayBuffer = await response.arrayBuffer();
                        const base64 = Buffer.from(arrayBuffer).toString('base64');
                        const contentType = response.headers.get('content-type') || 'image/jpeg';
                        referenceImage = { base64, mimeType: contentType };
                    } catch (fetchError) {
                        console.warn('Failed to fetch reference image:', fetchError);
                    }
                }

                // generateImage returns a data URI directly
                const dataUri = await generateImage(userMessage, referenceImage);

                // Upload to Firebase Storage
                const bucket = adminStorage.bucket();
                const imageId = generateId();
                const storagePath = `partners/${partnerId}/generated-images/${imageId}.png`;

                // Extract base64 data from data URI
                const base64Data = dataUri.split(',')[1];
                const buffer = Buffer.from(base64Data, 'base64');

                // Upload to storage
                const file = bucket.file(storagePath);
                await file.save(buffer, {
                    metadata: {
                        contentType: 'image/png',
                    },
                });

                // Make file publicly accessible and get URL
                await file.makePublic();
                responseImageUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

                responseText = referenceImage
                    ? `Here's the edited image based on: "${userMessage}"`
                    : `Here's the image I generated for: "${userMessage}"`;
            } catch (imageError: any) {
                console.error('Image generation failed:', imageError);
                responseText = `Sorry, I couldn't generate an image for that prompt. Error: ${imageError.message || 'Unknown error'}`;
            }
        } else {
            // Generate response using RAG stream (consumed fully here)
            const stream = generateRAGResponseStream(
                userMessage,
                contextSnippets,
                systemPrompt
            );

            for await (const chunk of stream) {
                responseText += chunk;
            }
        }

        // Save assistant message
        const assistantMsgId = generateId();
        const assistantMessage: any = {
            id: assistantMsgId,
            threadId,
            role: 'assistant',
            content: responseText,
            citations: options?.isImageMode ? [] : contextSnippets.map((c) => c.source),
            agentId: options?.agentId,
            createdAt: Timestamp.now(),
        };

        // Add image attachment if generated (now using storage URL, not base64)
        if (responseImageUrl) {
            assistantMessage.attachments = [{
                type: 'image',
                url: responseImageUrl,
                name: 'Generated Image',
                mimeType: 'image/png',
            }];
        }

        await messagesRef.doc(assistantMsgId).set(assistantMessage);

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

export async function saveEssentialAgentAction(
    partnerId: string,
    agent: EssentialAgent
): Promise<{ success: boolean; error?: string }> {
    try {
        const agentRef = db
            .collection('partners')
            .doc(partnerId)
            .collection('hubAgents')
            .doc(agent.id);

        // Remove undefined values to avoid Firestore errors
        const data = JSON.parse(JSON.stringify(agent));

        // Ensure dates are Timestamps
        data.updatedAt = Timestamp.now();

        // If it's a new agent (or doesn't have createdAt), set it
        // Note: We check if the doc exists first if we want to be strict, 
        // but here we just rely on the passed object. 
        // If the passed object has createdAt as string (from JSON), convert it.
        if (data.createdAt) {
            // If it's a string or number, try to convert. If it's already a Timestamp object (unlikely after JSON.stringify), it might need handling.
            // JSON.stringify converts Date to string.
            data.createdAt = new Date(data.createdAt);
        } else {
            data.createdAt = Timestamp.now();
        }

        // We use set with merge: true to update or create
        await agentRef.set(data, { merge: true });

        return { success: true };
    } catch (error: any) {
        console.error('Save essential agent error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// INBOX AI SUGGESTION (Using hubDocuments from /partner/core)
// ============================================================================

/**
 * Generate AI suggestion for inbox using hubDocuments from /partner/core
 * This uses the same RAG system as the PartnerHub chat
 */
export async function generateInboxSuggestionAction(
    partnerId: string,
    customerMessage: string,
    conversationContext?: string
): Promise<{
    success: boolean;
    message: string;
    suggestedReply?: string;
    confidence?: number;
    reasoning?: string;
    sources?: Array<{
        type: 'document';
        name: string;
        excerpt: string;
        relevance: number;
    }>;
}> {
    console.log('⚡ Inbox AI Suggestion starting (using hubDocuments)');
    const startTime = Date.now();

    try {
        // Fetch COMPLETED hubDocuments from /partner/core
        const docsSnapshot = await db
            .collection('partners')
            .doc(partnerId)
            .collection('hubDocuments')
            .where('status', '==', ProcessingStatus.COMPLETED)
            .limit(15)
            .get();

        if (docsSnapshot.empty) {
            console.warn('⚠️ No hubDocuments found for partner:', partnerId);
            return {
                success: false,
                message: 'No documents found. Please upload documents in /partner/core first.',
            };
        }

        console.log(`📚 Found ${docsSnapshot.docs.length} hubDocuments`);

        // Build context from hubDocuments
        const contextSnippets: { source: string; text: string }[] = [];
        docsSnapshot.docs.forEach((doc) => {
            const data = doc.data();
            if (data && data.extractedText) {
                contextSnippets.push({
                    source: data.name || data.originalName || doc.id,
                    text: data.extractedText.substring(0, 5000), // Use up to 5k chars per doc
                });
            }
        });

        if (contextSnippets.length === 0) {
            return {
                success: false,
                message: 'Documents found but no text extracted. Please ensure documents are processed.',
            };
        }

        // Build context string
        const contextString = contextSnippets
            .map((c) => `[Source: ${c.source}]\n${c.text}`)
            .join('\n\n---\n\n');

        // Build the prompt
        const systemPrompt = `You are a helpful customer service assistant. Your knowledge base consists of the documents provided below. Use this information to craft helpful, accurate responses.

KNOWLEDGE BASE:
${contextString}

---

INSTRUCTIONS:
1. Answer the customer's question using ONLY information from the knowledge base above
2. If the answer is in the documents, provide it confidently
3. If you cannot find relevant information, say "I don't have specific information about that, but I can help connect you with someone who does."
4. Keep responses professional, friendly, and concise (2-3 sentences max)
5. Do not make up information
6. FORMATTING: Use standard Markdown for formatting:
   - Use **bold** for ALL key information (names, prices, metrics, dates).
   - Use dashes (-) for bullet points.
   - Avoid using italics to ensure better readability.`;

        // Build the full prompt with conversation context
        const fullPrompt = conversationContext
            ? `Recent conversation:\n${conversationContext}\n\nCustomer's latest message: "${customerMessage}"\n\nProvide a helpful response:`
            : `Customer message: "${customerMessage}"\n\nProvide a helpful response:`;

        // Generate response using the RAG stream
        const stream = generateRAGResponseStream(
            fullPrompt,
            contextSnippets,
            systemPrompt
        );

        let responseText = '';
        for await (const chunk of stream) {
            responseText += chunk;
        }

        const totalTime = Date.now() - startTime;
        console.log(`✅ Inbox AI Suggestion completed in ${totalTime}ms`);

        // Build sources for the response
        const sources = contextSnippets.slice(0, 3).map((snippet) => ({
            type: 'document' as const,
            name: snippet.source,
            excerpt: snippet.text.substring(0, 150) + '...',
            relevance: 0.85,
        }));

        return {
            success: true,
            message: 'Success',
            suggestedReply: responseText.trim(),
            confidence: contextSnippets.length > 0 ? 0.85 : 0.5,
            reasoning: `Based on ${contextSnippets.length} document${contextSnippets.length > 1 ? 's' : ''} from your knowledge base`,
            sources,
        };
    } catch (error: any) {
        console.error('❌ Inbox AI Suggestion failed:', error);
        return {
            success: false,
            message: `Error: ${error.message}`,
        };
    }
}
