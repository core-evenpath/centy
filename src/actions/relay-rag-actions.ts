'use server';

import { GoogleGenAI } from '@google/genai';
import { db as adminDb } from '@/lib/firebase-admin';
import { getCoreHubContextString } from './core-hub-actions';
import {
  buildRelayPrompt,
  buildFollowUpPrompt,
} from '@/lib/relay/rag-context-builder';
import type { ConversationMessage } from '@/lib/relay/rag-context-builder';
import type { BlockResolution } from '@/lib/relay/block-resolver';

const RELAY_MODEL = process.env.RELAY_AI_MODEL || 'gemini-2.5-flash';

function getGenAI(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
}

export interface RelayRAGResponse {
  success: boolean;
  reply: string;
  followUps: string[];
  confidence: number;
  tokensUsed: number;
  latencyMs: number;
  error?: string;
}

export async function generateRelayResponseAction(
  partnerId: string,
  customerMessage: string,
  blockResolution: BlockResolution | null,
  conversationHistory: ConversationMessage[],
  intentType: string
): Promise<RelayRAGResponse> {
  const startTime = Date.now();

  const ai = getGenAI();
  if (!ai) {
    const fallbackFollowUps = buildFollowUpPrompt(blockResolution, intentType);
    return {
      success: false,
      reply: '',
      followUps: fallbackFollowUps,
      confidence: 0,
      tokensUsed: 0,
      latencyMs: Date.now() - startTime,
      error: 'AI service not configured — missing API key',
    };
  }

  try {
    let businessContext = '';
    try {
      businessContext = await getCoreHubContextString(partnerId);
    } catch (ctxError) {
      console.warn('[RelayRAG] CoreHub context unavailable:', ctxError);
    }

    let brandName = '';
    let brandTagline = '';
    let industryId: string | undefined;

    try {
      const partnerDoc = await adminDb
        .collection('partners')
        .doc(partnerId)
        .get();

      if (partnerDoc.exists) {
        const data = partnerDoc.data() || {};
        const persona = data.businessPersona || {};
        const identity = persona.identity || {};
        const personality = persona.personality || {};
        brandName = identity.name || data.businessName || data.name || '';
        brandTagline = personality.tagline || '';
        const cats = identity.businessCategories || [];
        industryId = cats[0]?.industryId;
      }
    } catch (partnerError) {
      console.warn('[RelayRAG] Partner profile fetch failed:', partnerError);
    }

    if (!brandName) {
      brandName = 'this business';
    }

    const { systemPrompt, userPrompt, estimatedTokens } = buildRelayPrompt({
      brandName,
      brandTagline,
      industryId,
      businessContext,
      customerMessage,
      conversationHistory,
      blockResolution,
      maxHistoryMessages: 6,
    });

    const result = await ai.models.generateContent({
      model: RELAY_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt + '\n\nRespond ONLY with valid JSON:\n{"reply": "your reply here", "followUps": ["question 1", "question 2", "question 3"]}',
        temperature: 0.7,
        maxOutputTokens: 250,
        responseMimeType: 'application/json',
      },
    });

    const responseText = (result.text || '').trim();
    const latencyMs = Date.now() - startTime;

    let parsed: { reply: string; followUps: string[] };
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = { reply: responseText, followUps: [] };
      }
    } catch {
      parsed = { reply: responseText, followUps: [] };
    }

    if (!parsed.reply || typeof parsed.reply !== 'string') {
      parsed.reply = responseText || '';
    }

    if (!Array.isArray(parsed.followUps) || parsed.followUps.length === 0) {
      parsed.followUps = buildFollowUpPrompt(blockResolution, intentType);
    }

    parsed.followUps = parsed.followUps
      .filter((f: any) => typeof f === 'string' && f.trim().length > 0)
      .slice(0, 4);

    return {
      success: true,
      reply: parsed.reply,
      followUps: parsed.followUps,
      confidence: blockResolution?.blockId ? 0.85 : 0.7,
      tokensUsed: estimatedTokens,
      latencyMs,
    };
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    console.error('[RelayRAG] Generation failed:', error);

    const fallbackFollowUps = buildFollowUpPrompt(blockResolution, intentType);

    return {
      success: false,
      reply: '',
      followUps: fallbackFollowUps,
      confidence: 0,
      tokensUsed: 0,
      latencyMs,
      error: error.message || 'AI generation failed',
    };
  }
}

export async function generateRelayResponseWithDocsAction(
  partnerId: string,
  customerMessage: string,
  conversationHistory: ConversationMessage[]
): Promise<RelayRAGResponse> {
  const startTime = Date.now();

  const ai = getGenAI();
  if (!ai) {
    return {
      success: false,
      reply: '',
      followUps: buildFollowUpPrompt(null, 'general'),
      confidence: 0,
      tokensUsed: 0,
      latencyMs: Date.now() - startTime,
      error: 'AI service not configured',
    };
  }

  try {
    let ragStoreName: string | null = null;

    try {
      const storesSnap = await adminDb
        .collection(`partners/${partnerId}/fileSearchStores`)
        .where('state', '==', 'ACTIVE')
        .limit(1)
        .get();

      if (!storesSnap.empty) {
        ragStoreName = storesSnap.docs[0].data().name || null;
      }
    } catch {
      console.warn('[RelayRAG] Could not fetch RAG store');
    }

    if (!ragStoreName) {
      return generateRelayResponseAction(
        partnerId,
        customerMessage,
        null,
        conversationHistory,
        'general'
      );
    }

    let brandName = 'this business';
    try {
      const partnerDoc = await adminDb
        .collection('partners')
        .doc(partnerId)
        .get();
      if (partnerDoc.exists) {
        const data = partnerDoc.data() || {};
        const persona = data.businessPersona || {};
        brandName = persona.identity?.name || data.businessName || data.name || 'this business';
      }
    } catch {
      // Partner lookup failed — use default brand name
    }

    const historyText = conversationHistory
      .slice(-4)
      .map((m) => `${m.role === 'customer' ? 'Customer' : 'You'}: ${m.text}`)
      .join('\n');

    const prompt = `A customer is asking a question. Use the business documents to answer accurately.

${historyText ? `RECENT CONVERSATION:\n${historyText}\n\n` : ''}CUSTOMER: "${customerMessage}"

Answer in 1-3 sentences. Be helpful and accurate. If the answer is not in the documents, say so honestly.`;

    const fileSearchConfig: any = {
      fileSearchStoreNames: [ragStoreName],
    };

    const result = await ai.models.generateContent({
      model: RELAY_MODEL,
      contents: prompt,
      config: {
        systemInstruction: `You are the AI assistant for ${brandName}. Output ONLY valid JSON:\n{"reply": "your answer", "followUps": ["question 1", "question 2"]}`,
        tools: [{ fileSearch: fileSearchConfig }],
        temperature: 0.5,
        maxOutputTokens: 300,
        responseMimeType: 'application/json',
      },
    });

    const responseText = (result.text || '').trim();
    const latencyMs = Date.now() - startTime;

    let parsed: { reply: string; followUps: string[] };
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { reply: responseText, followUps: [] };
    } catch {
      parsed = { reply: responseText, followUps: [] };
    }

    if (!Array.isArray(parsed.followUps) || parsed.followUps.length === 0) {
      parsed.followUps = buildFollowUpPrompt(null, 'general');
    }

    return {
      success: true,
      reply: parsed.reply || '',
      followUps: parsed.followUps.filter((f: any) => typeof f === 'string').slice(0, 4),
      confidence: 0.8,
      tokensUsed: Math.ceil(prompt.length / 4),
      latencyMs,
    };
  } catch (error: any) {
    console.error('[RelayRAG] Doc-based generation failed:', error);
    return {
      success: false,
      reply: '',
      followUps: buildFollowUpPrompt(null, 'general'),
      confidence: 0,
      tokensUsed: 0,
      latencyMs: Date.now() - startTime,
      error: error.message || 'Document-based AI generation failed',
    };
  }
}
