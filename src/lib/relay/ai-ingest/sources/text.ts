// ── Plain-text + AI-generate source adapters ───────────────────────────
//
// Both shapes end up as a single content blob for the engine. The
// "ai_generate" variant wraps the user's prompt in a small instruction
// block so the same extraction prompt (no template swap) produces
// realistic synthetic items.

import type { SourceExtractionResult } from './types';

export function extractFromText(
  text: string,
  label: string = 'Text input',
): SourceExtractionResult {
  return { success: true, content: text, sourceLabel: label };
}

export function extractFromAIPrompt(
  prompt: string,
  businessContext?: string,
): SourceExtractionResult {
  const contextLine = businessContext ? `Business context: ${businessContext}\n\n` : '';
  const content = `AI GENERATION REQUEST

User description: ${prompt}

${contextLine}Task: Produce realistic, varied items matching the user description.
Each item should look like something a real business in this space would offer,
with distinct names, prices and categories where applicable.`;

  return { success: true, content, sourceLabel: 'AI generated' };
}
