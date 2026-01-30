"use server";

import { GoogleGenAI } from "@google/genai";
import { getCoreAccessibleDataAction } from "./business-persona-actions";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const FAST_MODEL = "gemini-3-pro-preview";

export async function generateInboxSuggestionFastAction(
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
        type: "document";
        name: string;
        excerpt: string;
        relevance: number;
    }>;
}> {
    const startTime = Date.now();
    console.log("⚡ Fast Inbox AI starting...");

    try {
        const { db } = await import("@/lib/firebase-admin");
        if (!db) {
            return { success: false, message: "Database unavailable" };
        }

        const docsSnapshot = await db
            .collection("partners")
            .doc(partnerId)
            .collection("hubDocuments")
            .where("status", "==", "COMPLETED")
            .limit(5)
            .get();

        if (docsSnapshot.empty) {
            return {
                success: false,
                message: "No documents found. Upload documents in Core Memory first.",
            };
        }

        const contextSnippets: { source: string; text: string }[] = [];
        docsSnapshot.docs.forEach((doc) => {
            const data = doc.data();
            if (data?.extractedText) {
                contextSnippets.push({
                    source: data.name || data.originalName || doc.id,
                    text: data.extractedText.substring(0, 2000),
                });
            }
        });

        if (contextSnippets.length === 0) {
            return {
                success: false,
                message: "No text extracted from documents.",
            };
        }

        const contextString = contextSnippets
            .map((c) => `[${c.source}]: ${c.text}`)
            .join("\n\n");

        const conversationPart = conversationContext
            ? `\nRecent chat:\n${conversationContext}\n`
            : "";

        // Fetch business data
        const accessibleDataResult = await getCoreAccessibleDataAction(partnerId);
        let businessKnowledgeText = '';

        if (accessibleDataResult.success && accessibleDataResult.data) {
            const accessibleData = accessibleDataResult.data;
            const businessKnowledge: string[] = [];

            // Extract key business data (similar logic to main inbox action but condensed)
            const identity = accessibleData.identity;
            const knowledge = accessibleData.knowledge;
            const personality = accessibleData.personality;

            if (identity) {
                if (identity.name) businessKnowledge.push(`Business: ${identity.name}`);
                if (identity.operatingHours?.schedule) {
                    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                    const schedule = identity.operatingHours.schedule as any;
                    const openDays = days.filter(d => schedule[d]?.isOpen);

                    if (identity.operatingHours.isOpen24x7) {
                        businessKnowledge.push("Hours: Open 24/7");
                    } else if (openDays.length > 0) {
                        businessKnowledge.push(`Hours: Open ${openDays.length} days/week`);
                    }
                }

                if (identity.address?.city) businessKnowledge.push(`Location: ${identity.address.city}`);
            }

            if (knowledge) {
                if (knowledge.productsOrServices && knowledge.productsOrServices.length > 0) {
                    const products = knowledge.productsOrServices
                        .map((p: any) => `${p.name}${p.priceRange ? ` (${p.priceRange})` : ''}`)
                        .join(', ');
                    businessKnowledge.push(`Products: ${products}`);
                }

                if (knowledge.faqs && knowledge.faqs.length > 0) {
                    const topFaqs = knowledge.faqs.slice(0, 3).map((f: any) => `Q:${f.question} A:${f.answer}`).join(' | ');
                    businessKnowledge.push(`FAQs: ${topFaqs}`);
                }

                if (knowledge.policies) {
                    const pols = Object.entries(knowledge.policies)
                        .filter(([_, v]) => v && v !== '')
                        .map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1').trim()}: ${v}`);
                    if (pols.length > 0) businessKnowledge.push(`Policies: ${pols.join(', ')}`);
                }
            }

            if (personality?.tagline) businessKnowledge.push(`Tagline: ${personality.tagline}`);

            if (businessKnowledge.length > 0) {
                businessKnowledgeText = `\nBUSINESS INFO:\n${businessKnowledge.join('\n')}\n`;
            }
        }

        const prompt = `You are a helpful assistant. Use the knowledge below to answer.
${businessKnowledgeText}
KNOWLEDGE FROM DOCUMENTS:
${contextString}

${conversationPart}
Customer: "${customerMessage}"

Reply in 2-3 sentences. Be helpful and direct. If unsure, say so.`;

        const response = await genAI.models.generateContent({
            model: FAST_MODEL,
            contents: prompt,
            config: {
                temperature: 0.2,
                maxOutputTokens: 150,
            },
        });

        const responseText = response.text?.trim() || "";

        if (!responseText) {
            return { success: false, message: "Empty response from AI" };
        }

        const totalTime = Date.now() - startTime;
        console.log(`⚡ Fast response in ${totalTime}ms`);

        const sources = contextSnippets.slice(0, 3).map((snippet) => ({
            type: "document" as const,
            name: snippet.source,
            excerpt: snippet.text.substring(0, 100) + "...",
            relevance: 0.85,
        }));

        return {
            success: true,
            message: "Success",
            suggestedReply: responseText,
            confidence: contextSnippets.length > 0 ? 0.85 : 0.5,
            reasoning: `Based on ${contextSnippets.length} document${contextSnippets.length > 1 ? "s" : ""} (${totalTime}ms)`,
            sources,
        };
    } catch (error: any) {
        console.error("❌ Fast suggestion failed:", error);
        return {
            success: false,
            message: `Error: ${error.message}`,
        };
    }
}