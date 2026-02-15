"use server";

import { db, adminStorage } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import {
    ProcessingStatus,
    FileCategory,
    ChatContextType,
    getFileCategory,
    generateId,
    EssentialAgent,
    AgentRole,
} from '@/lib/partnerhub-types';
import {
    processDocumentWithGemini,
    generateEmbedding,
    generateRAGResponseStream,
    generateImage,
} from '@/lib/gemini-service';
import { GoogleGenAI } from '@google/genai';
import { isGeneralModeAssistant, getEssentialAssistantById } from '@/lib/types-assistant';
import { getAgentTemplatesForIndustry } from '@/lib/business-type-agents';
import type { IndustryCategory } from '@/lib/business-persona-types';
import { getCoreAccessibleDataAction } from './business-persona-actions';
import { getCoreHubContextString, syncModulesToCoreHub, isCoreHubStale } from './core-hub-actions';
import { buildAIContext } from '@/lib/ai-context-builder';
import { buildSystemPrompt, buildUserPrompt } from '@/lib/ai-prompt-builder';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

interface ExtractionResult {
    text: string;
    tags: string[];
    summary: string;
}

export async function processDocumentAction(
    partnerId: string,
    documentId: string,
    base64Data: string,
    mimeType: string,
    fileName: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const docRef = db
            .collection('partners')
            .doc(partnerId)
            .collection('hubDocuments')
            .doc(documentId);

        await docRef.update({
            status: ProcessingStatus.PROCESSING,
            updatedAt: Timestamp.now(),
        });

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

        await docRef.update({
            status: ProcessingStatus.PROCESSING,
            extractedText: extraction.text?.substring(0, 50000) || '',
            summary: extraction.summary || '',
            tags: extraction.tags || [],
            updatedAt: Timestamp.now(),
        });

        const textForEmbedding = (extraction.text || '').substring(0, 9000);
        let embedding: number[] = [];

        if (textForEmbedding) {
            embedding = await generateEmbedding(textForEmbedding);
        }

        await docRef.update({
            status: ProcessingStatus.COMPLETED,
            embedding: embedding,
            updatedAt: Timestamp.now(),
        });

        return { success: true };
    } catch (error: any) {
        console.error('Document processing error:', error);

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

        const userMsgId = generateId();
        await messagesRef.doc(userMsgId).set({
            id: userMsgId,
            threadId,
            role: 'user',
            content: userMessage,
            createdAt: Timestamp.now(),
        });

        let docsSnapshot;
        if (options?.documentIds && options.documentIds.length > 0) {
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
                const textLimit = options?.documentIds ? 30000 : 8000;
                const text = data.extractedText.substring(0, textLimit);

                contextSnippets.push({
                    source: data.name || doc.id,
                    text: text,
                });
            }
        });

        contextSnippets.sort((a, b) => b.text.length - a.text.length);

        const contextString = contextSnippets
            .map((c) => `[Source: ${c.source}]\n${c.text}`)
            .join('\n\n---\n\n');

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

        if (options?.isImageMode) {
            try {
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

                const dataUri = await generateImage(userMessage, referenceImage);

                const bucket = adminStorage.bucket();
                const imageId = generateId();
                const storagePath = `partners/${partnerId}/generated-images/${imageId}.png`;

                const base64Data = dataUri.split(',')[1];
                const buffer = Buffer.from(base64Data, 'base64');

                const file = bucket.file(storagePath);
                await file.save(buffer, {
                    metadata: {
                        contentType: 'image/png',
                    },
                });

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
            const stream = generateRAGResponseStream(
                userMessage,
                contextSnippets,
                systemPrompt
            );

            for await (const chunk of stream) {
                responseText += chunk;
            }
        }

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

        if (responseImageUrl) {
            assistantMessage.attachments = [{
                type: 'image',
                url: responseImageUrl,
                name: 'Generated Image',
                mimeType: 'image/png',
            }];
        }

        await messagesRef.doc(assistantMsgId).set(assistantMessage);

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

        if (docData?.storagePath) {
            try {
                const bucket = adminStorage.bucket();
                await bucket.file(docData.storagePath).delete();
            } catch (storageError) {
                console.warn('Storage deletion failed:', storageError);
            }
        }

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

        const data = JSON.parse(JSON.stringify(agent));
        data.updatedAt = Timestamp.now();

        if (data.createdAt) {
            data.createdAt = new Date(data.createdAt);
        } else {
            data.createdAt = Timestamp.now();
        }

        await agentRef.set(data, { merge: true });

        return { success: true };
    } catch (error: any) {
        console.error('Save essential agent error:', error);
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

        const agentDoc = await agentRef.get();
        if (!agentDoc.exists) {
            return { success: false, error: 'Agent not found' };
        }

        const agentData = agentDoc.data();
        if (!agentId.startsWith('custom-') && !agentData?.isCustomAgent) {
            return { success: false, error: 'Cannot delete default agents' };
        }

        await agentRef.delete();

        return { success: true };
    } catch (error: any) {
        console.error('Delete agent error:', error);
        return { success: false, error: error.message };
    }
}

export async function testAgentAction(
    partnerId: string,
    agentId: string,
    userMessage: string
): Promise<{
    success: boolean;
    message: string;
    response?: string;
    sources?: Array<{
        name: string;
        excerpt: string;
    }>;
}> {
    const startTime = Date.now();

    try {
        if (!db) {
            return { success: false, message: 'Database unavailable' };
        }

        const agentDoc = await db
            .collection('partners')
            .doc(partnerId)
            .collection('hubAgents')
            .doc(agentId)
            .get();

        let agentConfig: any = null;
        if (agentDoc.exists) {
            agentConfig = { id: agentDoc.id, ...agentDoc.data() };
        }

        const partnerDoc = await db.collection('partners').doc(partnerId).get();
        let partnerInfo: any = null;
        if (partnerDoc.exists) {
            partnerInfo = partnerDoc.data();
        }

        let documentIds: string[] = [];
        if (agentConfig) {
            if (agentConfig.useAllDocuments || agentConfig.documentConfig?.useAllDocuments) {
                const allDocsSnapshot = await db
                    .collection('partners')
                    .doc(partnerId)
                    .collection('hubDocuments')
                    .where('status', '==', ProcessingStatus.COMPLETED)
                    .limit(10)
                    .get();
                documentIds = allDocsSnapshot.docs.map(d => d.id);
            } else {
                documentIds = agentConfig.attachedDocumentIds || agentConfig.documentConfig?.attachedDocumentIds || [];
            }
        }

        if (documentIds.length === 0) {
            const allDocsSnapshot = await db
                .collection('partners')
                .doc(partnerId)
                .collection('hubDocuments')
                .where('status', '==', ProcessingStatus.COMPLETED)
                .limit(10)
                .get();
            documentIds = allDocsSnapshot.docs.map(d => d.id);
        }

        const contextSnippets: { source: string; text: string }[] = [];
        if (documentIds.length > 0) {
            const docPromises = documentIds.slice(0, 8).map(docId =>
                db!.collection('partners').doc(partnerId).collection('hubDocuments').doc(docId).get()
            );
            const docSnapshots = await Promise.all(docPromises);
            docSnapshots.forEach((doc) => {
                if (doc.exists) {
                    const data = doc.data();
                    if (data?.extractedText) {
                        contextSnippets.push({
                            source: data.name || doc.id,
                            text: data.extractedText.substring(0, 2000),
                        });
                    }
                }
            });
        }

        const businessName = partnerInfo?.businessPersona?.identity?.name || partnerInfo?.businessName || 'the business';
        let systemPrompt = `You are ${agentConfig?.name || 'an AI assistant'} for ${businessName}.`;

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

        const contextString = contextSnippets
            .map((c) => `[Source: ${c.source}]\n${c.text}`)
            .join('\n\n---\n\n');

        const prompt = `${systemPrompt}\n\nDOCUMENT CONTEXT:\n${contextString || 'No documents available'}\n\nCUSTOMER MESSAGE:\n"${userMessage}"`;

        const result = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                temperature: 0.7,
            }
        });

        const responseText = result.text || '';

        return {
            success: true,
            message: 'Response generated successfully',
            response: responseText,
            sources: contextSnippets.slice(0, 3).map(s => ({
                name: s.source,
                excerpt: s.text.substring(0, 100) + '...',
            })),
        };
    } catch (error: any) {
        console.error('❌ Agent test error:', error);
        return { success: false, message: error.message };
    }
}

const GENERAL_MODE_SYSTEM_PROMPT = `You are a general AI assistant. You do NOT have access to any business-specific documents or knowledge base.`;

export async function generateInboxSuggestionAction(
    partnerId: string,
    customerMessage: string,
    conversationId?: string,
    contactId?: string
): Promise<{
    success: boolean;
    message?: string;
    suggestedReply?: string;
    confidence?: number;
    reasoning?: string;
    sources?: Array<{
        type: 'document' | 'module' | 'profile';
        name: string;
        excerpt: string;
        relevance: number;
    }>;
    inlineContent?: Array<{
        type: 'product' | 'document' | 'image';
        position: 'before' | 'after' | 'inline';
        data: any;
    }>;
    availableProducts?: Array<{
        id: string;
        name: string;
        description?: string;
        price: number | null;
        comparePrice?: number | null;
        currency?: string;
        imageUrl?: string;
        rating?: number;
        reviewCount?: number;
        stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
        stockCount?: number;
        colors?: string[];
        category?: string;
        sourceModule?: string;
    }>;
    personaUsed?: boolean;
}> {
    const startTime = Date.now();
    try {
        const context = await buildAIContext({
            partnerId,
            customerMessage,
            conversationId,
            contactId,
            maxHistoryMessages: 10,
            maxRagResults: 5,
        });

        const systemPrompt = buildSystemPrompt(context);
        const userPrompt = buildUserPrompt(customerMessage, context.conversationHistory);

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

        const prompt = `${systemPrompt}\n\n${userPrompt}\n\nRespond in JSON format:
{
  "suggestedReply": "Your suggested reply here",
  "confidence": 0.85,
  "reasoning": "Brief explanation",
  "sourcesUsed": ["Source 1", "Source 2"],
  "referencedProductNames": ["Product name if any product is mentioned in the reply"]
}`;

        const result = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                temperature: 0.7,
                responseMimeType: "application/json"
            }
        });

        const responseText = result.text || '';

        let parsed: any;
        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0]);
            } else {
                parsed = { suggestedReply: responseText.trim(), confidence: 0.7 };
            }
        } catch (e) {
            parsed = { suggestedReply: responseText.trim(), confidence: 0.7 };
        }

        const sources = [];
        if (context.businessProfile.name) {
            sources.push({
                type: 'profile' as const,
                name: 'Business Profile',
                excerpt: `${context.businessProfile.name} - ${context.businessProfile.industry || 'General Business'}`,
                relevance: 0.95,
            });
        }

        if (context.moduleItems.length > 0) {
            sources.push({
                type: 'module' as const,
                name: 'Products & Services',
                excerpt: `${context.moduleItems.length} items from business modules`,
                relevance: 0.9,
            });
        }

        for (const ragResult of context.ragResults.slice(0, 3)) {
            sources.push({
                type: 'document' as const,
                name: ragResult.source,
                excerpt: ragResult.content.substring(0, 200),
                relevance: ragResult.relevance || 0.8,
            });
        }

        // Extract inline product content from module items
        const inlineContent: Array<{
            type: 'product' | 'document' | 'image';
            position: 'before' | 'after' | 'inline';
            data: any;
        }> = [];

        const availableProducts: Array<{
            id: string;
            name: string;
            description?: string;
            price: number | null;
            comparePrice?: number | null;
            currency?: string;
            imageUrl?: string;
            rating?: number;
            reviewCount?: number;
            stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
            stockCount?: number;
            colors?: string[];
            category?: string;
            sourceModule?: string;
        }> = [];

        if (context.moduleItems.length > 0) {
            // Convert all module items to product data for the picker
            // ModuleItem fields stored in CoreHub metadata: images, thumbnail, compareAtPrice,
            // stock, trackInventory, fields, variants, isFeatured, currency, etc.
            for (const item of context.moduleItems) {
                const meta = (item as any).metadata || {};
                const fields = meta.fields || {};
                const images: string[] = meta.images || [];
                const productData = {
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    price: item.price,
                    comparePrice: meta.compareAtPrice || meta.comparePrice || meta.compare_price || fields.compareAtPrice || null,
                    currency: item.currency || meta.currency || 'INR',
                    imageUrl: meta.thumbnail || images[0] || meta.imageUrl || meta.image || fields.image || undefined,
                    images: images.length > 0 ? images : undefined,
                    rating: meta.rating || fields.rating || meta.averageRating || fields.averageRating || undefined,
                    reviewCount: meta.reviewCount || fields.reviewCount || fields.reviews || undefined,
                    stockStatus: meta.stock !== undefined
                        ? (meta.stock === 0 ? 'out_of_stock' : meta.stock <= 5 ? 'low_stock' : 'in_stock')
                        : (meta.stockStatus || fields.stockStatus || undefined),
                    stockCount: meta.stock ?? meta.stockCount ?? fields.stock ?? undefined,
                    colors: meta.colors || fields.colors || meta.variants?.map?.((v: any) => v.color).filter?.(Boolean) || fields.colorOptions || undefined,
                    category: item.category,
                    sourceModule: item.sourceModule,
                };
                availableProducts.push(productData);
            }

            // Match referenced products from AI response to module items
            const referencedNames: string[] = parsed.referencedProductNames || [];
            const suggestedReplyLower = (parsed.suggestedReply || '').toLowerCase();
            const customerMessageLower = customerMessage.toLowerCase();

            // Find products that are referenced in the reply (by name match or AI-specified)
            const matchedProducts: typeof availableProducts = [];

            for (const product of availableProducts) {
                const productNameLower = product.name.toLowerCase();
                // Check if product name appears in the AI reply
                const nameMatch = suggestedReplyLower.includes(productNameLower);
                // Check if AI explicitly referenced the product
                const aiReferenced = referencedNames.some(
                    (ref: string) => ref.toLowerCase() === productNameLower ||
                        productNameLower.includes(ref.toLowerCase()) ||
                        ref.toLowerCase().includes(productNameLower)
                );
                // Check partial word matches (e.g. "Kanjivaram" matches "Kanjivaram Silk Saree")
                const productWords = productNameLower.split(/\s+/);
                const partialMatch = productWords.some(word =>
                    word.length > 3 && (suggestedReplyLower.includes(word) || customerMessageLower.includes(word))
                );

                if (nameMatch || aiReferenced || partialMatch) {
                    matchedProducts.push(product);
                }
            }

            // Fallback: If no products matched but the customer is asking about products,
            // check if the customer message mentions any product-related keywords
            if (matchedProducts.length === 0 && availableProducts.length > 0) {
                const productKeywords = ['product', 'price', 'cost', 'buy', 'order', 'available', 'stock', 'color', 'variant', 'size', 'option', 'show', 'have', 'offer', 'catalog', 'collection'];
                const isProductQuery = productKeywords.some(kw => customerMessageLower.includes(kw));

                if (isProductQuery) {
                    // Find the most relevant products by category or keyword match
                    for (const product of availableProducts) {
                        const categoryMatch = product.category && customerMessageLower.includes(product.category.toLowerCase());
                        const descMatch = product.description && customerMessageLower.split(/\s+/).some(
                            word => word.length > 3 && product.description!.toLowerCase().includes(word)
                        );
                        if (categoryMatch || descMatch) {
                            matchedProducts.push(product);
                        }
                    }
                    // If still no matches, include the first few active products as fallback
                    if (matchedProducts.length === 0) {
                        matchedProducts.push(...availableProducts.slice(0, 2));
                    }
                }
            }

            // Add matched products as inline content (limit to 3)
            for (const product of matchedProducts.slice(0, 3)) {
                inlineContent.push({
                    type: 'product',
                    position: matchedProducts.length === 1 ? 'after' : 'inline',
                    data: product,
                });
            }
        }

        return {
            success: true,
            message: 'Suggestion generated successfully',
            suggestedReply: parsed.suggestedReply,
            confidence: parsed.confidence || 0.85,
            reasoning: parsed.reasoning || 'Based on business profile, products/services, and documents',
            sources,
            inlineContent: inlineContent.length > 0 ? inlineContent : undefined,
            availableProducts: availableProducts.length > 0 ? availableProducts : undefined,
            personaUsed: !!context.customerProfile,
        };
    } catch (error: any) {
        console.error('[InboxAI] Error:', error);
        return { success: false, message: error.message };
    }
}

export async function getActiveAgentsAction(
    partnerId: string
): Promise<{
    success: boolean;
    agents?: Array<{
        id: string;
        name: string;
        avatar: string;
        description: string;
        role: string;
        isCustomAgent: boolean;
        isActive: boolean;
    }>;
    error?: string;
}> {
    try {
        if (!db) {
            return { success: false, error: 'Database unavailable' };
        }

        const partnerDoc = await db.collection('partners').doc(partnerId).get();
        let industryCategory: IndustryCategory = 'other';
        if (partnerDoc.exists) {
            const partnerData = partnerDoc.data();
            industryCategory = partnerData?.businessPersona?.identity?.industry?.category || 'other';
        }

        const industryTemplates = getAgentTemplatesForIndustry(industryCategory);
        const snapshot = await db.collection('partners').doc(partnerId).collection('hubAgents').get();

        const savedAgentsMap = new Map<string, any>();
        snapshot.docs.forEach(doc => {
            savedAgentsMap.set(doc.id, { id: doc.id, ...doc.data() });
        });

        const agents: any[] = [];
        for (const template of industryTemplates) {
            const templateId = `essential-${template.role}`;
            const savedAgent = savedAgentsMap.get(templateId);
            const isActive = savedAgent?.isActive ?? true;

            if (isActive) {
                agents.push({
                    id: templateId,
                    name: savedAgent?.name || template.name,
                    avatar: savedAgent?.avatar || template.avatar,
                    description: savedAgent?.description || template.description,
                    role: template.role,
                    isCustomAgent: false,
                    isActive: true,
                });
            }
            savedAgentsMap.delete(templateId);
        }

        for (const [id, agent] of savedAgentsMap) {
            if (agent.isActive) {
                agents.push({
                    id,
                    name: agent.name || 'Unnamed Agent',
                    avatar: agent.avatar || '🤖',
                    description: agent.description || '',
                    role: agent.role || 'CUSTOM',
                    isCustomAgent: agent.isCustomAgent ?? true,
                    isActive: true,
                });
            }
        }

        return { success: true, agents };
    } catch (error: any) {
        console.error('Get active agents error:', error);
        return { success: false, error: error.message };
    }
}