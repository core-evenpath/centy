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
import { GoogleGenerativeAI } from '@google/generative-ai';
import { isGeneralModeAssistant, getEssentialAssistantById } from '@/lib/types-assistant';
import { getAgentTemplatesForIndustry } from '@/lib/business-type-agents';
import type { IndustryCategory } from '@/lib/business-persona-types';
import { getCoreAccessibleDataAction } from './business-persona-actions';
import { getCoreHubContextString } from './core-hub-actions';

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
                // Increase context limits significantly for better RAG performance
                // For specific documents: up to 30K characters per document
                // For all documents: up to 8K characters per document
                const textLimit = options?.documentIds ? 30000 : 8000;
                const text = data.extractedText.substring(0, textLimit);

                contextSnippets.push({
                    source: data.name || doc.id,
                    text: text,
                });
            }
        });

        // Sort contextSnippets by relevance if we have the query
        // For now, prioritize by text length (longer docs might have more info)
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

/**
 * Delete an agent (only custom agents can be deleted)
 */
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

        // Check if it's a custom agent before deleting
        const agentDoc = await agentRef.get();
        if (!agentDoc.exists) {
            return { success: false, error: 'Agent not found' };
        }

        const agentData = agentDoc.data();
        // Only allow deleting custom agents (those starting with 'custom-' or with isCustomAgent flag)
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

/**
 * Test an agent with a message - uses RAG like inbox but doesn't require a thread
 */
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
    console.log('🧪 Agent Test starting...');
    const startTime = Date.now();

    try {
        if (!db) {
            return { success: false, message: 'Database unavailable' };
        }

        // Fetch agent configuration
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

        // Fetch partner profile as the single source of truth for business info
        const partnerDoc = await db.collection('partners').doc(partnerId).get();
        let partnerInfo: any = null;
        if (partnerDoc.exists) {
            partnerInfo = partnerDoc.data();
        }

        // Gather document context based on agent config
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

        // If no agent-specific docs, fallback to all docs
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

        // Fetch document content
        const contextSnippets: { source: string; text: string }[] = [];

        if (documentIds.length > 0) {
            const docPromises = documentIds.slice(0, 8).map(docId =>
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
                        });
                    }
                }
            });
        }

        // Build system prompt from agent config + partner profile (single source of truth for business info)
        const persona = partnerInfo?.businessPersona;
        const identity = persona?.identity;
        const personality = persona?.personality;
        const knowledge = persona?.knowledge;

        const businessName = identity?.name || partnerInfo?.businessName || partnerInfo?.name || agentConfig?.businessName || 'the business';
        let systemPrompt = `You are ${agentConfig?.name || 'an AI assistant'} for ${businessName}.`;

        // Add business description and tagline
        if (personality?.tagline) {
            systemPrompt += ` ${personality.tagline}`;
        }
        if (personality?.description) {
            systemPrompt += `\n\nAbout the business: ${personality.description}`;
        }

        // Add business info from partner profile (single source of truth)
        const businessDetails: string[] = [];
        if (identity?.phone || partnerInfo?.phone) businessDetails.push(`Phone: ${identity?.phone || partnerInfo.phone}`);
        if (identity?.email || partnerInfo?.email) businessDetails.push(`Email: ${identity?.email || partnerInfo.email}`);
        if (identity?.address?.city && identity?.address?.state) {
            businessDetails.push(`Location: ${identity.address.city}, ${identity.address.state}`);
        } else if (partnerInfo?.location?.city && partnerInfo?.location?.state) {
            businessDetails.push(`Location: ${partnerInfo.location.city}, ${partnerInfo.location.state}`);
        }
        if (identity?.website) businessDetails.push(`Website: ${identity.website}`);
        if (identity?.industry?.name || partnerInfo?.industry?.name) {
            businessDetails.push(`Industry: ${identity?.industry?.name || partnerInfo?.industry?.name}`);
        }
        if (identity?.currency) businessDetails.push(`Currency: ${identity.currency}`);

        // Add operating hours (complete schedule from Business Manager AI)
        if (identity?.operatingHours) {
            if (identity.operatingHours.isOpen24x7) {
                businessDetails.push(`Operating Hours: Open 24/7`);
            } else if (identity.operatingHours.schedule) {
                const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                const schedule = identity.operatingHours.schedule;
                const hoursLines: string[] = [];

                for (const day of dayOrder) {
                    const sched = schedule[day];
                    if (sched?.isOpen) {
                        const dayName = day.charAt(0).toUpperCase() + day.slice(1);
                        let timeStr = `${sched.openTime} - ${sched.closeTime}`;
                        if (sched.breakTime?.start && sched.breakTime?.end) {
                            timeStr += ` (Break: ${sched.breakTime.start}-${sched.breakTime.end})`;
                        }
                        hoursLines.push(`  ${dayName}: ${timeStr}`);
                    } else if (sched) {
                        const dayName = day.charAt(0).toUpperCase() + day.slice(1);
                        hoursLines.push(`  ${dayName}: Closed`);
                    }
                }

                if (hoursLines.length > 0) {
                    businessDetails.push(`Operating Hours:\n${hoursLines.join('\n')}`);
                }
            }
            if (identity.operatingHours.appointmentOnly) {
                businessDetails.push(`Note: By appointment only`);
            }
            if (identity.operatingHours.onlineAlways) {
                businessDetails.push(`Note: Online services available 24/7`);
            }
            if (identity.operatingHours.specialNote) {
                businessDetails.push(`Special Note: ${identity.operatingHours.specialNote}`);
            }
            if (identity.operatingHours.holidays?.length > 0) {
                businessDetails.push(`Closed on holidays: ${identity.operatingHours.holidays.join(', ')}`);
            }
        }

        // Build business context that should ALWAYS be included (from Business Manager AI)
        let businessContext = '';

        if (businessDetails.length > 0) {
            businessContext += `\n\nBUSINESS INFORMATION (from Business Manager):\n${businessDetails.join('\n')}`;
        }

        // Add products/services if available
        if (knowledge?.productsOrServices?.length > 0) {
            const products = knowledge.productsOrServices
                .slice(0, 5)
                .map((p: any) => `- ${p.name}${p.priceRange ? ` (${p.priceRange})` : ''}: ${p.description || 'No description'}`)
                .join('\n');
            businessContext += `\n\nPRODUCTS/SERVICES:\n${products}`;
        }

        // Add unique selling points
        if (personality?.uniqueSellingPoints?.length > 0) {
            businessContext += `\n\nWhat makes us special: ${personality.uniqueSellingPoints.join(', ')}`;
        }

        // If agent has a custom system prompt, use it as base but ALWAYS append business context
        if (agentConfig?.systemPrompt) {
            systemPrompt = agentConfig.systemPrompt + businessContext;
        } else {
            systemPrompt += businessContext;
        }

        if (agentConfig?.openingMessage) {
            systemPrompt += `\n\n${agentConfig.openingMessage}`;
        }

        // Add tones/style if available
        if (agentConfig?.tones?.length > 0) {
            systemPrompt += `\n\nCommunication style: ${agentConfig.tones.join(', ')}`;
        }
        if (agentConfig?.style) {
            systemPrompt += `, ${agentConfig.style}`;
        }
        if (agentConfig?.responseLength) {
            systemPrompt += `\nResponse length: ${agentConfig.responseLength}`;
        }

        // Add behavior rules
        if (agentConfig?.neverSay?.length > 0) {
            systemPrompt += `\n\nNEVER SAY: ${agentConfig.neverSay.join(', ')}`;
        }
        if (agentConfig?.alwaysInclude?.length > 0) {
            systemPrompt += `\n\nALWAYS INCLUDE: ${agentConfig.alwaysInclude.join(', ')}`;
        }
        if (agentConfig?.behaviorRules?.neverSay?.length > 0) {
            systemPrompt += `\n\nNEVER SAY: ${agentConfig.behaviorRules.neverSay.join(', ')}`;
        }
        if (agentConfig?.behaviorRules?.responseRules?.length > 0) {
            systemPrompt += `\n\nRULES: ${agentConfig.behaviorRules.responseRules.join(', ')}`;
        }

        // Check FAQs first
        if (agentConfig?.faqs?.length > 0) {
            const messageLower = userMessage.toLowerCase();
            for (const faq of agentConfig.faqs) {
                if (faq.question && faq.answer) {
                    const questionLower = faq.question.toLowerCase();
                    // Simple keyword matching
                    const keywords = questionLower.split(' ').filter((w: string) => w.length > 3);
                    const matches = keywords.filter((kw: string) => messageLower.includes(kw)).length;
                    if (matches >= 2 || messageLower.includes(questionLower.substring(0, 15))) {
                        console.log(`✅ FAQ match found in ${Date.now() - startTime}ms`);
                        return {
                            success: true,
                            message: 'Response from FAQ',
                            response: faq.answer,
                            sources: [{ name: 'FAQ', excerpt: faq.question }],
                        };
                    }
                }
            }
        }

        const contextString = contextSnippets
            .map((c) => `[Source: ${c.source}]\n${c.text}`)
            .join('\n\n---\n\n');

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `${systemPrompt}

DOCUMENT CONTEXT:
${contextString || 'No documents available'}

CUSTOMER MESSAGE:
"${userMessage}"

Respond as this assistant would. Be helpful, use the document context when relevant, and match the specified communication style. Keep responses conversational and appropriately sized.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        const elapsed = Date.now() - startTime;
        console.log(`✅ Agent test completed in ${elapsed}ms`);

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
        return {
            success: false,
            message: error.message || 'Failed to generate response',
        };
    }
}

const GENERAL_MODE_SYSTEM_PROMPT = `You are a general AI assistant. You do NOT have access to any business-specific documents or knowledge base.

IMPORTANT LIMITATIONS:
- You CANNOT access this business's files, documents, pricing, policies, or internal information
- You CANNOT look up specific product details, inventory, or customer records
- You CANNOT provide business-specific answers that would require document access

WHAT YOU CAN DO:
- Provide helpful, general assistance based on your training
- Answer general knowledge questions
- Help with writing, brainstorming, and general advice
- Assist with tasks that don't require business-specific information

WHEN ASKED ABOUT BUSINESS SPECIFICS:
- Politely explain that you're in General Mode and don't have access to business documents
- Suggest the customer ask to switch to a specialized assistant (Customer Care, Sales, etc.) for business-specific questions
- Offer to help with any general questions in the meantime

Be helpful, professional, and honest about your limitations in this mode.`;

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

        const primaryAssistantId = assistantIds?.[0];
        const isGeneralMode = primaryAssistantId ? isGeneralModeAssistant(primaryAssistantId) : false;

        if (isGeneralMode) {
            console.log('🤖 General Mode selected - skipping document queries');

            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

            const prompt = `${GENERAL_MODE_SYSTEM_PROMPT}

CONVERSATION CONTEXT:
${conversationContext || 'No previous messages'}

CUSTOMER MESSAGE:
"${customerMessage}"

Generate a helpful response. Remember: you cannot access any business documents, so if the customer asks about specific products, pricing, policies, or other business-specific information, politely explain your limitations and suggest they ask to switch to a specialized assistant.

Respond in JSON format:
{
    "suggestedReply": "Your suggested reply here",
    "confidence": 0.7,
    "reasoning": "Brief explanation"
}`;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text();

            let parsed: any;
            try {
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    parsed = JSON.parse(jsonMatch[0]);
                } else {
                    parsed = {
                        suggestedReply: responseText.trim(),
                        confidence: 0.7,
                        reasoning: 'General AI response (no document access)',
                    };
                }
            } catch (e) {
                parsed = {
                    suggestedReply: responseText.trim(),
                    confidence: 0.7,
                    reasoning: 'General AI response (no document access)',
                };
            }

            const elapsed = Date.now() - startTime;
            console.log(`✅ General Mode suggestion completed in ${elapsed}ms`);

            return {
                success: true,
                message: 'Suggestion generated successfully (General Mode)',
                suggestedReply: parsed.suggestedReply,
                confidence: parsed.confidence || 0.7,
                reasoning: parsed.reasoning || 'General AI response without document access',
                sources: [],
                personaUsed: false,
                assistantUsed: {
                    id: 'essential-general_mode',
                    name: 'General Mode',
                    avatar: '🤖',
                    usedAsFallback: false,
                },
            };
        }

        // Fetch partner profile data through the visibility-controlled action
        const accessibleDataResult = await getCoreAccessibleDataAction(partnerId);
        let accessibleData: any = {};
        let businessSummary = '';

        if (accessibleDataResult.success && accessibleDataResult.data) {
            accessibleData = accessibleDataResult.data;
            businessSummary = accessibleDataResult.data.summary || '';
        }

        // ══════════════════════════════════════════════════════════════
        // CORE HUB: Read module items directly from businessModules
        // ══════════════════════════════════════════════════════════════
        let coreHubContext = '';
        try {
            coreHubContext = await getCoreHubContextString(partnerId);
            if (coreHubContext) {
                console.log(`[InboxAI] Module items context: ${coreHubContext.length} chars`);
            }
        } catch (coreHubError: any) {
            console.warn('[InboxAI] Module items fetch failed:', coreHubError.message);
        }

        // Fetch agents logic remains the same
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

        let usedAssistant: any = null;
        let usedAsFallback = false;
        let sourcesAreGlobal = false;
        let systemPrompt = '';
        let documentIds: string[] = [];

        if (assistants.length > 0) {
            const primary = assistants[0];
            console.log(`🎯 Trying primary assistant: ${primary.name}`);

            let primaryDocIds: string[] = [];
            // Check both root level and nested documentConfig for backward compatibility
            if (primary.useAllDocuments || primary.documentConfig?.useAllDocuments) {
                const allDocsSnapshot = await db
                    .collection('partners')
                    .doc(partnerId)
                    .collection('hubDocuments')
                    .where('status', '==', ProcessingStatus.COMPLETED)
                    .limit(15)
                    .get();
                primaryDocIds = allDocsSnapshot.docs.map(d => d.id);
            } else {
                primaryDocIds = primary.attachedDocumentIds || primary.documentConfig?.attachedDocumentIds || [];
            }

            if (primaryDocIds.length > 0) {
                usedAssistant = primary;
                documentIds = primaryDocIds;
                systemPrompt = primary.systemPrompt || '';
            } else {
                for (let i = 1; i < assistants.length; i++) {
                    const fallback = assistants[i];

                    if (isGeneralModeAssistant(fallback.id)) {
                        continue;
                    }

                    console.log(`🔄 Trying fallback assistant: ${fallback.name}`);

                    let fallbackDocIds: string[] = [];
                    // Check both root level and nested documentConfig for backward compatibility
                    if (fallback.useAllDocuments || fallback.documentConfig?.useAllDocuments) {
                        const allDocsSnapshot = await db
                            .collection('partners')
                            .doc(partnerId)
                            .collection('hubDocuments')
                            .where('status', '==', ProcessingStatus.COMPLETED)
                            .limit(15)
                            .get();
                        fallbackDocIds = allDocsSnapshot.docs.map(d => d.id);
                    } else {
                        fallbackDocIds = fallback.attachedDocumentIds || fallback.documentConfig?.attachedDocumentIds || [];
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

            if (docsSnapshot.empty && !coreHubContext) {
                return {
                    success: false,
                    message: 'No documents found. Please upload documents in Core Memory first.',
                };
            }

            documentIds = docsSnapshot.docs.map(d => d.id);
        } else if (documentIds.length === 0 && assistants.length > 0) {
            console.log('⚠️ Assistants selected but no content found. Using Primary Assistant (Pure Generation).');
            usedAssistant = assistants[0];
            systemPrompt = usedAssistant.systemPrompt || '';
        }

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

        if (contextSnippets.length === 0 && !usedAssistant && !coreHubContext) {
            return {
                success: false,
                message: 'No document content available for request.',
            };
        }

        const contextString = contextSnippets
            .map((c) => `[Source: ${c.source}]\n${c.text}`)
            .join('\n\n---\n\n');

        // Use accessible data for system prompt construction
        const identity = accessibleData?.identity;
        const personality = accessibleData?.personality;
        const knowledge = accessibleData?.knowledge;
        const customerProfile = accessibleData?.customerProfile;
        const industrySpecificData = accessibleData?.industrySpecificData;
        const otherUsefulData = accessibleData?.otherUsefulData;

        let finalSystemPrompt = systemPrompt;
        if (!finalSystemPrompt) {
            const businessName = identity?.name || 'the business';
            finalSystemPrompt = `You are a helpful AI assistant for ${businessName}. Answer questions based on the provided context.`;

            if (personality?.tagline) {
                finalSystemPrompt += ` ${personality.tagline}`;
            }
        }

        // ========== BUILD COMPREHENSIVE BUSINESS KNOWLEDGE ==========
        const businessKnowledge: string[] = [];

        // --- IDENTITY SECTION ---
        if (identity) {
            if (identity.name) businessKnowledge.push(`Business Name: ${identity.name}`);
            if (identity.phone) businessKnowledge.push(`Phone: ${identity.phone}`);
            if (identity.email) businessKnowledge.push(`Email: ${identity.email}`);
            if (identity.website) businessKnowledge.push(`Website: ${identity.website}`);
            if (identity.whatsAppNumber) businessKnowledge.push(`WhatsApp: ${identity.whatsAppNumber}`);

            // Full Address
            if (identity.address) {
                const addr = identity.address;
                const addressParts = [addr.street, addr.area, addr.city, addr.state, addr.postalCode || addr.pincode, addr.country].filter(Boolean);
                if (addressParts.length > 0) {
                    businessKnowledge.push(`Address: ${addressParts.join(', ')}`);
                }
            }

            // Full Operating Hours
            if (identity.operatingHours) {
                const hours = identity.operatingHours;
                if (hours.isOpen24x7) {
                    businessKnowledge.push(`Operating Hours: Open 24/7`);
                } else if (hours.appointmentOnly) {
                    businessKnowledge.push(`Operating Hours: By Appointment Only`);
                } else if (hours.schedule) {
                    const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                    const scheduleLines: string[] = [];
                    for (const day of dayOrder) {
                        const sched = hours.schedule[day];
                        if (sched) {
                            const isOpen = sched.isOpen || (sched.openTime && sched.closeTime);
                            const openTime = sched.openTime || sched.open;
                            const closeTime = sched.closeTime || sched.close;
                            const dayName = day.charAt(0).toUpperCase() + day.slice(1);
                            if (isOpen && openTime && closeTime) {
                                scheduleLines.push(`  ${dayName}: ${openTime} - ${closeTime}`);
                            } else {
                                scheduleLines.push(`  ${dayName}: Closed`);
                            }
                        }
                    }
                    if (scheduleLines.length > 0) {
                        businessKnowledge.push(`Operating Hours:\n${scheduleLines.join('\n')}`);
                    }
                }
                if (hours.specialNote) {
                    businessKnowledge.push(`Hours Note: ${hours.specialNote}`);
                }
            }

            // Social Media
            if (identity.socialMedia) {
                const social = identity.socialMedia;
                const platforms = Object.entries(social)
                    .filter(([_, url]) => url && url !== '')
                    .map(([platform, url]) => `${platform}: ${url}`);
                if (platforms.length > 0) {
                    businessKnowledge.push(`Social Media:\n  ${platforms.join('\n  ')}`);
                }
            }

            // Industry
            if (identity.industry) {
                const ind = identity.industry;
                if (typeof ind === 'string') {
                    businessKnowledge.push(`Industry: ${ind}`);
                } else if (ind.name || ind.category) {
                    businessKnowledge.push(`Industry: ${ind.category ? ind.category.replace(/_/g, ' ') : ''} ${ind.name ? '- ' + ind.name : ''}`);
                }
            }

            if (identity.currency) businessKnowledge.push(`Currency: ${identity.currency}`);
            if (identity.timezone) businessKnowledge.push(`Timezone: ${identity.timezone}`);
        }

        // --- PERSONALITY SECTION ---
        if (personality) {
            if (personality.description) {
                businessKnowledge.push(`About the Business: ${personality.description}`);
            }
            if (personality.uniqueSellingPoints?.length > 0) {
                businessKnowledge.push(`Unique Selling Points:\n  - ${personality.uniqueSellingPoints.join('\n  - ')}`);
            }
            if (personality.voiceTone?.length > 0) {
                businessKnowledge.push(`Communication Style: ${personality.voiceTone.join(', ')}`);
            }
            if (personality.brandValues?.length > 0) {
                businessKnowledge.push(`Brand Values: ${personality.brandValues.join(', ')}`);
            }
            if (personality.languagePreference?.length > 0) {
                businessKnowledge.push(`Languages: ${personality.languagePreference.join(', ')}`);
            }
        }

        // --- KNOWLEDGE SECTION (Products, Services, FAQs, Policies) ---
        if (knowledge) {
            // ALL Products/Services (not just first 5)
            if (knowledge.productsOrServices?.length > 0) {
                const products = knowledge.productsOrServices.map((p: any) => {
                    const parts = [p.name];
                    if (p.priceRange) parts.push(`(${p.priceRange})`);
                    if (p.description) parts.push(`- ${p.description}`);
                    return parts.join(' ');
                });
                businessKnowledge.push(`Products & Services:\n  - ${products.join('\n  - ')}`);
            }

            // ALL FAQs with answers
            if (knowledge.faqs?.length > 0) {
                const faqText = knowledge.faqs.map((faq: any) => {
                    const q = faq.question || faq.q;
                    const a = faq.answer || faq.a;
                    return `Q: ${q}\n   A: ${a}`;
                }).join('\n\n');
                businessKnowledge.push(`Frequently Asked Questions:\n${faqText}`);
            }

            // Pricing
            if (knowledge.pricingModel) {
                businessKnowledge.push(`Pricing Model: ${knowledge.pricingModel}`);
            }
            if (knowledge.pricingHighlights) {
                businessKnowledge.push(`Pricing Info: ${knowledge.pricingHighlights}`);
            }

            // Payment Methods
            if (knowledge.acceptedPayments?.length > 0) {
                businessKnowledge.push(`Accepted Payments: ${knowledge.acceptedPayments.join(', ')}`);
            }

            // Policies
            if (knowledge.policies) {
                const policies = knowledge.policies;
                const policyLines: string[] = [];
                Object.entries(policies).forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== '') {
                        const label = key.replace(/([A-Z])/g, ' $1').trim();
                        if (typeof value === 'boolean') {
                            policyLines.push(`${label}: ${value ? 'Yes' : 'No'}`);
                        } else {
                            policyLines.push(`${label}: ${value}`);
                        }
                    }
                });
                if (policyLines.length > 0) {
                    businessKnowledge.push(`Policies:\n  - ${policyLines.join('\n  - ')}`);
                }
            }

            // Current Offers
            if (knowledge.currentOffers?.length > 0) {
                businessKnowledge.push(`Current Offers:\n  - ${knowledge.currentOffers.join('\n  - ')}`);
            }
        }

        // --- CUSTOMER PROFILE SECTION ---
        if (customerProfile) {
            if (customerProfile.targetAudience) {
                businessKnowledge.push(`Target Audience: ${customerProfile.targetAudience}`);
            }
            if (customerProfile.customerPainPoints?.length > 0) {
                businessKnowledge.push(`Common Customer Pain Points:\n  - ${customerProfile.customerPainPoints.join('\n  - ')}`);
            }
            if (customerProfile.commonQueries?.length > 0) {
                businessKnowledge.push(`Common Customer Questions:\n  - ${customerProfile.commonQueries.join('\n  - ')}`);
            }
        }

        // --- INDUSTRY SPECIFIC DATA ---
        if (industrySpecificData && Object.keys(industrySpecificData).length > 0) {
            const industryLines: string[] = [];

            const formatValue = (val: any): string => {
                if (Array.isArray(val)) return val.join(', ');
                if (typeof val === 'object' && val !== null) {
                    return Object.entries(val)
                        .filter(([_, v]) => v !== null && v !== undefined && v !== '')
                        .map(([k, v]) => `${k}: ${formatValue(v)}`)
                        .join('; ');
                }
                return String(val);
            };

            Object.entries(industrySpecificData).forEach(([section, data]) => {
                if (section === 'ragStatus' || section === 'fetchedReviews') return;
                if (data && typeof data === 'object') {
                    Object.entries(data as Record<string, any>).forEach(([key, value]) => {
                        if (value !== null && value !== undefined && value !== '') {
                            const label = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim();
                            industryLines.push(`${label}: ${formatValue(value)}`);
                        }
                    });
                }
            });

            if (industryLines.length > 0) {
                businessKnowledge.push(`Industry-Specific Information:\n  - ${industryLines.join('\n  - ')}`);
            }
        }

        // --- OTHER USEFUL DATA ---
        if (otherUsefulData?.length > 0) {
            const otherLines = otherUsefulData
                .filter((item: any) => item.visibleToCore !== false)
                .map((item: any) => `${item.key}: ${item.value}`);
            if (otherLines.length > 0) {
                businessKnowledge.push(`Additional Information:\n  - ${otherLines.join('\n  - ')}`);
            }
        }

        // ========== ADD TO SYSTEM PROMPT ==========
        if (businessKnowledge.length > 0) {
            finalSystemPrompt += `\n\n========== BUSINESS KNOWLEDGE ==========\n`;
            finalSystemPrompt += businessKnowledge.join('\n\n');
            finalSystemPrompt += `\n========================================\n`;
            finalSystemPrompt += `\nIMPORTANT: Use the business knowledge above to answer customer questions accurately. Reference specific details like operating hours, products, prices, and policies when relevant.`;
        }

        // ========== ADD CORE HUB MODULE ITEMS ==========
        if (coreHubContext) {
            finalSystemPrompt += `\n\n========== PRODUCTS, SERVICES & MODULE ITEMS ==========\n`;
            finalSystemPrompt += coreHubContext;
            finalSystemPrompt += `\n======================================================\n`;
            finalSystemPrompt += `\nIMPORTANT: Use the products, services, and pricing information above to answer customer questions about offerings. Be specific with prices, descriptions, and availability when asked.`;
        }

        // Add logging for debugging
        console.log(`[InboxAI] Business knowledge sections: ${businessKnowledge.length}`);
        console.log(`[InboxAI] Core Hub context: ${coreHubContext ? coreHubContext.length + ' chars' : 'none'}`);
        console.log(`[InboxAI] System prompt length: ${finalSystemPrompt.length} chars`);

        if (personaContext) {
            finalSystemPrompt += `\n\n${personaContext}\nUse this persona information to personalize your response appropriately.`;
        }

        // Add recent profile changes context (if available)
        try {
            const { getProfileChangesContextAction } = await import('./profile-sync-actions');
            const changesResult = await getProfileChangesContextAction(partnerId);
            if (changesResult.success && changesResult.context) {
                finalSystemPrompt += `\n\n${changesResult.context}\nYou may reference these recent updates if relevant to the customer's query.`;
            }
        } catch (e) {
            // Non-blocking - continue without profile changes context
        }

        if (usedAssistant?.behaviorRules) {
            const rules = usedAssistant.behaviorRules;
            if (rules.responseRules?.length > 0) {
                finalSystemPrompt += `\n\nRULES TO FOLLOW:\n${rules.responseRules.map((r: string) => `- ${r}`).join('\n')}`;
            }
            if (rules.neverSay?.length > 0) {
                finalSystemPrompt += `\n\nNEVER SAY:\n${rules.neverSay.map((r: string) => `- "${r}"`).join('\n')}`;
            }
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `${finalSystemPrompt}

DOCUMENT CONTEXT:
${contextString || 'No documents available'}

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
                fromAssistant: sourcesAreGlobal ? undefined : usedAssistant?.name,
            };
        });

        // Add Core Hub as a source if it contributed context
        if (coreHubContext && coreHubContext.length > 100) {
            sources.unshift({
                type: 'document' as const,
                name: 'Business Profile & Module Items',
                excerpt: 'Products, services, pricing, and business information from modules',
                relevance: 0.95,
                fromAssistant: undefined,
            });
        }

        const elapsed = Date.now() - startTime;
        console.log(`✅ Inbox AI Suggestion completed in ${elapsed}ms`);

        // Boost confidence if Core Hub context was available
        const baseConfidence = parsed.confidence || 0.85;
        const adjustedConfidence = coreHubContext && coreHubContext.length > 100
            ? Math.min(0.95, baseConfidence + 0.05)
            : baseConfidence;

        return {
            success: true,
            message: 'Suggestion generated successfully',
            suggestedReply: parsed.suggestedReply,
            confidence: adjustedConfidence,
            reasoning: parsed.reasoning || (coreHubContext ? 'Based on business profile, module items, and documents' : 'Based on your business documents'),
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

/**
 * Get active agents for inbox selection
 * Uses industry templates merged with Firestore data (same logic as agents page)
 */
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

        // 1. Fetch business persona to get industry category
        const partnerDoc = await db.collection('partners').doc(partnerId).get();
        let industryCategory: IndustryCategory = 'other';

        if (partnerDoc.exists) {
            const partnerData = partnerDoc.data();
            industryCategory = partnerData?.businessPersona?.identity?.industry?.category || 'other';
        }

        // 2. Get industry-specific agent templates
        const industryTemplates = getAgentTemplatesForIndustry(industryCategory);

        // 3. Fetch saved agents from Firestore
        const snapshot = await db
            .collection('partners')
            .doc(partnerId)
            .collection('hubAgents')
            .get();

        const savedAgentsMap = new Map<string, any>();
        snapshot.docs.forEach(doc => {
            savedAgentsMap.set(doc.id, { id: doc.id, ...doc.data() });
        });

        // 4. Build agents list: templates merged with saved data
        const agents: Array<{
            id: string;
            name: string;
            avatar: string;
            description: string;
            role: string;
            isCustomAgent: boolean;
            isActive: boolean;
        }> = [];

        // Add template-based agents (essential agents)
        for (const template of industryTemplates) {
            const templateId = `essential-${template.role}`;
            const savedAgent = savedAgentsMap.get(templateId);

            // Use saved data if exists, otherwise use template defaults
            const isActive = savedAgent?.isActive ?? true; // Templates are active by default

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

            // Remove from map so we don't add it again
            savedAgentsMap.delete(templateId);
        }

        // 5. Add custom agents (those not from templates)
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