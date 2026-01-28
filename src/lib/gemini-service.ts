import { GoogleGenAI, Type, Schema, GenerateContentResponse } from "@google/genai";
import { Attachment } from './partnerhub-types';

// Initialize Gemini Client
// In Next.js, use process.env.GEMINI_API_KEY or process.env.GOOGLE_GENAI_API_KEY
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

// Use standard models if preview ones are not available
// Note: gemini-3-pro-preview may show "thoughtSignature" warnings - these are cosmetic
// The SDK automatically handles the non-text parts

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

/**
 * Transcribe audio from a URL using Gemini
 * Downloads the audio and sends it to Gemini for transcription
 */
export const transcribeAudioFromUrl = async (
    audioUrl: string,
    mimeType?: string
): Promise<{ transcription: string; summary: string }> => {
    try {
        console.log('🎙️ Starting audio transcription from URL...');

        // Fetch the audio file
        const response = await fetch(audioUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch audio: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');
        const detectedMimeType = mimeType || response.headers.get('content-type') || 'audio/ogg';

        console.log(`📦 Audio fetched: ${(arrayBuffer.byteLength / 1024).toFixed(1)}KB, type: ${detectedMimeType}`);

        // Use Gemini to transcribe
        const transcriptionResponse = await retryWithBackoff(() => ai.models.generateContent({
            model: GENERATION_MODEL,
            contents: {
                parts: [
                    { inlineData: { mimeType: detectedMimeType, data: base64Data } },
                    { text: `Listen to this audio message carefully.

Transcribe the spoken content verbatim - exactly what is being said.
Then provide a brief one-sentence summary of what the speaker is communicating.

Respond in JSON format:
{
    "transcription": "The exact words spoken in the audio",
    "summary": "A brief summary of what the speaker is saying/asking"
}

If the audio is unclear or you cannot understand it, indicate that in the transcription.` }
                ]
            },
            config: {
                temperature: 0.1,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        transcription: { type: Type.STRING },
                        summary: { type: Type.STRING }
                    },
                    required: ["transcription", "summary"]
                }
            }
        }));

        const jsonText = transcriptionResponse.text;
        if (!jsonText) {
            throw new Error("No transcription response from Gemini");
        }

        const result = JSON.parse(jsonText);
        console.log('✅ Audio transcription complete');

        return {
            transcription: result.transcription || '',
            summary: result.summary || ''
        };
    } catch (error: any) {
        console.error('❌ Audio transcription error:', error);
        return {
            transcription: '',
            summary: 'Unable to transcribe audio'
        };
    }
};

/**
 * Transcribe audio from base64 data
 */
export const transcribeAudioFromBase64 = async (
    base64Data: string,
    mimeType: string
): Promise<{ transcription: string; summary: string }> => {
    try {
        console.log('🎙️ Starting audio transcription from base64...');

        const cleanBase64 = base64Data.split(',')[1] || base64Data;

        const transcriptionResponse = await retryWithBackoff(() => ai.models.generateContent({
            model: GENERATION_MODEL,
            contents: {
                parts: [
                    { inlineData: { mimeType, data: cleanBase64 } },
                    { text: `Listen to this audio message carefully.

Transcribe the spoken content verbatim - exactly what is being said.
Then provide a brief one-sentence summary of what the speaker is communicating.

Respond in JSON format:
{
    "transcription": "The exact words spoken in the audio",
    "summary": "A brief summary of what the speaker is saying/asking"
}

If the audio is unclear or you cannot understand it, indicate that in the transcription.` }
                ]
            },
            config: {
                temperature: 0.1,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        transcription: { type: Type.STRING },
                        summary: { type: Type.STRING }
                    },
                    required: ["transcription", "summary"]
                }
            }
        }));

        const jsonText = transcriptionResponse.text;
        if (!jsonText) {
            throw new Error("No transcription response from Gemini");
        }

        const result = JSON.parse(jsonText);
        console.log('✅ Audio transcription complete');

        return {
            transcription: result.transcription || '',
            summary: result.summary || ''
        };
    } catch (error: any) {
        console.error('❌ Audio transcription error:', error);
        return {
            transcription: '',
            summary: 'Unable to transcribe audio'
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
        .map((c, index) => `--- SOURCE ${index + 1}: ${c.source} ---\n${c.text}\n`)
        .join("\n");

    const defaultInstruction = `You are a precise, knowledgeable AI assistant with expertise in analyzing documents and providing accurate information.

CORE PRINCIPLES:
1. **Accuracy First**: Only provide information that is explicitly stated or can be directly inferred from the provided context.
2. **Source-Based**: Base every detail of your answer on the context provided below.
3. **Honesty**: If information is not in the context, clearly state: "I don't have that information in the provided documents."
4. **Clarity**: Provide clear, well-structured answers that directly address the question.
5. **No Hallucination**: Never make up information, statistics, dates, or facts not present in the context.

FORMATTING GUIDELINES:
- Use clear paragraphs for readability
- Use bullet points (•) or numbered lists when listing items or steps
- Keep sentences concise and to the point
- Bold important terms or concepts using **bold text**
- Use line breaks to separate distinct ideas

CITATION RULES:
- DO NOT include citations like "[Source: filename]" in your response text
- The system automatically displays sources separately
- Just provide the answer naturally

QUALITY STANDARDS:
- If the question can be fully answered: Provide a complete, accurate answer
- If partial information exists: Answer what you can and clearly state what's missing
- if no relevant information exists: Politely state you cannot answer based on available documents
- If the question is ambiguous: Ask for clarification`;

    const systemInstruction = `${customSystemInstruction || defaultInstruction}

CONTEXT DOCUMENTS:
${contextString}
`;

    const responseStream = await retryWithBackoff(() => ai.models.generateContentStream({
        model: GENERATION_MODEL,
        contents: query,
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.3, // Lower temperature for more focused, accurate responses
            topP: 0.95,
            topK: 40,
        }
    }));

    for await (const chunk of responseStream) {
        if (chunk.text) {
            yield chunk.text;
        }
    }
};

export const generateMultimodalStream = async function* (
    prompt: string,
    attachments: Attachment[]
): AsyncGenerator<string> {
    const parts: any[] = [];
    attachments.forEach(att => {
        // Use 'url' property since our Attachment type doesn't have 'base64'
        // If we need inline data in the future, we'd need to fetch and convert the URL
        if (att.url) {
            parts.push({ text: `[Attached file: ${att.name}]` });
        }
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

/**
 * Generate Image from Text or Edit Image
 * Uses gemini-2.5-flash-image for both.
 * Returns a full Data URI.
 */
export const generateImage = async (
    prompt: string,
    referenceImage?: { base64: string, mimeType: string }
): Promise<string> => {
    const parts: any[] = [];

    // If editing an image, pass it first
    if (referenceImage) {
        parts.push({
            inlineData: {
                data: referenceImage.base64,
                mimeType: referenceImage.mimeType
            }
        });
    }

    // Add the text prompt with stronger instruction
    parts.push({
        text: `Create an image based on this description: "${prompt}". Ignore any references to missing documents or unavailable context. Visualize the request creatively.`
    });

    try {
        const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
            model: IMAGE_GEN_MODEL,
            contents: { parts },
            config: {}
        }));

        // Check for inline data (Image)
        if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    // Construct full Data URI
                    const mime = part.inlineData.mimeType || 'image/png';
                    return `data:${mime};base64,${part.inlineData.data}`;
                }
            }

            // If we are here, no image data found. Check if model returned text (e.g., refusal)
            const textPart = response.candidates[0].content.parts.find(p => p.text);
            if (textPart && textPart.text) {
                throw new Error(`Model Refusal: ${textPart.text}`);
            }
        }

        // Check for finish reason (e.g. SAFETY)
        if (response.candidates?.[0]?.finishReason && response.candidates[0].finishReason !== 'STOP') {
            throw new Error(`Generation stopped due to: ${response.candidates[0].finishReason}`);
        }

        throw new Error("API returned success but no image data found.");
    } catch (e) {
        console.error("Image Generation Failed:", e);
        throw e;
    }
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

export interface MappedBusinessData {
    identity?: any;
    personality?: any;
    contact?: any;
    location?: any;
    other_useful_data: { key: string; value: string; source?: string }[];
}

export const analyzeAndMapBusinessData = async (
    rawData: any
): Promise<MappedBusinessData> => {
    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            identity: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    website: { type: Type.STRING },
                    phone: { type: Type.STRING },
                    email: { type: Type.STRING },
                }
            },
            personality: {
                type: Type.OBJECT,
                properties: {
                    tagline: { type: Type.STRING },
                    uniqueSellingPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                }
            },
            other_useful_data: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        key: { type: Type.STRING },
                        value: { type: Type.STRING },
                        source: { type: Type.STRING }
                    },
                    required: ["key", "value"]
                }
            }
        },
        required: ["other_useful_data"]
    };

    try {
        const prompt = `
        Analyze this raw business data and map it to the structured schema.
        
        CRITICAL INSTRUCTIONS:
        1. Extract clear identity fields (name, description, phone, etc.).
        2. Identify personality traits (tagline, USPs).
        3. EVERYTHING ELSE that is useful but doesn't fit strictly above (e.g., specific awards, return policies, founder names, specific amenities, obscure certifications) MUST be added to 'other_useful_data'.
        4. "other_useful_data" keys should be human-readable labels (e.g., "Award 2023", "Return Policy").
        
        Raw Data:
        ${JSON.stringify(rawData).slice(0, 15000)}
        `;

        const res = await ai.models.generateContent({
            model: GENERATION_MODEL,
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.2
            }
        });

        return JSON.parse(res.text || "{}");
    } catch (e) {
        console.error("AI Mapping Error", e);
        return { other_useful_data: [] };
    }
};
