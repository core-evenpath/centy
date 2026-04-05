'use server';

import { discoverModulesForBusinessType, generateModuleSchemaAction } from './module-ai-actions';
import { createSystemModuleAction, getSystemModuleAction } from './modules-actions';
import { createSystemFlowTemplateAction } from './flow-engine-actions';
import { getFlowTemplateForFunction, getDefaultFlowForIndustry } from '@/lib/flow-templates';
import type { FlowStage, FlowTransition, FlowSettings, SystemFlowTemplateRecord } from '@/lib/types-flow-engine';

export interface PipelineResult {
  success: boolean;
  summary: {
    functionId: string;
    functionName: string;
    modulesDiscovered: number;
    modulesCreated: number;
    modulesSkipped: number;
    modulesFailed: { slug: string; error: string }[];
    flowTemplateId?: string;
  };
  error?: string;
}

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
  };

  try {
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

    for (let i = 0; i < selectedModules.length; i++) {
      const discovered = selectedModules[i];
      const slug = `${functionId}_${discovered.slug}`;
      const label = `${i + 1}/${selectedModules.length}`;

      console.log(`[Pipeline] Creating module ${label}: ${discovered.name}...`);

      const existing = await getSystemModuleAction(slug);
      if (existing.success && existing.data) {
        console.log(`[Pipeline]   Already exists, skipping`);
        summary.modulesSkipped++;
        continue;
      }

      console.log(`[Pipeline]   Generating schema...`);
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
        console.error(`[Pipeline]   Schema generation failed: ${schemaResult.error}`);
        summary.modulesFailed.push({ slug, error: schemaResult.error || 'Schema generation failed' });
        if (i < selectedModules.length - 1) {
          await new Promise((r) => setTimeout(r, 2000));
        }
        continue;
      }

      console.log(`[Pipeline]   Creating system module...`);
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
        console.error(`[Pipeline]   Module creation failed: ${createResult.error}`);
        summary.modulesFailed.push({ slug, error: createResult.error || 'Module creation failed' });
      } else {
        console.log(`[Pipeline]   Created module ${createResult.data.moduleId}`);
        summary.modulesCreated++;
      }

      if (i < selectedModules.length - 1) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    console.log(`[Pipeline] Creating flow template for ${functionName}...`);

    const flowTemplateData = resolveFlowTemplate(functionId, industryId, industryName, functionName);

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

function resolveFlowTemplate(
  functionId: string,
  industryId: string,
  industryName: string,
  functionName: string
): Omit<SystemFlowTemplateRecord, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> {
  const preBuilt = getFlowTemplateForFunction(functionId);
  if (preBuilt) {
    console.log(`[Pipeline] Using pre-built flow template for ${functionId}`);
    return {
      name: preBuilt.name,
      description: preBuilt.description,
      industryId: preBuilt.industryId,
      functionId: preBuilt.functionId,
      industryName: preBuilt.industryName,
      functionName: preBuilt.functionName,
      stages: preBuilt.stages,
      transitions: preBuilt.transitions,
      settings: preBuilt.settings,
      status: 'active',
    };
  }

  const industryFallback = getDefaultFlowForIndustry(industryId);
  if (industryFallback) {
    console.log(`[Pipeline] Adapting industry-level template for ${industryId} -> ${functionId}`);
    const prefixedStages = industryFallback.stages.map(s => ({
      ...s,
      id: s.id.replace(/^[a-z]+_/, `${functionId}_`),
    }));
    const prefixedTransitions = industryFallback.transitions.map(t => ({
      ...t,
      from: t.from.replace(/^[a-z]+_/, `${functionId}_`),
      to: t.to.replace(/^[a-z]+_/, `${functionId}_`),
    }));
    return {
      name: `${functionName} Flow`,
      description: `Conversation flow for ${functionName} (adapted from ${industryFallback.functionName})`,
      industryId,
      functionId,
      industryName,
      functionName,
      stages: prefixedStages,
      transitions: prefixedTransitions,
      settings: industryFallback.settings,
      status: 'active',
    };
  }

  console.log(`[Pipeline] Building generic flow template for ${functionId}`);
  return buildGenericFlowTemplate(functionId, industryId, industryName, functionName);
}

function buildGenericFlowTemplate(
  functionId: string,
  industryId: string,
  industryName: string,
  functionName: string
): Omit<SystemFlowTemplateRecord, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> {
  const p = functionId;

  const stages: FlowStage[] = [
    {
      id: `${p}_greeting`,
      type: 'greeting',
      label: 'Welcome',
      blockTypes: ['greeting', 'quick_actions'],
      intentTriggers: ['browsing'],
      leadScoreImpact: 0,
      isEntry: true,
    },
    {
      id: `${p}_discovery`,
      type: 'discovery',
      label: 'Browse',
      blockTypes: ['services', 'catalog', 'quick_actions'],
      intentTriggers: ['browsing', 'inquiry', 'returning'],
      leadScoreImpact: 10,
    },
    {
      id: `${p}_showcase`,
      type: 'showcase',
      label: 'Details & Pricing',
      blockTypes: ['pricing', 'info', 'gallery'],
      intentTriggers: ['pricing', 'comparing'],
      leadScoreImpact: 15,
    },
    {
      id: `${p}_social_proof`,
      type: 'social_proof',
      label: 'Reviews',
      blockTypes: ['testimonials', 'reviews'],
      intentTriggers: ['comparing'],
      leadScoreImpact: 10,
    },
    {
      id: `${p}_conversion`,
      type: 'conversion',
      label: 'Take Action',
      blockTypes: ['book', 'lead_capture', 'contact'],
      intentTriggers: ['booking', 'schedule'],
      leadScoreImpact: 30,
    },
    {
      id: `${p}_handoff`,
      type: 'handoff',
      label: 'Contact',
      blockTypes: ['handoff', 'contact'],
      intentTriggers: ['contact', 'complaint', 'urgent'],
      leadScoreImpact: 0,
      isExit: true,
    },
  ];

  const transitions: FlowTransition[] = [
    { from: `${p}_greeting`, to: `${p}_discovery`, trigger: 'browsing' },
    { from: `${p}_greeting`, to: `${p}_conversion`, trigger: 'booking', priority: 1 },
    { from: `${p}_greeting`, to: `${p}_handoff`, trigger: 'contact' },
    { from: `${p}_greeting`, to: `${p}_handoff`, trigger: 'urgent', priority: 2 },
    { from: `${p}_discovery`, to: `${p}_showcase`, trigger: 'pricing' },
    { from: `${p}_discovery`, to: `${p}_showcase`, trigger: 'comparing' },
    { from: `${p}_discovery`, to: `${p}_conversion`, trigger: 'booking', priority: 1 },
    { from: `${p}_discovery`, to: `${p}_handoff`, trigger: 'contact' },
    { from: `${p}_discovery`, to: `${p}_handoff`, trigger: 'complaint' },
    { from: `${p}_showcase`, to: `${p}_social_proof`, trigger: 'comparing' },
    { from: `${p}_showcase`, to: `${p}_conversion`, trigger: 'booking', priority: 1 },
    { from: `${p}_showcase`, to: `${p}_discovery`, trigger: 'browsing' },
    { from: `${p}_showcase`, to: `${p}_handoff`, trigger: 'contact' },
    { from: `${p}_social_proof`, to: `${p}_conversion`, trigger: 'booking', priority: 1 },
    { from: `${p}_social_proof`, to: `${p}_discovery`, trigger: 'browsing' },
    { from: `${p}_social_proof`, to: `${p}_handoff`, trigger: 'contact' },
    { from: `${p}_conversion`, to: `${p}_handoff`, trigger: 'contact' },
    { from: `${p}_conversion`, to: `${p}_discovery`, trigger: 'browsing' },
    { from: `${p}_conversion`, to: `${p}_handoff`, trigger: 'complaint' },
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
    name: `${functionName} Flow`,
    description: `Conversation flow for ${functionName} in ${industryName}`,
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
