'use server';

import { GoogleGenAI } from '@google/genai';
import { registerAllBlocks } from '@/lib/relay/blocks/index';
import { listBlocks, getBlock, computeDataContract, getRegistrySize } from '@/lib/relay/registry';
import type { BlockDefinition, DataContract } from '@/lib/relay/types';

let registryReady = false;

function ensureRegistry(): void {
  if (!registryReady) {
    registerAllBlocks();
    registryReady = true;
  }
}

const BUILDER_MODEL = process.env.RELAY_AI_MODEL || 'gemini-2.5-flash';

export interface BlockListItem {
  id: string;
  family: string;
  label: string;
  description: string;
  applicableCategories: string[];
  variants: string[];
  requiredFieldCount: number;
  optionalFieldCount: number;
  preloadable: boolean;
  intentKeywords: string[];
}

export interface BlockDetailResult {
  definition: BlockDefinition;
  dataContract: DataContract;
}

export interface GeneratedBlockResult {
  componentCode: string;
  definitionCode: string;
  definition: {
    id: string;
    family: string;
    label: string;
    description: string;
    dataContract: DataContract;
    variants: string[];
  };
  sampleData: Record<string, any>;
}

export async function getRegisteredBlocksAction(filters?: {
  family?: string;
  category?: string;
}): Promise<{
  success: boolean;
  blocks: BlockListItem[];
  totalCount: number;
  families: string[];
  error?: string;
}> {
  try {
    ensureRegistry();

    const allBlocks = listBlocks(filters ? {
      family: filters.family,
      category: filters.category,
    } : undefined);

    const blocks: BlockListItem[] = allBlocks.map((d) => ({
      id: d.id,
      family: d.family,
      label: d.label,
      description: d.description,
      applicableCategories: d.applicableCategories,
      variants: d.variants,
      requiredFieldCount: d.dataContract.required.length,
      optionalFieldCount: d.dataContract.optional.length,
      preloadable: d.preloadable,
      intentKeywords: d.intentTriggers.keywords.slice(0, 5),
    }));

    const familySet = new Set<string>();
    const unfilteredBlocks = listBlocks();
    unfilteredBlocks.forEach((d) => familySet.add(d.family));

    return {
      success: true,
      blocks,
      totalCount: getRegistrySize(),
      families: Array.from(familySet).sort(),
    };
  } catch (error: any) {
    console.error('[BlockBuilder] Failed to list blocks:', error);
    return { success: false, blocks: [], totalCount: 0, families: [], error: error.message };
  }
}

export async function getBlockDetailAction(blockId: string): Promise<{
  success: boolean;
  detail?: BlockDetailResult;
  error?: string;
}> {
  try {
    ensureRegistry();

    const entry = getBlock(blockId);
    if (!entry) {
      return { success: false, error: 'Block not found in registry' };
    }

    const contract = computeDataContract([blockId]);

    return {
      success: true,
      detail: {
        definition: entry.definition,
        dataContract: contract,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getBlockSampleDataAction(blockId: string): Promise<{
  success: boolean;
  sampleData?: Record<string, any>;
  error?: string;
}> {
  try {
    ensureRegistry();

    const entry = getBlock(blockId);
    if (!entry) {
      return { success: false, error: 'Block not found' };
    }

    return { success: true, sampleData: entry.definition.sampleData };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getDerivedSchemaAction(blockIds: string[]): Promise<{
  success: boolean;
  schema?: DataContract;
  blockCount: number;
  error?: string;
}> {
  try {
    ensureRegistry();
    const schema = computeDataContract(blockIds);
    return { success: true, schema, blockCount: blockIds.length };
  } catch (error: any) {
    return { success: false, schema: undefined, blockCount: 0, error: error.message };
  }
}

export async function generateBlockFromPromptAction(
  prompt: string,
  vertical: string,
  referenceBlockIds?: string[]
): Promise<{
  success: boolean;
  result?: GeneratedBlockResult;
  error?: string;
}> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'Gemini API key not configured. Set GEMINI_API_KEY in environment variables.' };
  }

  try {
    ensureRegistry();

    let referenceCode = '';
    if (referenceBlockIds && referenceBlockIds.length > 0) {
      const refDefs = referenceBlockIds
        .map((id) => {
          const entry = getBlock(id);
          if (!entry) return null;
          return `REFERENCE BLOCK "${entry.definition.id}":\nLabel: ${entry.definition.label}\nFamily: ${entry.definition.family}\nData Contract Required: ${JSON.stringify(entry.definition.dataContract.required)}\nData Contract Optional: ${JSON.stringify(entry.definition.dataContract.optional)}\nSample Data: ${JSON.stringify(entry.definition.sampleData)}`;
        })
        .filter(Boolean)
        .join('\n\n');
      referenceCode = `\nREFERENCE BLOCKS (follow this style):\n${refDefs}\n`;
    }

    const systemInstruction = `You are an expert React/TypeScript developer building UI blocks for a conversational commerce widget called Relay. You generate self-contained React components with inline styles. No Tailwind. No CSS modules. No external stylesheets. Import icons from lucide-react only.

Every block file must export:
1. A \`definition\` constant of type BlockDefinition (id, family, label, description, applicableCategories, intentTriggers, dataContract, variants, sampleData, preloadable, streamable, cacheDuration)
2. A default function component that accepts { data, theme, variant? } props

The component uses theme.accent, theme.t1, theme.t2, theme.t3, theme.t4, theme.bg, theme.surface, theme.bdr, theme.green, theme.red, theme.amber for colors. All styles are inline objects. The component renders real data from the data prop — never hardcode business data.

Output ONLY valid JSON with these keys:
- componentCode: the full .tsx file content as a string
- definitionJSON: the BlockDefinition as a JSON object
- sampleData: realistic sample data for preview`;

    const userPrompt = `Generate a Relay block for the "${vertical}" vertical.

BLOCK DESCRIPTION:
${prompt}
${referenceCode}
IMPORTANT:
- The block id should follow the pattern: ${vertical === 'ecommerce' ? 'ecom_' : vertical + '_'}[block_name]
- Include comprehensive intentTriggers (keywords, queryPatterns, dataConditions)
- Include realistic sampleData that demonstrates the block
- The component must handle missing/optional data gracefully
- Keep the component under 150 lines
- Format currency with locale-appropriate formatting

Return ONLY valid JSON.`;

    const ai = new GoogleGenAI({ apiKey });

    const result = await ai.models.generateContent({
      model: BUILDER_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 4000,
        responseMimeType: 'application/json',
      },
    });

    const responseText = (result.text || '').trim();

    let parsed: any;
    try {
      // Try direct parse first (responseMimeType: 'application/json' should return clean JSON)
      parsed = JSON.parse(responseText);
    } catch {
      // Fallback: extract JSON object from response
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch {
        return { success: false, error: 'AI returned invalid JSON. Try simplifying your prompt.' };
      }
    }

    if (!parsed || !parsed.componentCode) {
      return { success: false, error: 'AI did not generate component code' };
    }

    const defJson = parsed.definitionJSON || {};

    return {
      success: true,
      result: {
        componentCode: parsed.componentCode,
        definitionCode: JSON.stringify(defJson, null, 2),
        definition: {
          id: defJson.id || 'generated_block',
          family: defJson.family || 'catalog',
          label: defJson.label || 'Generated Block',
          description: defJson.description || prompt,
          dataContract: defJson.dataContract || { required: [], optional: [] },
          variants: defJson.variants || ['default'],
        },
        sampleData: parsed.sampleData || defJson.sampleData || {},
      },
    };
  } catch (error: any) {
    console.error('[BlockBuilder] Generation failed:', error);
    const msg = error.message || 'Unknown error';
    if (msg.includes('not found') || msg.includes('404')) {
      return { success: false, error: `Model "${BUILDER_MODEL}" not available. Check RELAY_AI_MODEL env var or try a different model.` };
    }
    if (msg.includes('API key') || msg.includes('401') || msg.includes('403')) {
      return { success: false, error: 'Invalid or expired API key. Check GEMINI_API_KEY env var.' };
    }
    if (msg.includes('429') || msg.includes('quota') || msg.includes('rate')) {
      return { success: false, error: 'Rate limit exceeded. Wait a moment and try again.' };
    }
    return { success: false, error: `Generation failed: ${msg}` };
  }
}

export async function exportBlockRegistryAction(): Promise<{
  success: boolean;
  registry: {
    totalBlocks: number;
    families: Record<string, number>;
    blocks: Array<{
      id: string;
      family: string;
      label: string;
      categories: string[];
      requiredFields: string[];
      optionalFields: string[];
      variants: string[];
    }>;
  };
}> {
  try {
    ensureRegistry();
    const all = listBlocks();

    const families: Record<string, number> = {};
    all.forEach((d) => {
      families[d.family] = (families[d.family] || 0) + 1;
    });

    return {
      success: true,
      registry: {
        totalBlocks: all.length,
        families,
        blocks: all.map((d) => ({
          id: d.id,
          family: d.family,
          label: d.label,
          categories: d.applicableCategories,
          requiredFields: d.dataContract.required.map((f) => f.field),
          optionalFields: d.dataContract.optional.map((f) => f.field),
          variants: d.variants,
        })),
      },
    };
  } catch {
    return {
      success: false,
      registry: { totalBlocks: 0, families: {}, blocks: [] },
    };
  }
}
