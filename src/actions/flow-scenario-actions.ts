'use server';

import { GoogleGenAI } from '@google/genai';
import { db as adminDb } from '@/lib/firebase-admin';
import type { FlowScenario, ScenariosResult, GenerateScenariosResult } from '@/lib/types-flow-scenarios';
import { buildScenariosPrompt } from './flow-scenario-prompt';

const COLLECTION = 'flowScenarios';
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const MODEL = 'gemini-3.1-pro-preview';

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
    console.error('Failed to get scenarios:', e);
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
// 3. Generate 10 scenarios for a sub-vertical via Gemini
// ---------------------------------------------------------------------------
export async function generateScenariosAction(functionId: string): Promise<GenerateScenariosResult> {
  try {
    const { getSubVertical, getBlocksForFunction } = await import(
      '@/app/admin/relay/blocks/previews/registry'
    );
    const result = getSubVertical(functionId);
    if (!result) return { success: false, count: 0, error: 'Sub-vertical not found' };

    const { vertical, subVertical } = result;
    const blocks = getBlocksForFunction(functionId);

    // Group block labels by stage
    const stageMap: Record<string, string[]> = {};
    for (const b of blocks) {
      if (!stageMap[b.stage]) stageMap[b.stage] = [];
      stageMap[b.stage].push(b.label);
    }
    const stageBlocks = Object.entries(stageMap).map(([stage, blockLabels]) => ({ stage, blockLabels }));
    const availableStages = Object.keys(stageMap);

    const prompt = buildScenariosPrompt(subVertical.name, vertical.name, stageBlocks, availableStages);

    const res = await genAI.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.8,
        maxOutputTokens: 8192,
      },
    });

    const text = res.text?.trim() || '{}';
    const parsed = JSON.parse(text);
    if (!parsed.scenarios?.length) {
      return { success: false, count: 0, error: 'Invalid AI response: no scenarios array' };
    }

    const now = new Date().toISOString();
    const batch = adminDb.batch();
    const parentRef = adminDb.collection(COLLECTION).doc(functionId);

    // Ensure parent doc exists (for querying)
    batch.set(parentRef, {
      functionId, functionName: subVertical.name,
      industryId: vertical.industryId, updatedAt: now,
    }, { merge: true });

    // Delete existing scenarios first
    const existingSnap = await parentRef.collection('scenarios').get();
    for (const doc of existingSnap.docs) batch.delete(doc.ref);

    // Write new scenarios
    let count = 0;
    for (const raw of parsed.scenarios) {
      const slug = (raw.name || `scenario_${count}`)
        .toLowerCase().replace(/[^a-z0-9]+/g, '_').substring(0, 40);
      const id = `${functionId}__${slug}`;

      const scenario: FlowScenario = {
        id,
        functionId,
        name: raw.name || `Scenario ${count + 1}`,
        description: raw.description || '',
        customerProfile: raw.customerProfile || '',
        tags: Array.isArray(raw.tags) ? raw.tags : [],
        activeStages: Array.isArray(raw.activeStages) ? raw.activeStages : availableStages,
        stageMessages: raw.stageMessages || {},
        priority: raw.priority || count + 1,
        generatedAt: now,
        modelUsed: MODEL,
      };

      batch.set(parentRef.collection('scenarios').doc(id), scenario);
      count++;
    }

    await batch.commit();
    return { success: true, count };
  } catch (e: any) {
    console.error('Failed to generate scenarios:', e);
    return { success: false, count: 0, error: e.message };
  }
}
