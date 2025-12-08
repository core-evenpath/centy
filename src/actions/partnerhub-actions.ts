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
import { GoogleGenerativeAI } from '@google/generative-ai';



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
    conversationContext?: string,
    contactId?: string,
    assistantIds?: string[]
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
        fromAssistant?: string;
    }>;
    personaUsed?: boolean;
    assistantUsed?: {
        id: string;
        name: string;
        avatar: string;
        usedAsFallback: boolean;
    };
}> {
    console.log('⚡ Inbox AI Suggestion starting (Assistant-aware)');
    const startTime = Date.now();

    try {
        if (!db) {
            return { success: false, message: 'Database unavailable' };
        }

        // Fetch assigned Assistants if provided
        let assistants: any[] = [];
        if (assistantIds && assistantIds.length > 0) {
            const assistantPromises = assistantIds.map(id =>
                db!.collection('partners')
                    .doc(partnerId)
                    .collection('hubAgents')
                    .doc(id)
                    .get()
            );
            const assistantDocs = await Promise.all(assistantPromises);
            assistants = assistantDocs
                .filter(doc => doc.exists)
                .map(doc => ({ id: doc.id, ...doc.data() }));

            console.log(`📋 Found ${assistants.length} assigned assistants`);
        }

        // Fetch contact persona if available
        let personaContext = '';
        let personaUsed = false;
        if (contactId) {
            try {
                const contactDoc = await db
                    .collection('partners')
                    .doc(partnerId)
                    .collection('contacts')
                    .doc(contactId)
                    .get();

                if (contactDoc.exists) {
                    const contactData = contactDoc.data();
                    if (contactData?.persona) {
                        const p = contactData.persona;
                        personaContext = `
CUSTOMER PERSONA:
- Communication Style: ${p.communicationStyle || 'Unknown'}
- Preferred Tone: ${p.preferredTone || 'Professional'}
- Sentiment: ${p.sentiment || 'Neutral'}
- Customer Stage: ${p.customerStage || 'Unknown'}
- Interests: ${(p.interests || []).join(', ') || 'None specified'}
- Pain Points: ${(p.painPoints || []).join(', ') || 'None specified'}
- Relationship Summary: ${p.relationshipSummary || 'No summary available'}
`;
                        personaUsed = true;
                        console.log('👤 Using customer persona for personalization');
                    }
                }
            } catch (e) {
                console.warn('⚠️ Could not fetch persona:', e);
            }
        }

        // Primary + Fallback logic
        let usedAssistant: any = null;
        let usedAsFallback = false;
        let sourcesAreGlobal = false;
        let systemPrompt = '';
        let documentIds: string[] = [];

        if (assistants.length > 0) {
            // Try primary assistant first
            const primary = assistants[0];
            console.log(`🎯 Trying primary assistant: ${primary.name}`);

            // Get primary's documents
            let primaryDocIds: string[] = [];
            if (primary.documentConfig?.useAllDocuments) {
                const allDocsSnapshot = await db
                    .collection('partners')
                    .doc(partnerId)
                    .collection('hubDocuments')
                    .where('status', '==', ProcessingStatus.COMPLETED)
                    .limit(15)
                    .get();
                primaryDocIds = allDocsSnapshot.docs.map(d => d.id);
                // Even if "useAllDocuments" is true, these are considered "checked by the assistant"
                // but strictly speaking they are global. For attribution, we can still claim them for the assistant
                // since the assistant is configured to use them.
            } else {
                primaryDocIds = primary.documentConfig?.attachedDocumentIds || [];
            }

            if (primaryDocIds.length > 0) {
                usedAssistant = primary;
                documentIds = primaryDocIds;
                systemPrompt = primary.systemPrompt || '';
            } else {
                // Try fallbacks
                for (let i = 1; i < assistants.length; i++) {
                    const fallback = assistants[i];
                    console.log(`🔄 Trying fallback assistant: ${fallback.name}`);

                    let fallbackDocIds: string[] = [];
                    if (fallback.documentConfig?.useAllDocuments) {
                        const allDocsSnapshot = await db
                            .collection('partners')
                            .doc(partnerId)
                            .collection('hubDocuments')
                            .where('status', '==', ProcessingStatus.COMPLETED)
                            .limit(15)
                            .get();
                        fallbackDocIds = allDocsSnapshot.docs.map(d => d.id);
                    } else {
                        fallbackDocIds = fallback.documentConfig?.attachedDocumentIds || [];
                    }

                    if (fallbackDocIds.length > 0) {
                        usedAssistant = fallback;
                        usedAsFallback = true;
                        documentIds = fallbackDocIds;
                        systemPrompt = fallback.systemPrompt || '';
                        break;
                    }
                }
            }
        }

        // If no documents found yet...
        // 1. If NO assistants are selected, fall back to ALL global documents (legacy behavior)
        if (documentIds.length === 0 && assistants.length === 0) {
            console.log('📂 No assistant selected, using all hubDocuments');
            sourcesAreGlobal = true;

            const docsSnapshot = await db
                .collection('partners')
                .doc(partnerId)
                .collection('hubDocuments')
                .where('status', '==', ProcessingStatus.COMPLETED)
                .limit(15)
                .get();

            if (docsSnapshot.empty) {
                return {
                    success: false,
                    message: 'No documents found. Please upload documents in Core Memory first.',
                };
            }

            documentIds = docsSnapshot.docs.map(d => d.id);
        }
        // 2. If assistants ARE selected but had no documents, STRICTLY use the Primary Assistant with NO context
        else if (documentIds.length === 0 && assistants.length > 0) {
            console.log('⚠️ Assistants selected but no content found. Using Primary Assistant (Pure Generation).');
            usedAssistant = assistants[0];
            systemPrompt = usedAssistant.systemPrompt || '';
            // Do NOT fetch global documents. Keep documentIds empty.
        }

        // Fetch document content (if any IDs exist)
        let contextSnippets: { source: string; text: string; docId: string }[] = [];

        if (documentIds.length > 0) {
            const docPromises = documentIds.slice(0, 10).map(docId =>
                db!.collection('partners')
                    .doc(partnerId)
                    .collection('hubDocuments')
                    .doc(docId)
                    .get()
            );
            const docSnapshots = await Promise.all(docPromises);

            docSnapshots.forEach((doc) => {
                if (doc.exists) {
                    const data = doc.data();
                    if (data?.extractedText) {
                        contextSnippets.push({
                            source: data.name || doc.id,
                            text: data.extractedText.substring(0, 2000),
                            docId: doc.id,
                        });
                    }
                }
            });
        }

        // If no content for RAG, fail ONLY if no assistant was used (i.e. legacy mode failed)
        if (contextSnippets.length === 0 && !usedAssistant) {
            return {
                success: false,
                message: 'No document content available for request.',
            };
        }

        const contextString = contextSnippets
            .map((c) => `[Source: ${c.source}]\n${c.text}`)
            .join('\n\n---\n\n');

        // Build system prompt
        let finalSystemPrompt = systemPrompt;
        if (!finalSystemPrompt) {
            finalSystemPrompt = `You are a helpful AI assistant. Answer questions based on the provided context.`;
        }

        // Add persona context if available
        if (personaContext) {
            finalSystemPrompt += `\n\n${personaContext}\nUse this persona information to personalize your response appropriately.`;
        }

        // Add behavior rules if assistant has them
        if (usedAssistant?.behaviorRules) {
            const rules = usedAssistant.behaviorRules;
            if (rules.responseRules?.length > 0) {
                finalSystemPrompt += `\n\nRULES TO FOLLOW:\n${rules.responseRules.map((r: string) => `- ${r}`).join('\n')}`;
            }
            if (rules.neverSay?.length > 0) {
                finalSystemPrompt += `\n\nNEVER SAY:\n${rules.neverSay.map((r: string) => `- "${r}"`).join('\n')}`;
            }
        }

        // Call Gemini
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const prompt = `${finalSystemPrompt}

DOCUMENT CONTEXT:
${contextString}

CONVERSATION CONTEXT:
${conversationContext || 'No previous messages'}

CUSTOMER MESSAGE:
"${customerMessage}"

Generate a helpful, professional reply suggestion (2-3 sentences). Be specific and use information from the documents when relevant.

Respond in JSON format:
{
    "suggestedReply": "Your suggested reply here",
    "confidence": 0.85,
    "reasoning": "Brief explanation of why this response is appropriate",
    "relevantSources": ["Document Name 1", "Document Name 2"]
}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Parse JSON response
        let parsed: any;
        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0]);
            } else {
                parsed = {
                    suggestedReply: responseText.trim(),
                    confidence: 0.7,
                    reasoning: 'Generated response',
                    relevantSources: [],
                };
            }
        } catch (e) {
            parsed = {
                suggestedReply: responseText.trim(),
                confidence: 0.7,
                reasoning: 'Generated response',
                relevantSources: [],
            };
        }

        // Build sources array
        const sources = (parsed.relevantSources || []).map((sourceName: string) => {
            const matchedSnippet = contextSnippets.find(s =>
                s.source.toLowerCase().includes(sourceName.toLowerCase()) ||
                sourceName.toLowerCase().includes(s.source.toLowerCase())
            );
            return {
                type: 'document' as const,
                name: sourceName,
                excerpt: matchedSnippet?.text.substring(0, 200) || '',
                relevance: 0.8,
                // Only attribute to assistant if sources are NOT global
                fromAssistant: sourcesAreGlobal ? undefined : usedAssistant?.name,
            };
        });

        const elapsed = Date.now() - startTime;
        console.log(`✅ Inbox AI Suggestion completed in ${elapsed}ms`);

        return {
            success: true,
            message: 'Suggestion generated successfully',
            suggestedReply: parsed.suggestedReply,
            confidence: parsed.confidence || 0.85,
            reasoning: parsed.reasoning || 'Based on your business documents',
            sources,
            personaUsed,
            assistantUsed: usedAssistant ? {
                id: usedAssistant.id,
                name: usedAssistant.name,
                avatar: usedAssistant.avatar || '🤖',
                usedAsFallback,
            } : undefined,
        };
    } catch (error: any) {
        console.error('❌ Inbox AI Suggestion error:', error);
        return {
            success: false,
            message: error.message || 'Failed to generate suggestion',
        };
    }
}
