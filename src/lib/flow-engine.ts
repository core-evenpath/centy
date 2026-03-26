import type {
  ConversationFlowState,
  FlowDefinition,
  FlowEngineDecision,
  FlowStageType,
  IntentSignal,
  LeadTemperature,
} from './types-flow-engine';
import { getBlockMappingForFunction } from '@/lib/relay-block-taxonomy';

// ---------------------------------------------------------------------------
// Create initial conversation flow state
// ---------------------------------------------------------------------------
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
    lastBlockType: '',
    capturedData: {},
    handoffRequested: false,
    startedAt: now,
    lastActivityAt: now,
  };
}

// ---------------------------------------------------------------------------
// Deterministic intent detection via keyword matching
// ---------------------------------------------------------------------------
const INTENT_KEYWORDS: Record<IntentSignal, string[]> = {
  browsing: ['show me', 'what do you', 'tell me about', "what's available", 'options', 'what are'],
  comparing: ['compare', 'difference', 'vs', 'which is better', 'between'],
  pricing: ['price', 'cost', 'how much', 'rate', 'fee', 'affordable', 'expensive', 'cheap', 'budget'],
  booking: ['book', 'reserve', 'appointment', 'schedule', 'sign up', 'register', 'buy', 'order'],
  inquiry: [],
  complaint: ['problem', 'issue', 'bad', 'terrible', 'worst', 'refund', 'cancel', 'disappointed'],
  urgent: ['asap', 'urgent', 'emergency', 'right now', 'immediately', 'today'],
  location: ['where', 'address', 'directions', 'map', 'location', 'how to get', 'near'],
  contact: ['contact', 'call', 'phone', 'email', 'whatsapp', 'talk to', 'speak to', 'human'],
  promo: ['deal', 'offer', 'discount', 'promo', 'sale', 'coupon', 'code'],
  schedule: ['available', 'availability', 'time', 'slot', 'open', 'when can', 'tomorrow'],
  returning: [],
};

const INTENT_PRIORITY: IntentSignal[] = [
  'complaint',
  'urgent',
  'booking',
  'pricing',
  'contact',
  'schedule',
  'comparing',
  'promo',
  'inquiry',
  'browsing',
];

export function detectIntent(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>
): IntentSignal {
  const msg = userMessage.toLowerCase();

  // Check returning first (conversation length heuristic)
  const isReturning = conversationHistory.length > 4;

  // Score each intent by keyword match
  const matched: IntentSignal[] = [];

  for (const intent of INTENT_PRIORITY) {
    const keywords = INTENT_KEYWORDS[intent];
    if (keywords.length === 0) continue;
    for (const kw of keywords) {
      if (msg.includes(kw)) {
        matched.push(intent);
        break;
      }
    }
  }

  // Return highest priority match
  if (matched.length > 0) {
    return matched[0];
  }

  // Returning visitor heuristic
  if (isReturning) {
    return 'returning';
  }

  // Question mark → inquiry
  if (msg.includes('?')) {
    return 'inquiry';
  }

  return 'browsing';
}

// ---------------------------------------------------------------------------
// Lead temperature calculation
// ---------------------------------------------------------------------------
export function calculateLeadTemperature(score: number): LeadTemperature {
  if (score <= 2) return 'cold';
  if (score <= 5) return 'warming';
  if (score <= 10) return 'warm';
  if (score <= 20) return 'hot';
  return 'converted';
}

// ---------------------------------------------------------------------------
// Intent → stage type mapping (for intent-only mode)
// ---------------------------------------------------------------------------
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

// Stage type → lead score increment (intent-only mode)
const STAGE_SCORE_MAP: Partial<Record<FlowStageType, number>> = {
  discovery: 1,
  showcase: 2,
  comparison: 2,
  conversion: 3,
  objection: 1,
  handoff: 0,
  social_proof: 1,
  greeting: 1,
  followup: 1,
};

// Block types relevant to each stage type (intent-only fallback filter)
const STAGE_BLOCK_RELEVANCE: Record<FlowStageType, string[]> = {
  greeting: ['greeting', 'welcome', 'quick_actions'],
  discovery: ['catalog', 'rooms', 'products', 'services', 'menu', 'listings', 'activities', 'experiences', 'classes', 'treatments', 'gallery', 'photos', 'info', 'faq', 'details'],
  showcase: ['pricing', 'packages', 'plans', 'schedule', 'timetable', 'slots', 'promo', 'offer', 'deal'],
  comparison: ['compare'],
  social_proof: ['testimonials', 'reviews'],
  conversion: ['book', 'reserve', 'appointment', 'lead_capture', 'form', 'inquiry_form'],
  objection: ['info', 'faq', 'details', 'location', 'directions', 'quick_actions'],
  handoff: ['handoff', 'connect', 'human', 'contact'],
  followup: ['quick_actions', 'menu_actions', 'info'],
};

// ---------------------------------------------------------------------------
// Main flow engine
// ---------------------------------------------------------------------------
export function runFlowEngine(
  state: ConversationFlowState,
  detectedIntent: IntentSignal,
  flow: FlowDefinition | null,
  functionId: string
): FlowEngineDecision {
  // 1. Clone state
  const s: ConversationFlowState = {
    ...state,
    visitedStages: [...state.visitedStages],
    stageVisitCounts: { ...state.stageVisitCounts },
    intentHistory: [...state.intentHistory],
    itemsViewed: [...state.itemsViewed],
    itemsCompared: [...state.itemsCompared],
    capturedData: { ...state.capturedData },
  };

  // 2. Update intent tracking
  s.intentHistory.push(detectedIntent);
  s.currentIntent = detectedIntent;
  s.interactionCount += 1;
  s.lastActivityAt = new Date().toISOString();

  let stageType: FlowStageType = s.currentStageType;
  let blockTypes: string[] = [];

  // Resolve settings (flow settings or defaults)
  const settings = flow?.settings ?? {
    handoffThreshold: 15,
    maxTurnsBeforeHandoff: 12,
    enableLeadCapture: true,
    leadCaptureFields: ['name', 'phone', 'email'],
    showTestimonials: true,
    showPromos: true,
    leadCaptureAfterTurn: 3,
    fallbackBehavior: 'quick_actions' as const,
  };

  if (flow) {
    // ---- Flow-definition mode ----

    // 5. Find current stage or entry stage
    let currentStage = flow.stages.find((st) => st.id === s.currentStageId);
    if (!currentStage) {
      currentStage = flow.stages.find((st) => st.isEntry) ?? flow.stages[0];
    }

    // 6. Check transitions for intent match
    const possibleTransitions = flow.transitions
      .filter((t) => t.from === currentStage!.id && t.trigger === detectedIntent)
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    if (possibleTransitions.length > 0) {
      const transition = possibleTransitions[0];
      const targetStage = flow.stages.find((st) => st.id === transition.to);
      if (targetStage) {
        currentStage = targetStage;
      }
    }

    // 7-8. Update state with current stage
    s.currentStageId = currentStage.id;
    s.currentStageType = currentStage.type;
    stageType = currentStage.type;
    s.leadScore += currentStage.leadScoreImpact;

    // Track visited stages
    if (!s.visitedStages.includes(currentStage.id)) {
      s.visitedStages.push(currentStage.id);
    }
    s.stageVisitCounts[currentStage.id] = (s.stageVisitCounts[currentStage.id] ?? 0) + 1;

    // 9. Get block types from stage
    blockTypes = [...currentStage.blockTypes];
  } else {
    // ---- Intent-only mode ----

    // 5. Map intent → stage type
    stageType = INTENT_TO_STAGE[detectedIntent];
    s.currentStageType = stageType;

    // 6. Get block types from taxonomy
    const mapping = getBlockMappingForFunction(functionId);
    const allBlocks = [...mapping.primaryBlocks, ...mapping.secondaryBlocks];
    const relevantBlocks = STAGE_BLOCK_RELEVANCE[stageType] ?? [];

    // Filter taxonomy blocks by stage relevance
    blockTypes = allBlocks.filter((b) => relevantBlocks.includes(b));

    // If no overlap, fall back to relevant blocks directly
    if (blockTypes.length === 0) {
      blockTypes = relevantBlocks.slice(0, 3);
    }

    // 7. Apply lead score
    s.leadScore += STAGE_SCORE_MAP[stageType] ?? 0;

    // Track stage visits
    const stageKey = `intent_${stageType}`;
    if (!s.visitedStages.includes(stageKey)) {
      s.visitedStages.push(stageKey);
    }
    s.stageVisitCounts[stageKey] = (s.stageVisitCounts[stageKey] ?? 0) + 1;
  }

  // ---- Common logic ----

  // 10. Calculate lead temperature
  s.leadTemperature = calculateLeadTemperature(s.leadScore);

  // 11. Check handoff
  const shouldHandoff =
    s.leadScore >= settings.handoffThreshold ||
    s.interactionCount >= settings.maxTurnsBeforeHandoff ||
    s.handoffRequested;

  // 12. Check lead capture
  const shouldCaptureLeads =
    settings.enableLeadCapture &&
    s.interactionCount >= settings.leadCaptureAfterTurn &&
    Object.keys(s.capturedData).length === 0;

  // 13. Check promo / testimonials
  const hasVisitedShowcase = s.visitedStages.some(
    (v) => v.includes('showcase') || v.includes('promo')
  );
  const hasVisitedSocialProof = s.visitedStages.some(
    (v) => v.includes('social_proof') || v.includes('testimonial')
  );
  const shouldShowPromo = settings.showPromos && !hasVisitedShowcase;
  const shouldShowTestimonials = settings.showTestimonials && !hasVisitedSocialProof;

  // 14. Build context for AI
  const contextForAI = `FLOW CONTEXT:
- Current conversation stage: ${stageType}
- Preferred block types: ${blockTypes.join(', ')}
- Visitor lead temperature: ${s.leadTemperature}
- Items viewed: ${s.itemsViewed.length}
- Items compared: ${s.itemsCompared.length}
- Turn count: ${s.interactionCount}
- Should capture lead info: ${shouldCaptureLeads}
- Should suggest handoff to human: ${shouldHandoff}

IMPORTANT: Choose your response block type from the preferred list above. Adjust tone based on lead temperature (cold=informative, warm=enthusiastic, hot=action-oriented).`;

  // 15. Return decision
  return {
    suggestedStageType: stageType,
    suggestedBlockTypes: blockTypes,
    leadScore: s.leadScore,
    leadTemperature: s.leadTemperature,
    shouldHandoff,
    shouldCaptureLeads,
    shouldShowPromo,
    shouldShowTestimonials,
    contextForAI,
    updatedState: s,
  };
}
