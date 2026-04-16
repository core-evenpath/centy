'use server';

// ── AI ingest: pipeline orchestrator ───────────────────────────────────
//
// Pulls together the source adapters + extraction engine. Loads the
// partner/system modules, merges their fields (system base + partner
// custom), reads a short business-context blurb from the persona, and
// returns `ExtractedItem[]` for the review modal. Does NOT write
// anything to Firestore — saving is a separate action.

import {
  getPartnerModuleByIdAction,
} from '@/actions/modules-actions';
import { getBusinessPersonaAction } from '@/actions/business-persona-actions';
import { extractItemsFromContent } from '@/lib/relay/ai-ingest/engine';
import {
  extractFromAIPrompt,
  extractFromCoreMemory,
  extractFromPdf,
  extractFromText,
  extractFromWebsite,
  type SourceExtractionResult,
} from '@/lib/relay/ai-ingest/sources';
import type {
  IngestInput,
  IngestResult,
} from '@/lib/relay/ai-ingest/types';
import type { ModuleSchema } from '@/lib/modules/types';

const DEFAULT_MAX_ITEMS = 50;

function buildBusinessContext(
  personaResult: Awaited<ReturnType<typeof getBusinessPersonaAction>>,
): string | undefined {
  if (!personaResult.success || !personaResult.persona) return undefined;
  const identity = personaResult.persona.identity as unknown as
    | Record<string, unknown>
    | undefined;
  const personality = personaResult.persona.personality as unknown as
    | Record<string, unknown>
    | undefined;
  const parts: string[] = [];
  if (identity) {
    if (typeof identity.name === 'string') parts.push(identity.name);
    const industry = identity.industry as
      | { name?: unknown }
      | string
      | undefined;
    if (typeof industry === 'string') parts.push(industry);
    else if (industry && typeof industry.name === 'string')
      parts.push(industry.name);
  }
  if (personality && typeof personality.description === 'string') {
    parts.push(personality.description);
  }
  return parts.length > 0 ? parts.join(' — ') : undefined;
}

async function runSourceAdapter(
  input: IngestInput,
  businessContext: string | undefined,
): Promise<SourceExtractionResult> {
  switch (input.source) {
    case 'website':
      if (!input.websiteUrl) {
        return { success: false, content: '', sourceLabel: '', error: 'websiteUrl is required' };
      }
      return extractFromWebsite(input.websiteUrl);
    case 'pdf':
      if (!input.pdfBase64) {
        return { success: false, content: '', sourceLabel: '', error: 'pdfBase64 is required' };
      }
      return extractFromPdf(
        input.pdfBase64,
        input.pdfFilename || 'document.pdf',
      );
    case 'text':
      if (!input.rawText) {
        return { success: false, content: '', sourceLabel: '', error: 'rawText is required' };
      }
      return extractFromText(input.rawText);
    case 'core_memory':
      if (!input.coreMemoryDocIds?.length) {
        return {
          success: false,
          content: '',
          sourceLabel: 'Core Memory',
          error: 'At least one document id is required',
        };
      }
      return extractFromCoreMemory(input.partnerId, input.coreMemoryDocIds);
    case 'ai_generate':
      if (!input.aiPrompt) {
        return { success: false, content: '', sourceLabel: '', error: 'aiPrompt is required' };
      }
      return extractFromAIPrompt(input.aiPrompt, businessContext);
    default:
      return {
        success: false,
        content: '',
        sourceLabel: '',
        error: `Unknown source: ${String(input.source)}`,
      };
  }
}

export async function ingestContentAction(
  input: IngestInput,
): Promise<IngestResult> {
  const started = Date.now();
  const baseFail = (error: string): IngestResult => ({
    success: false,
    status: 'error',
    items: [],
    source: input.source,
    sourceLabel: '',
    totalExtracted: 0,
    processingTimeMs: Date.now() - started,
    error,
  });

  try {
    if (!input.partnerId || !input.moduleId) {
      return baseFail('partnerId and moduleId are required');
    }

    const moduleResult = await getPartnerModuleByIdAction(
      input.partnerId,
      input.moduleId,
    );
    if (!moduleResult.success || !moduleResult.data) {
      return baseFail(moduleResult.error || 'Module not found');
    }

    const { partnerModule, systemModule } = moduleResult.data;
    const customFields = (
      (partnerModule as unknown as { customFields?: unknown[] }).customFields ??
      []
    ) as ModuleSchema['fields'];

    const effectiveSchema: ModuleSchema = {
      fields: [...systemModule.schema.fields, ...customFields],
      categories: systemModule.schema.categories,
    };

    const personaResult = await getBusinessPersonaAction(input.partnerId);
    const businessContext = buildBusinessContext(personaResult);

    const sourceResult = await runSourceAdapter(input, businessContext);
    if (!sourceResult.success || !sourceResult.content) {
      return {
        ...baseFail(sourceResult.error || 'No content extracted from source'),
        sourceLabel: sourceResult.sourceLabel,
      };
    }

    const { items, warnings } = await extractItemsFromContent(
      sourceResult.content,
      effectiveSchema,
      systemModule.name,
      {
        maxItems: input.maxItems ?? DEFAULT_MAX_ITEMS,
        industryContext: businessContext,
      },
    );

    return {
      success: true,
      status: 'ready',
      items,
      source: input.source,
      sourceLabel: sourceResult.sourceLabel,
      totalExtracted: items.length,
      processingTimeMs: Date.now() - started,
      warnings,
    };
  } catch (err) {
    console.error('[ai-ingest] failed:', err);
    return baseFail(err instanceof Error ? err.message : 'Ingest failed');
  }
}
