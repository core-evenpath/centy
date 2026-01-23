

import { GoogleGenerativeAI } from "@google/generative-ai";
import {
    ContactPersona,
    DEFAULT_CONTACT_PERSONA,
    CommunicationTone,
    CommunicationLength,
    SentimentLabel,
    CustomerStage,
    BuyingIntent
} from './types-contact';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const PERSONA_MODEL = "gemini-2.5-flash";

export interface ConversationMessage {
    role: 'customer' | 'business';
    content: string;
    timestamp: Date;
}

export interface PersonaGenerationInput {
    contactName: string;
    contactEmail?: string;
    contactPhone?: string;
    contactCompany?: string;
    messages: ConversationMessage[];
    existingPersona?: ContactPersona | null;
}

export async function generatePersonaFromConversation(
    input: PersonaGenerationInput
): Promise<{ success: boolean; persona?: ContactPersona; error?: string }> {
    const { contactName, messages, existingPersona } = input;

    if (messages.length < 5) {
        return {
            success: false,
            error: 'Not enough messages to generate persona (minimum 5 required)',
        };
    }

    try {
        const conversationText = messages
            .slice(-50)
            .map(m => `[${m.role.toUpperCase()}]: ${m.content}`)
            .join('\n');

        const existingContext = existingPersona?.summary
            ? `\nPrevious summary: ${existingPersona.summary}`
            : '';

        const prompt = `Analyze this conversation history for customer "${contactName}" and generate a detailed customer persona.
${existingContext}

CONVERSATION HISTORY:
${conversationText}

Based on this conversation, generate a JSON object with the following structure. Be accurate and only include information that can be inferred from the conversation:

{
  "summary": "2-3 sentence executive summary of the customer relationship and communication patterns",
  "communicationStyle": {
      "tone": "formal" | "casual" | "neutral" | "empathetic" | "direct" | "unknown",
      "lengthPreference": "brief" | "detailed" | "moderate" | "unknown",
      "keywords": ["array of 3-5 characteristic words they use"]
  },
  "sentiment": {
      "label": "positive" | "neutral" | "negative" | "mixed" | "unknown",
      "score": number between -1.0 (very negative) and 1.0 (very positive),
      "trend": "improving" | "declining" | "stable"
  },
  "customerStage": "prospect" | "new" | "active" | "vip" | "at-risk" | "churned" | "unknown",
  "buyingIntent": "high" | "medium" | "low" | "unknown",
  "interests": ["array of their interests/preferences, max 5"],
  "painPoints": ["array of issues/concerns they've expressed, max 5"],
  "keyFacts": ["array of 3-5 confirmed facts (e.g. 'Has 2 dogs', 'Budget $10k', 'CEO of Acme')"],
  "preferredLanguage": "ISO language code (e.g., en, es, hi)"
}

IMPORTANT:
- Only include information directly inferable from the conversation
- Do not make assumptions beyond what's stated
- If uncertain about a field, use "unknown" or empty array
- Keep summaries concise and actionable
- Focus on information useful for customer service personalization

Respond ONLY with the JSON object, no markdown or explanation.`;

        const model = genAI.getGenerativeModel({ model: PERSONA_MODEL });
        const result = await model.generateContent(prompt);
        const response = result.response.text();

        const cleanedResponse = response
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        const parsedPersona = JSON.parse(cleanedResponse);

        // Validation helpers
        const validateTone = (val: any): CommunicationTone =>
            ['formal', 'casual', 'neutral', 'empathetic', 'direct'].includes(val) ? val : 'neutral';

        const validateLength = (val: any): CommunicationLength =>
            ['brief', 'detailed', 'moderate'].includes(val) ? val : 'moderate';

        const validateSentimentLabel = (val: any): SentimentLabel =>
            ['positive', 'neutral', 'negative', 'mixed'].includes(val) ? val : 'neutral';

        const validateTrend = (val: any): 'improving' | 'declining' | 'stable' =>
            ['improving', 'declining', 'stable'].includes(val) ? val : 'stable';

        const validateStage = (val: any): CustomerStage =>
            ['prospect', 'new', 'active', 'vip', 'at-risk', 'churned'].includes(val) ? val : 'unknown';

        const validateIntent = (val: any): BuyingIntent =>
            ['high', 'medium', 'low'].includes(val) ? val : 'unknown';

        const validatedPersona: ContactPersona = {
            summary: parsedPersona.summary || "No summary generated.",
            communicationStyle: {
                tone: validateTone(parsedPersona.communicationStyle?.tone),
                lengthPreference: validateLength(parsedPersona.communicationStyle?.lengthPreference),
                keywords: Array.isArray(parsedPersona.communicationStyle?.keywords)
                    ? parsedPersona.communicationStyle.keywords.slice(0, 5)
                    : []
            },
            sentiment: {
                label: validateSentimentLabel(parsedPersona.sentiment?.label),
                score: typeof parsedPersona.sentiment?.score === 'number' ? parsedPersona.sentiment.score : 0,
                trend: validateTrend(parsedPersona.sentiment?.trend)
            },
            customerStage: validateStage(parsedPersona.customerStage),
            buyingIntent: validateIntent(parsedPersona.buyingIntent),

            interests: Array.isArray(parsedPersona.interests) ? parsedPersona.interests.slice(0, 5) : [],
            painPoints: Array.isArray(parsedPersona.painPoints) ? parsedPersona.painPoints.slice(0, 5) : [],
            keyFacts: Array.isArray(parsedPersona.keyFacts) ? parsedPersona.keyFacts.slice(0, 5) : [],

            preferredLanguage: parsedPersona.preferredLanguage || 'en',
            generatedAt: new Date(),
            generatedFromMessageCount: messages.length,
            manualOverrides: existingPersona?.manualOverrides || {},
        };

        return { success: true, persona: validatedPersona };
    } catch (error: any) {
        console.error('Persona generation error:', error);
        return { success: false, error: error.message };
    }
}

export function buildPersonaContextForPrompt(persona: ContactPersona | null | undefined): string {
    if (!persona) return '';

    const p = persona as any; // Allow access to old fields for backward compatibility
    const parts: string[] = [];

    const summary = p.summary || p.relationshipSummary;
    if (summary) {
        parts.push(`Customer Profile: ${summary}`);
    }

    if (p.communicationStyle) {
        if (typeof p.communicationStyle === 'string') {
            // Old string style
            parts.push(`Communication preference: ${p.communicationStyle}`);
        } else {
            // New object style
            parts.push(`Communication preference: Tone is ${p.communicationStyle.tone}, Length is ${p.communicationStyle.lengthPreference}.`);
        }
    }

    if (p.sentiment) {
        if (typeof p.sentiment === 'string') {
            parts.push(`Overall sentiment: ${p.sentiment}`);
        } else {
            parts.push(`Overall sentiment: ${p.sentiment.label} (Score: ${p.sentiment.score}).`);
        }
    }

    const interests = p.interests || [];
    if (interests.length > 0) {
        parts.push(`Interests: ${interests.join(', ')}`);
    }

    const painPoints = p.painPoints || [];
    if (painPoints.length > 0) {
        parts.push(`Pain Points: ${painPoints.join(', ')}`);
    }

    const keyFacts = p.keyFacts || p.conversationHighlights || [];
    if (keyFacts.length > 0) {
        parts.push(`Key Facts: ${keyFacts.join('; ')}`);
    }

    if (parts.length === 0) return '';

    return `\n\nCUSTOMER PERSONA:\n${parts.join('\n')}`;
}
