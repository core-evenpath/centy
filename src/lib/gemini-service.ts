import { GoogleGenAI, Type, Schema, GenerateContentResponse } from "@google/genai";
import { Attachment } from './partnerhub-types';

// Initialize Gemini Client
// In Next.js, use process.env.GEMINI_API_KEY or process.env.GOOGLE_GENAI_API_KEY
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

// Use standard models if preview ones are not available
// Use standard models

const GENERATION_MODEL = 'gemini-3-pro-preview';
// Only use Flash Image for strictly generating images, not for analysis
const IMAGE_GEN_MODEL = 'gemini-2.5-flash-image';
const EMBEDDING_MODEL = 'text-embedding-004';

// Helper for delay
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry wrapper for API calls
async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 3, initialDelay = 1000): Promise<T> {
    let attempt = 0;
    while (attempt < retries) {
        try {
            return await fn();
        } catch (error: any) {
            const status = error?.status || error?.code || 0;
            const message = error?.message || '';

            const isRetryable =
                status === 429 ||
                status >= 500 ||
                message.includes('429') ||
                message.includes('quota') ||
                message.includes('RESOURCE_EXHAUSTED');

            if (isRetryable && attempt < retries - 1) {
                const delay = initialDelay * Math.pow(2, attempt);
                console.warn(`API Error (${status}), retrying in ${delay}ms...`);
                await wait(delay);
                attempt++;
            } else {
                throw error;
            }
        }
    }
    throw new Error("Max retries exceeded");
}

interface ExtractionResult {
    text: string;
    tags: string[];
    summary: string;
}

const getPromptForMimeType = (mimeType: string): string => {
    if (mimeType.startsWith('audio/')) return "Listen to this audio clip. Transcribe the spoken content verbatim. Then, provide a brief summary and tags.";
    if (mimeType.startsWith('video/')) return "Watch this video. Describe the visual content and transcribe spoken audio. Provide a summary and tags.";
    if (mimeType.startsWith('image/')) return "Analyze this image. Describe visible text, objects, and context. Provide a summary and tags.";
    return "Analyze this document. Extract all readable text, provide a brief summary, and generate relevant tags.";
};

export const processDocumentWithGemini = async (
    base64Data: string,
    mimeType: string
): Promise<ExtractionResult> => {
    const cleanBase64 = base64Data.split(',')[1] || base64Data;
    const prompt = getPromptForMimeType(mimeType);

    const configStrict: any = {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                text: { type: Type.STRING },
                summary: { type: Type.STRING },
                tags: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["text", "summary", "tags"]
        }
    };

    try {
        const response = await retryWithBackoff(() => ai.models.generateContent({
            model: GENERATION_MODEL,
            contents: {
                parts: [
                    { inlineData: { mimeType: mimeType, data: cleanBase64 } },
                    { text: prompt }
                ]
            },
            config: configStrict
        }));

        const jsonText = response.text;
        if (!jsonText) throw new Error("No response from Gemini");
        return JSON.parse(jsonText) as ExtractionResult;

    } catch (e: any) {
        console.warn("Gemini Strict Schema failed, attempting fallback...", e);
        // Fallback logic could be added here
        return {
            text: "Error processing document.",
            summary: "Processing failed.",
            tags: ["error"]
        };
    }
};

export const generateEmbedding = async (text: string): Promise<number[]> => {
    const safeText = text.slice(0, 9000);
    try {
        const response = await retryWithBackoff(() => ai.models.embedContent({
            model: EMBEDDING_MODEL,
            contents: { parts: [{ text: safeText }] }
        }));
        return response.embeddings?.[0]?.values || new Array(768).fill(0);
    } catch (e) {
        console.error("Embedding Error", e);
        return new Array(768).fill(0);
    }
};

export const generateRAGResponseStream = async function* (
    query: string,
    contextSnippets: { source: string; text: string }[],
    customSystemInstruction?: string
): AsyncGenerator<string> {

    const contextString = contextSnippets
        .map((c) => `[Source: ${c.source}]\n${c.text}\n`)
        .join("\n---\n");

    const systemInstruction = `
    ${customSystemInstruction || 'You are a helpful knowledge assistant. Answer based on the Context below.'}
    Context:
    ${contextString}
  `;

    const responseStream = await retryWithBackoff(() => ai.models.generateContentStream({
        model: GENERATION_MODEL,
        contents: { parts: [{ text: query }] },
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.4
        }
    }));

    for await (const chunk of responseStream) {
        if (chunk.text) yield chunk.text;
    }
};

export const generateMultimodalStream = async function* (
    prompt: string,
    attachments: Attachment[]
): AsyncGenerator<string> {
    const parts: any[] = [];
    attachments.forEach(att => {
        parts.push({ inlineData: { mimeType: att.mimeType, data: att.base64 } });
    });
    parts.push({ text: prompt });

    const responseStream = await retryWithBackoff(() => ai.models.generateContentStream({
        model: GENERATION_MODEL,
        contents: { parts },
        config: { temperature: 0.7 }
    }));

    for await (const chunk of responseStream) {
        if (chunk.text) yield chunk.text;
    }
};

export const generateImage = async (
    prompt: string,
    referenceImage?: { base64: string, mimeType: string }
): Promise<string> => {
    // Note: Actual image generation might require a different model or endpoint
    // For now, we'll use a placeholder or text description if the model doesn't support it
    // But since we are using gemini-1.5-flash, it doesn't generate images natively yet (it's multimodal input, text output)
    // We might need Imagen model for this.
    // For this implementation, we will mock it or return a text description if image gen is not available.

    // If the user has access to Imagen via Vertex AI, we would use that.
    // For now, let's throw or return a placeholder.
    throw new Error("Image generation not supported with current model configuration.");
};

export const generateSuggestions = async (
    query: string,
    responseContext: string
): Promise<{ label: string; query: string }[]> => {
    const schema: Schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                label: { type: Type.STRING },
                query: { type: Type.STRING }
            },
            required: ["label", "query"]
        }
    };

    try {
        const res = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: {
                parts: [{ text: `User Query: "${query}"\nSystem Response: "${responseContext.slice(0, 500)}..."\n\nGenerate 3 short follow-up questions.` }]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.5
            }
        });
        return JSON.parse(res.text || "[]");
    } catch (e) {
        return [];
    }
};
