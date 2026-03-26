import type {
  ConversationFlowState,
  FlowDefinition,
  FlowEngineDecision,
  FlowStage,
  IntentSignal,
  LeadTemperature,
  FlowStageType,
  FlowSettings,
} from './types-flow-engine';
import { getBlockMappingForFunction } from './relay-block-taxonomy';

const INTENT_KEYWORDS: Record<IntentSignal, string[]> = {
  complaint: ['problem', 'issue', 'bad', 'terrible', 'worst', 'refund', 'cancel', 'disappointed'],
  urgent: ['asap', 'urgent', 'emergency', 'right now', 'immediately', 'today'],
  booking: ['book', 'reserve', 'appointment', 'schedule', 'sign up', 'register', 'buy', 'order'],
  pricing: ['price', 'cost', 'how much', 'rate', 'fee', 'affordable', 'expensive', 'cheap', 'budget'],
  contact: ['contact', 'call', 'phone', 'email', 'whatsapp', 'talk to', 'speak to', 'human'],
  schedule: ['available', 'availability', 'time', 'slot', 'open', 'when can', 'tomorrow'],
  comparing: ['compare', 'difference', 'vs', 'which is better', 'between'],
  promo: ['deal', 'offer', 'discount', 'promo', 'sale', 'coupon', 'code'],
  location: ['where', 'address', 'directions', 'map', 'location', 'how to get', 'near'],
  inquiry: [],
  browsing: ['show me', 'what do you', 'tell me about', "what's available", 'options'],
  returning: [],
};

const INTENT_PRIORITY: IntentSignal[] = [
  'complaint', 'urgent', 'booking', 'pricing', 'contact', 'schedule',
  'comparing', 'promo', 'location', 'inquiry', 'browsing', 'returning',
];

const INTENT_TO_STAGE: Record<IntentSignal, FlowStageType> = {
  browsing: 'discovery',
  comparing: 'comparison',
  pricing: 'showcase',
  booking: 'conversion',
  inquiry: 'objection',
  complaint: 'handoff',
  urgent: 'handoff',
  location: 'objection',
  contact: 'handoff',
  promo: 'showcase',
  schedule: 'showcase',
  returning: 'discovery',
};

const STAGE_TO_BLOCKS: Record<FlowStageType, string[]> = {
  greeting: ['greeting', 'welcome', 'quick_actions'],
  discovery: ['catalog', 'services', 'activities', 'quick_actions'],
  showcase: ['catalog', 'pricing', 'schedule', 'promo', 'menu'],
  comparison: ['compare'],
  social_proof: ['testimonials', 'reviews'],
  conversion: ['book', 'lead_capture', 'pricing'],
  objection: ['info', 'faq', 'location', 'text'],
  handoff: ['handoff', 'contact'],
  followup: ['quick_actions', 'promo', 'text'],
};

const DEFAULT_LEAD_SCORE: Record<FlowStageType, number> = {
  greeting: 1,
  discovery: 2,
  showcase: 3,
  comparison: 4,
  social_proof: 3,
  conversion: 5,
  objection: 1,
  handoff: 0,
  followup: 1,
};

const DEFAULT_SETTINGS: FlowSettings = {
  handoffThreshold: 10,
  maxTurnsBeforeHandoff: 15,
  enableLeadCapture: true,
  leadCaptureFields: ['name', 'phone', 'email'],
  enablePromos: false,
  enableTestimonials: false,
  testimonialTriggerAfter: 5,
  fallbackBehavior: 'text',
};

export function createInitialFlowState(
  conversationId: string,
  partnerId: string,
  flowId?: string
): ConversationFlowState {
  const now = new Date().toISOString();
  return {
    conversationId,
    partnerId,
    flowId,
    currentStageId: undefined,
    currentStageType: 'greeting',
    visitedStages: [],
    stageVisitCounts: {},
    intentHistory: [],
    currentIntent: 'browsing',
    leadScore: 0,
    leadTemperature: 'cold',
    itemsViewed: [],
    itemsCompared: [],
    interactionCount: 0,
    lastBlockType: 'text',
    capturedData: {},
    handoffRequested: false,
    startedAt: now,
    lastActivityAt: now,
  };
}

export function detectIntent(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>
): IntentSignal {
  const msg = userMessage.toLowerCase();

  for (const intent of INTENT_PRIORITY) {
    if (intent === 'inquiry' || intent === 'returning') continue;
    const keywords = INTENT_KEYWORDS[intent];
    for (const kw of keywords) {
      if (msg.includes(kw)) return intent;
    }
  }

  if (conversationHistory.length > 4) {
    const priorUserMessages = conversationHistory
      .filter(m => m.role === 'user')
      .map(m => m.content.toLowerCase());
    const referencesPrior = priorUserMessages.some(pm =>
      msg.includes('again') || msg.includes('earlier') || msg.includes('last time')
    );
    if (referencesPrior) return 'returning';
  }

  if (msg.includes('?')) return 'inquiry';

  return 'browsing';
}

export function calculateLeadTemperature(score: number): LeadTemperature {
  if (score >= 15) return 'converted';
  if (score >= 10) return 'hot';
  if (score >= 6) return 'warm';
  if (score >= 3) return 'warming';
  return 'cold';
}

export function runFlowEngine(
  state: ConversationFlowState,
  detectedIntent: IntentSignal,
  flow: FlowDefinition | null,
  functionId: string
): FlowEngineDecision {
  const updated: ConversationFlowState = {
    ...state,
    intentHistory: [...state.intentHistory, detectedIntent],
    currentIntent: detectedIntent,
    stageVisitCounts: { ...state.stageVisitCounts },
    visitedStages: [...state.visitedStages],
    itemsViewed: [...state.itemsViewed],
    itemsCompared: [...state.itemsCompared],
    lastActivityAt: new Date().toISOString(),
  };

  const settings = flow?.settings || DEFAULT_SETTINGS;

  let nextStageType: FlowStageType;
  let nextStageId: string | undefined;
  let leadScoreImpact: number;

  if (flow) {
    const resolved = resolveFlowTransition(flow, updated.currentStageId, detectedIntent);
    nextStageType = resolved.stageType;
    nextStageId = resolved.stageId;
    const matchedStage = flow.stages.find(s => s.id === nextStageId);
    leadScoreImpact = matchedStage?.leadScoreImpact ?? DEFAULT_LEAD_SCORE[nextStageType];
  } else {
    nextStageType = INTENT_TO_STAGE[detectedIntent];
    nextStageId = undefined;
    leadScoreImpact = DEFAULT_LEAD_SCORE[nextStageType];
  }

  updated.currentStageType = nextStageType;
  updated.currentStageId = nextStageId;

  const stageKey = nextStageId || nextStageType;
  if (!updated.visitedStages.includes(stageKey)) {
    updated.visitedStages.push(stageKey);
  }
  updated.stageVisitCounts[stageKey] = (updated.stageVisitCounts[stageKey] || 0) + 1;

  updated.leadScore = state.leadScore + leadScoreImpact;
  updated.leadTemperature = calculateLeadTemperature(updated.leadScore);

  const taxonomy = getBlockMappingForFunction(functionId);
  const allowedBlocks = new Set([...taxonomy.primaryBlocks, ...taxonomy.secondaryBlocks]);
  const excludedBlocks = new Set(taxonomy.excludedBlocks);

  const stageBlocks = STAGE_TO_BLOCKS[nextStageType] || STAGE_TO_BLOCKS.discovery;
  const suggestedBlockTypes = stageBlocks.filter(
    b => allowedBlocks.has(b) && !excludedBlocks.has(b)
  );

  if (suggestedBlockTypes.length === 0) {
    suggestedBlockTypes.push(...taxonomy.primaryBlocks.slice(0, 3));
  }

  const shouldHandoff = updated.leadScore >= settings.handoffThreshold ||
    updated.interactionCount >= settings.maxTurnsBeforeHandoff ||
    detectedIntent === 'complaint' ||
    detectedIntent === 'urgent';

  const shouldCaptureLeads = settings.enableLeadCapture &&
    (nextStageType === 'conversion' || updated.leadTemperature === 'hot') &&
    Object.keys(updated.capturedData).length === 0;

  const shouldShowPromo = settings.enablePromos &&
    (detectedIntent === 'promo' ||
      (settings.promoTriggerStage && nextStageType === settings.promoTriggerStage) ||
      nextStageType === 'showcase');

  const shouldShowTestimonials = settings.enableTestimonials &&
    (nextStageType === 'social_proof' ||
      (settings.testimonialTriggerAfter !== undefined &&
        updated.interactionCount >= settings.testimonialTriggerAfter &&
        !updated.visitedStages.includes('social_proof')));

  if (shouldHandoff) {
    updated.handoffRequested = true;
  }

  const contextForAI = buildContextForAI(
    updated, nextStageType, suggestedBlockTypes,
    shouldHandoff, shouldCaptureLeads, shouldShowPromo, shouldShowTestimonials
  );

  return {
    suggestedStageType: nextStageType,
    suggestedBlockTypes,
    leadScore: updated.leadScore,
    leadTemperature: updated.leadTemperature,
    shouldHandoff,
    shouldCaptureLeads,
    shouldShowPromo,
    shouldShowTestimonials,
    contextForAI,
    updatedState: updated,
  };
}

function resolveFlowTransition(
  flow: FlowDefinition,
  currentStageId: string | undefined,
  intent: IntentSignal
): { stageType: FlowStageType; stageId: string } {
  if (!currentStageId) {
    const entryStage = flow.stages.find(s => s.isEntry) || flow.stages[0];
    return { stageType: entryStage.type, stageId: entryStage.id };
  }

  const matchingTransitions = flow.transitions
    .filter(t => t.fromStageId === currentStageId)
    .sort((a, b) => b.priority - a.priority);

  for (const t of matchingTransitions) {
    if (t.condition === intent) {
      const target = flow.stages.find(s => s.id === t.toStageId);
      if (target) return { stageType: target.type, stageId: target.id };
    }
  }

  for (const stage of flow.stages) {
    if (stage.triggerIntents.includes(intent)) {
      return { stageType: stage.type, stageId: stage.id };
    }
  }

  const fallbackTransition = matchingTransitions.find(t => t.condition === 'fallback');
  if (fallbackTransition) {
    const target = flow.stages.find(s => s.id === fallbackTransition.toStageId);
    if (target) return { stageType: target.type, stageId: target.id };
  }

  const fallbackType = INTENT_TO_STAGE[intent];
  const matchingStage = flow.stages.find(s => s.type === fallbackType);
  if (matchingStage) return { stageType: matchingStage.type, stageId: matchingStage.id };

  const currentStage = flow.stages.find(s => s.id === currentStageId);
  return {
    stageType: currentStage?.type || 'discovery',
    stageId: currentStageId,
  };
}

function buildContextForAI(
  state: ConversationFlowState,
  stageType: FlowStageType,
  suggestedBlockTypes: string[],
  shouldHandoff: boolean,
  shouldCaptureLeads: boolean,
  shouldShowPromo: boolean,
  shouldShowTestimonials: boolean
): string {
  const lines: string[] = [
    'FLOW CONTEXT:',
    `- Current conversation stage: ${stageType}`,
    `- Preferred block types for this response: ${suggestedBlockTypes.join(', ')}`,
    `- Visitor lead temperature: ${state.leadTemperature}`,
    `- Visitor has viewed: ${state.itemsViewed.length} items`,
    `- Visitor has compared: ${state.itemsCompared.length} items`,
    `- Turn count: ${state.interactionCount}`,
    '',
    'IMPORTANT: Choose your response block type from the preferred list above.',
    'If the visitor explicitly asks for something else, you may use a different block type.',
  ];

  if (state.leadTemperature === 'hot' || state.leadTemperature === 'converted') {
    lines.push('Lead temperature is HIGH — prioritize conversion blocks (book, lead_capture, pricing).');
  } else if (state.leadTemperature === 'cold') {
    lines.push('Lead temperature is LOW — prioritize informative blocks (catalog, info, activities).');
  }

  if (shouldHandoff) {
    lines.push('The visitor seems to need human assistance. Include a "handoff" block type in your response.');
  }
  if (shouldShowPromo) {
    lines.push('Include a promotional offer if one is available.');
  }
  if (shouldCaptureLeads) {
    lines.push('This is a good moment to capture visitor contact info. Consider using "lead_capture" type.');
  }
  if (shouldShowTestimonials) {
    lines.push('Consider showing customer testimonials to build trust.');
  }

  if (state.itemsViewed.length > 0) {
    lines.push(`Previously viewed items: ${state.itemsViewed.slice(-5).join(', ')} — try to show different content.`);
  }

  return lines.join('\n');
}
