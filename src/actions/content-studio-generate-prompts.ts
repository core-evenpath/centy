'use server';

// ── AI-generated data-collection prompts ───────────────────────────────
//
// Given a feature label + business context + (optional) system module
// fields, asks Gemini for 2–5 short conversational questions that the
// chat agent can use to collect the missing data from visitors.
// Returns the prompts + a suggested module name derived from the
// feature label.

import { z } from 'zod';
import { googleAI } from '@genkit-ai/google-genai';
import { ai } from '@/ai/genkit';
import { getSystemModuleAction } from '@/actions/modules-actions';
import { getBusinessPersonaAction } from '@/actions/business-persona-actions';
import type { GeneratedPrompt } from '@/app/partner/(protected)/relay/datamap/types';

const PromptsSchema = z.object({
  prompts: z
    .array(z.string().min(10).max(200))
    .min(2)
    .max(5)
    .describe(
      'Conversational questions to collect data naturally in chat',
    ),
});

export interface GeneratePromptsResult {
  success: boolean;
  prompts?: GeneratedPrompt[];
  suggestedModuleName?: string;
  error?: string;
}

function deriveModuleName(featureLabel: string): string {
  return featureLabel
    .replace(/\.$/, '')
    .replace(/^View |^See |^Get |^Show /i, '')
    .replace(/\s+and\s+/gi, ' & ')
    .trim();
}

function readPersonaContext(
  persona: Awaited<ReturnType<typeof getBusinessPersonaAction>>['persona'],
): { name: string; industry: string } {
  const identity = persona?.identity as Record<string, unknown> | undefined;
  const name =
    (typeof identity?.name === 'string' && identity.name) || 'this business';
  const rawIndustry = identity?.industry;
  const industry =
    typeof rawIndustry === 'string'
      ? rawIndustry
      : typeof (rawIndustry as { name?: unknown })?.name === 'string'
        ? ((rawIndustry as { name: string }).name)
        : '';
  return { name, industry };
}

export async function generateDataCollectionPromptsAction(
  partnerId: string,
  featureLabel: string,
  moduleSlug: string | null,
  partnerActionDescription: string,
): Promise<GeneratePromptsResult> {
  try {
    const personaRes = await getBusinessPersonaAction(partnerId);
    const { name, industry } = readPersonaContext(personaRes.persona);

    let fieldsContext = '';
    if (moduleSlug) {
      const sysRes = await getSystemModuleAction(moduleSlug);
      if (sysRes.success && sysRes.data) {
        fieldsContext = sysRes.data.schema.fields
          .slice(0, 8)
          .map((f) => f.name || f.id)
          .join(', ');
      }
    }

    const prompt = `You are designing conversational prompts that ${name} will ask visitors in a chat widget to collect data.

FEATURE: "${featureLabel}"
INTENT: ${partnerActionDescription}
${industry ? `BUSINESS INDUSTRY: ${industry}` : ''}
${fieldsContext ? `RELATED DATA FIELDS: ${fieldsContext}` : ''}

TASK: Generate 3 natural, friendly conversational questions that ${name} would ask a customer during a chat to collect the data needed for this feature.

Rules:
- Questions should feel conversational, not like a form
- Each question should be standalone (don't reference previous questions)
- Keep questions short (under 120 characters)
- Use plain language — avoid jargon
- Include specifics relevant to the industry

Return only the questions.`;

    const result = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      prompt,
      output: { format: 'json', schema: PromptsSchema },
      config: { temperature: 0.4 },
    });

    const output = result.output as { prompts?: string[] } | null | undefined;
    if (!output?.prompts?.length) {
      return { success: false, error: 'AI returned no prompts' };
    }

    const prompts: GeneratedPrompt[] = output.prompts.map((q, i) => ({
      id: `prompt_${Date.now()}_${i}`,
      question: q,
      editable: true,
    }));

    return {
      success: true,
      prompts,
      suggestedModuleName: deriveModuleName(featureLabel),
    };
  } catch (err) {
    console.error('[content-studio/generate-prompts] failed:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to generate prompts',
    };
  }
}
