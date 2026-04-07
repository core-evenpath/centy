'use server';

import { db as adminDb } from '@/lib/firebase-admin';
import type { ScenarioScript } from '@/lib/types-flow-engine';

const COLLECTION = 'flowScenarios';

// ---------------------------------------------------------------------------
// 1. Get cached scenario from Firestore
// ---------------------------------------------------------------------------
export async function getScenarioAction(
  functionId: string
): Promise<{ success: boolean; scenario: ScenarioScript | null; error?: string }> {
  try {
    const doc = await adminDb.collection(COLLECTION).doc(functionId).get();
    if (!doc.exists) return { success: true, scenario: null };
    return { success: true, scenario: doc.data() as ScenarioScript };
  } catch (e: any) {
    console.error('Failed to get scenario:', e);
    return { success: false, scenario: null, error: e.message };
  }
}

// ---------------------------------------------------------------------------
// 2. Generate scenario using Gemini, save to Firestore
// ---------------------------------------------------------------------------
export async function generateScenarioAction(
  functionId: string
): Promise<{ success: boolean; scenario: ScenarioScript | null; error?: string }> {
  try {
    const { getSubVertical, getBlocksForFunction } = await import(
      '@/app/admin/relay/blocks/previews/registry'
    );
    const result = getSubVertical(functionId);
    if (!result) return { success: false, scenario: null, error: 'Sub-vertical not found' };

    const { vertical, subVertical } = result;
    const blocks = getBlocksForFunction(functionId);

    // Group block labels by stage
    const stageBlocks: Record<string, string[]> = {};
    for (const b of blocks) {
      if (!stageBlocks[b.stage]) stageBlocks[b.stage] = [];
      stageBlocks[b.stage].push(b.label);
    }

    const stageList = Object.entries(stageBlocks)
      .map(([stage, labels]) => `- ${stage}: ${labels.join(', ')}`)
      .join('\n');

    const prompt = `You are generating a realistic customer conversation script for a "${subVertical.name}" business in the "${vertical.name}" industry.

Available conversation stages and their blocks:
${stageList}

For each stage that has blocks, generate:
1. userMessage: A natural customer message (1-2 sentences) that a real person would type
2. botMessage: A friendly, professional AI assistant response (1-2 sentences) introducing the blocks
3. chipLabels: 2-3 short suggestion button labels (2-4 words each)

IMPORTANT: Make messages specific to ${subVertical.name}, not generic. Use industry terminology.
Skip the "greeting" stage for userMessage (the bot speaks first).

Return ONLY valid JSON matching this exact structure:
{
  "stages": {
    "stage_name": { "userMessage": "...", "botMessage": "...", "chipLabels": ["...", "..."] }
  }
}`;

    const { GoogleGenAI } = await import('@google/genai');
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) return { success: false, scenario: null, error: 'GEMINI_API_KEY not configured' };

    const ai = new GoogleGenAI({ apiKey });
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: 'application/json', temperature: 0.7 },
    });

    const parsed = JSON.parse(res.text || '{}');
    if (!parsed.stages) return { success: false, scenario: null, error: 'Invalid AI response' };

    const scenario: ScenarioScript = {
      functionId,
      functionName: subVertical.name,
      stages: parsed.stages,
      generatedAt: new Date().toISOString(),
      modelUsed: 'gemini-2.5-flash',
    };

    await adminDb.collection(COLLECTION).doc(functionId).set(scenario);
    return { success: true, scenario };
  } catch (e: any) {
    console.error('Failed to generate scenario:', e);
    return { success: false, scenario: null, error: e.message };
  }
}

// ---------------------------------------------------------------------------
// 3. Seed scenarios for all sub-verticals
// ---------------------------------------------------------------------------
export async function seedAllScenariosAction(): Promise<{
  success: boolean; generated: number; skipped: number; error?: string;
}> {
  try {
    const { ALL_SUB_VERTICALS } = await import('@/app/admin/relay/blocks/previews/registry');
    const snap = await adminDb.collection(COLLECTION).get();
    const existing = new Set(snap.docs.map(d => d.id));

    let generated = 0;
    let skipped = 0;

    for (const sv of ALL_SUB_VERTICALS) {
      if (existing.has(sv.id)) { skipped++; continue; }
      const result = await generateScenarioAction(sv.id);
      if (result.success) generated++;
      else skipped++;
      // Rate limit: wait 1s between calls
      await new Promise(r => setTimeout(r, 1000));
    }

    return { success: true, generated, skipped };
  } catch (e: any) {
    console.error('Failed to seed scenarios:', e);
    return { success: false, generated: 0, skipped: 0, error: e.message };
  }
}
