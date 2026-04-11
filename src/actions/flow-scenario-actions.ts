'use server';

import { GoogleGenAI } from '@google/genai';
import { db as adminDb } from '@/lib/firebase-admin';
import type { FlowScenario, ScenariosResult, GenerateScenariosResult } from '@/lib/types-flow-scenarios';
import { buildScenariosPrompt } from './flow-scenario-prompt';

const COLLECTION = 'flowScenarios';
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const MODEL = 'gemini-2.5-flash';

/** Block info passed from client for richer prompt generation. */
export interface BlockInfo {
  label: string;
  desc: string;
  intents: string[];
  isShared: boolean;
}

/** Context computed client-side from the block registry (avoids server-side registry import). */
export interface GenerateContext {
  subVerticalName: string;
  verticalName: string;
  industryId: string;
  stageBlocks: { stage: string; blocks: BlockInfo[] }[];
  /** Sibling sub-verticals in the same vertical (for differentiation). */
  siblings: string[];
  /** Block labels unique to this sub-vertical (no sibling has them). */
  uniqueBlocks: string[];
  /** Block labels siblings have but this sub-vertical lacks. */
  missingBlocks: string[];
}

// ---------------------------------------------------------------------------
// 1. Get all scenarios for a sub-vertical
// ---------------------------------------------------------------------------
export async function getScenariosAction(functionId: string): Promise<ScenariosResult> {
  try {
    const snap = await adminDb
      .collection(COLLECTION).doc(functionId).collection('scenarios')
      .orderBy('priority', 'asc').get();
    const scenarios = snap.docs.map(d => ({ ...d.data(), id: d.id }) as FlowScenario);
    return { success: true, scenarios };
  } catch (e: any) {
    console.error('[scenarios] fetch error:', e?.message);
    return { success: false, scenarios: [], error: e.message };
  }
}

// ---------------------------------------------------------------------------
// 2. Get a single scenario by ID (for RAG retrieval)
// ---------------------------------------------------------------------------
export async function getScenarioByIdAction(
  functionId: string, scenarioId: string,
): Promise<{ success: boolean; scenario: FlowScenario | null; error?: string }> {
  try {
    const doc = await adminDb
      .collection(COLLECTION).doc(functionId).collection('scenarios').doc(scenarioId).get();
    if (!doc.exists) return { success: true, scenario: null };
    return { success: true, scenario: { ...doc.data(), id: doc.id } as FlowScenario };
  } catch (e: any) {
    return { success: false, scenario: null, error: e.message };
  }
}

// ---------------------------------------------------------------------------
// 3. Generate 10 scenarios via Gemini (context passed from client)
// ---------------------------------------------------------------------------
export async function generateScenariosAction(
  functionId: string, ctx: GenerateContext,
): Promise<GenerateScenariosResult> {
  try {
    const availableStages = ctx.stageBlocks.map(s => s.stage);
    const prompt = buildScenariosPrompt(ctx);

    const res = await genAI.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        systemInstruction: 'You are a market research AI. Output ONLY valid JSON. No markdown, no explanation, no code fences. Raw JSON only.',
        temperature: 0.4,
        maxOutputTokens: 8192,
      },
    });

    const raw = res.text?.trim() || '';
    if (!raw) return { success: false, count: 0, error: 'Empty response from Gemini' };

    // Robust JSON extraction
    let jsonText = raw;
    const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenceMatch) {
      jsonText = fenceMatch[1];
    } else {
      const firstBrace = raw.indexOf('{');
      const lastBrace = raw.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) jsonText = raw.substring(firstBrace, lastBrace + 1);
    }

    let parsed: any;
    try { parsed = JSON.parse(jsonText); } catch (parseErr: any) {
      return { success: false, count: 0, error: `JSON parse error: ${parseErr.message}` };
    }

    if (!parsed.scenarios?.length) return { success: false, count: 0, error: 'No scenarios in AI response' };

    const now = new Date().toISOString();
    const batch = adminDb.batch();
    const parentRef = adminDb.collection(COLLECTION).doc(functionId);

    batch.set(parentRef, {
      functionId, functionName: ctx.subVerticalName,
      industryId: ctx.industryId, updatedAt: now,
    }, { merge: true });

    const existingSnap = await parentRef.collection('scenarios').get();
    for (const doc of existingSnap.docs) batch.delete(doc.ref);

    let count = 0;
    for (const s of parsed.scenarios) {
      const slug = (s.name || `scenario_${count}`).toLowerCase().replace(/[^a-z0-9]+/g, '_').substring(0, 40);
      const id = `${functionId}__${slug}`;
      const scenario: FlowScenario = {
        id, functionId, name: s.name || `Scenario ${count + 1}`, description: s.description || '',
        customerProfile: s.customerProfile || '', tags: Array.isArray(s.tags) ? s.tags : [],
        activeStages: Array.isArray(s.activeStages) ? s.activeStages : availableStages,
        stageMessages: s.stageMessages || {}, priority: s.priority || count + 1,
        generatedAt: now, modelUsed: MODEL,
      };
      batch.set(parentRef.collection('scenarios').doc(id), scenario);
      count++;
    }

    await batch.commit();
    return { success: true, count };
  } catch (e: any) {
    console.error('[scenarios] generation failed:', e?.message);
    return { success: false, count: 0, error: e?.message || 'Unknown generation error' };
  }
}
