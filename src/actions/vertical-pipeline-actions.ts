'use server';

import { discoverModulesForBusinessType, generateModuleSchemaAction } from './module-ai-actions';
import { createSystemModuleAction, getSystemModuleAction } from './modules-actions';
import { createSystemFlowTemplateAction } from './flow-engine-actions';
import type { FlowStage, FlowTransition, FlowSettings, SystemFlowTemplateRecord } from '@/lib/types-flow-engine';

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface PipelineResult {
  success: boolean;
  summary: {
    functionId: string;
    functionName: string;
    modulesDiscovered: number;
    modulesCreated: number;
    modulesSkipped: number;
    modulesFailed: { slug: string; error: string }[];
    relayBlocksCreated: number;
    flowTemplateId?: string;
  };
  error?: string;
}

// ---------------------------------------------------------------------------
// Pipeline orchestrator
// ---------------------------------------------------------------------------

export async function runVerticalPipelineAction(
  industryId: string,
  industryName: string,
  functionId: string,
  functionName: string,
  countryCode: string = 'US',
  userId: string = 'system'
): Promise<PipelineResult> {
  const summary: PipelineResult['summary'] = {
    functionId,
    functionName,
    modulesDiscovered: 0,
    modulesCreated: 0,
    modulesSkipped: 0,
    modulesFailed: [],
    relayBlocksCreated: 0,
  };

  try {
    // ------------------------------------------------------------------
    // Step 1: Discover modules for the business function
    // ------------------------------------------------------------------
    console.log(`[Pipeline] Discovering modules for ${functionName}...`);
    const discoveryResult = await discoverModulesForBusinessType(
      industryId,
      industryName,
      functionId,
      functionName,
      countryCode
    );

    if (!discoveryResult.success || !discoveryResult.template) {
      return { success: false, summary, error: `Module discovery failed: ${discoveryResult.error}` };
    }

    const selectedModules = discoveryResult.template.modules.filter((m) => m.selected !== false);
    summary.modulesDiscovered = selectedModules.length;
    console.log(`[Pipeline] Discovered ${selectedModules.length} modules`);

    // ------------------------------------------------------------------
    // Step 2: For each module — generate schema then create system module
    // ------------------------------------------------------------------
    for (let i = 0; i < selectedModules.length; i++) {
      const discovered = selectedModules[i];
      const slug = `${functionId}_${discovered.slug}`;
      const label = `${i + 1}/${selectedModules.length}`;

      console.log(`[Pipeline] Creating module ${label}: ${discovered.name}...`);

      // Check if module already exists
      const existing = await getSystemModuleAction(slug);
      if (existing.success && existing.data) {
        console.log(`[Pipeline]   ↳ Already exists, skipping`);
        summary.modulesSkipped++;
        continue;
      }

      // Generate schema via AI
      console.log(`[Pipeline]   ↳ Generating schema...`);
      const schemaResult = await generateModuleSchemaAction(
        industryId,
        industryName,
        discovered.name,
        discovered.itemLabel,
        countryCode,
        'standard',
        functionId,
        functionName
      );

      if (!schemaResult.success || !schemaResult.schema) {
        console.error(`[Pipeline]   ↳ Schema generation failed: ${schemaResult.error}`);
        summary.modulesFailed.push({ slug, error: schemaResult.error || 'Schema generation failed' });
        // Still delay before next iteration to respect rate limits
        if (i < selectedModules.length - 1) {
          await new Promise((r) => setTimeout(r, 2000));
        }
        continue;
      }

      // Create system module (auto-triggers relay block generation)
      console.log(`[Pipeline]   ↳ Creating system module...`);
      const createResult = await createSystemModuleAction({
        slug,
        name: discovered.name,
        description: discovered.description,
        icon: discovered.icon,
        color: '#6366f1',
        schema: schemaResult.schema,
        itemLabel: discovered.itemLabel,
        itemLabelPlural: discovered.itemLabelPlural,
        priceLabel: discovered.priceLabel,
        priceType: discovered.priceType,
        defaultCurrency: countryCode === 'US' ? 'USD' : 'INR',
        settings: {
          allowCustomFields: true,
          allowCustomCategories: true,
          maxItems: 1000,
          maxCustomFields: 10,
          maxCustomCategories: 20,
          requiresPrice: true,
          requiresImage: false,
          requiresCategory: true,
          enableVariants: false,
          enableInventoryTracking: false,
          minSchemaVersion: 1,
        },
        applicableIndustries: [industryId],
        applicableFunctions: [functionId],
        agentConfig: discovered.agentConfig,
        status: 'active',
        lastUsedAt: undefined,
        createdBy: userId,
      });

      if (!createResult.success || !createResult.data) {
        console.error(`[Pipeline]   ↳ Module creation failed: ${createResult.error}`);
        summary.modulesFailed.push({ slug, error: createResult.error || 'Module creation failed' });
      } else {
        console.log(`[Pipeline]   ↳ Created module ${createResult.data.moduleId}`);
        summary.modulesCreated++;
        if (createResult.data.relayBlock?.success) {
          summary.relayBlocksCreated++;
          console.log(`[Pipeline]   ↳ Relay block created: ${createResult.data.relayBlock.blockId}`);
        }
      }

      // Rate-limit delay between iterations
      if (i < selectedModules.length - 1) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    // ------------------------------------------------------------------
    // Step 3: Create flow template for this function
    // ------------------------------------------------------------------
    console.log(`[Pipeline] Creating flow template for ${functionName}...`);

    const flowTemplateData = buildSoftwareItFlowTemplate(functionId, industryId, industryName, functionName);

    const flowResult = await createSystemFlowTemplateAction(flowTemplateData, userId);

    if (flowResult.success && flowResult.templateId) {
      summary.flowTemplateId = flowResult.templateId;
      console.log(`[Pipeline] Flow template created: ${flowResult.templateId}`);
    } else {
      console.error(`[Pipeline] Flow template creation failed: ${flowResult.error}`);
    }

    console.log(`[Pipeline] Pipeline complete!`);
    return { success: true, summary };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown pipeline error';
    console.error(`[Pipeline] Fatal error:`, err);
    return { success: false, summary, error: message };
  }
}

// ---------------------------------------------------------------------------
// Flow template builder for Software & IT Services
// ---------------------------------------------------------------------------

function buildSoftwareItFlowTemplate(
  functionId: string,
  industryId: string,
  industryName: string,
  functionName: string
): Omit<SystemFlowTemplateRecord, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> {
  const stages: FlowStage[] = [
    {
      id: `${functionId}_greeting`,
      type: 'greeting',
      label: 'Welcome',
      description: 'Greet visitor, identify if they are a potential client or existing customer',
      blockTypes: ['greeting', 'quick_actions'],
      intentTriggers: ['browsing'],
      leadScoreImpact: 0,
      isEntry: true,
    },
    {
      id: `${functionId}_discovery`,
      type: 'discovery',
      label: 'Discovery',
      description: 'Understand what the visitor needs — custom software, SaaS product, IT support, consulting',
      blockTypes: ['services', 'quick_actions', 'pricing'],
      intentTriggers: ['browsing', 'inquiry', 'pricing'],
      leadScoreImpact: 10,
    },
    {
      id: `${functionId}_qualification`,
      type: 'showcase',
      label: 'Qualification',
      description: 'Qualify the lead — budget range, timeline, team size, current tech stack',
      blockTypes: ['pricing', 'lead_capture', 'info'],
      intentTriggers: ['pricing', 'inquiry', 'schedule'],
      leadScoreImpact: 20,
    },
    {
      id: `${functionId}_presentation`,
      type: 'comparison',
      label: 'Presentation',
      description: 'Show relevant portfolio items, case studies, tech stack capabilities, engagement models',
      blockTypes: ['catalog', 'services', 'testimonials', 'gallery'],
      intentTriggers: ['comparing', 'browsing'],
      leadScoreImpact: 15,
    },
    {
      id: `${functionId}_conversion`,
      type: 'conversion',
      label: 'Conversion',
      description: 'Drive toward booking a discovery call, requesting a proposal, or starting a trial',
      blockTypes: ['book', 'lead_capture', 'contact'],
      intentTriggers: ['booking', 'schedule'],
      leadScoreImpact: 30,
    },
    {
      id: `${functionId}_handoff`,
      type: 'handoff',
      label: 'Team Connect',
      description: 'Complex requirements, enterprise deals, or custom integrations — connect to founder or sales',
      blockTypes: ['handoff', 'contact'],
      intentTriggers: ['contact', 'complaint', 'urgent'],
      leadScoreImpact: 25,
      isExit: true,
    },
  ];

  const transitions: FlowTransition[] = [
    { from: `${functionId}_greeting`, to: `${functionId}_discovery`, trigger: 'browsing' },
    { from: `${functionId}_greeting`, to: `${functionId}_discovery`, trigger: 'inquiry' },
    { from: `${functionId}_greeting`, to: `${functionId}_conversion`, trigger: 'booking', priority: 1 },
    { from: `${functionId}_greeting`, to: `${functionId}_handoff`, trigger: 'contact' },
    { from: `${functionId}_discovery`, to: `${functionId}_qualification`, trigger: 'pricing' },
    { from: `${functionId}_discovery`, to: `${functionId}_qualification`, trigger: 'inquiry' },
    { from: `${functionId}_discovery`, to: `${functionId}_presentation`, trigger: 'comparing' },
    { from: `${functionId}_discovery`, to: `${functionId}_handoff`, trigger: 'contact' },
    { from: `${functionId}_qualification`, to: `${functionId}_presentation`, trigger: 'comparing' },
    { from: `${functionId}_qualification`, to: `${functionId}_conversion`, trigger: 'booking', priority: 1 },
    { from: `${functionId}_qualification`, to: `${functionId}_handoff`, trigger: 'contact' },
    { from: `${functionId}_presentation`, to: `${functionId}_conversion`, trigger: 'booking', priority: 1 },
    { from: `${functionId}_presentation`, to: `${functionId}_discovery`, trigger: 'browsing' },
    { from: `${functionId}_presentation`, to: `${functionId}_handoff`, trigger: 'contact' },
    { from: `${functionId}_conversion`, to: `${functionId}_handoff`, trigger: 'contact' },
    { from: `${functionId}_conversion`, to: `${functionId}_discovery`, trigger: 'browsing' },
    { from: `${functionId}_discovery`, to: `${functionId}_handoff`, trigger: 'complaint' },
    { from: `${functionId}_discovery`, to: `${functionId}_handoff`, trigger: 'urgent' },
    { from: `${functionId}_qualification`, to: `${functionId}_handoff`, trigger: 'complaint' },
    { from: `${functionId}_conversion`, to: `${functionId}_handoff`, trigger: 'complaint' },
  ];

  const settings: FlowSettings = {
    handoffThreshold: 15,
    maxTurnsBeforeHandoff: 12,
    enableLeadCapture: true,
    leadCaptureFields: ['name', 'email', 'phone'],
    showTestimonials: true,
    showPromos: true,
    leadCaptureAfterTurn: 3,
    fallbackBehavior: 'quick_actions',
  };

  return {
    name: 'Software & IT Services Flow',
    description: 'Conversation flow for software companies, IT service providers, and SaaS businesses',
    industryId,
    functionId,
    industryName,
    functionName,
    stages,
    transitions,
    settings,
    status: 'active',
  };
}
