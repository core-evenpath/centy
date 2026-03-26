export type FlowStageType =
  | 'greeting'
  | 'discovery'
  | 'showcase'
  | 'comparison'
  | 'social_proof'
  | 'conversion'
  | 'objection'
  | 'handoff'
  | 'followup';

export type IntentSignal =
  | 'browsing'
  | 'comparing'
  | 'pricing'
  | 'booking'
  | 'inquiry'
  | 'complaint'
  | 'returning'
  | 'urgent'
  | 'location'
  | 'contact'
  | 'promo'
  | 'schedule';

export type LeadTemperature = 'cold' | 'warming' | 'warm' | 'hot' | 'converted';

export interface FlowStage {
  id: string;
  type: FlowStageType;
  label: string;
  description?: string;
  blockTypes: string[];
  triggerIntents: IntentSignal[];
  exitIntents: IntentSignal[];
  isEntry?: boolean;
  isExit?: boolean;
  maxVisits?: number;
  leadScoreImpact: number;
}

export interface FlowTransition {
  fromStageId: string;
  toStageId: string;
  condition: IntentSignal | 'auto' | 'fallback';
  priority: number;
}

export interface FlowDefinition {
  id: string;
  name: string;
  description?: string;
  industryId: string;
  functionId: string;
  stages: FlowStage[];
  transitions: FlowTransition[];
  settings: FlowSettings;
  status: 'draft' | 'active' | 'archived';
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface FlowSettings {
  handoffThreshold: number;
  maxTurnsBeforeHandoff: number;
  enableLeadCapture: boolean;
  leadCaptureFields: string[];
  enablePromos: boolean;
  promoTriggerStage?: FlowStageType;
  enableTestimonials: boolean;
  testimonialTriggerAfter?: number;
  fallbackBehavior: 'text' | 'quick_actions' | 'handoff';
}

export interface ConversationFlowState {
  conversationId: string;
  partnerId: string;
  flowId?: string;
  currentStageId?: string;
  currentStageType: FlowStageType;
  visitedStages: string[];
  stageVisitCounts: Record<string, number>;
  intentHistory: IntentSignal[];
  currentIntent: IntentSignal;
  leadScore: number;
  leadTemperature: LeadTemperature;
  itemsViewed: string[];
  itemsCompared: string[];
  interactionCount: number;
  lastBlockType: string;
  capturedData: Record<string, string>;
  handoffRequested: boolean;
  convertedAt?: string;
  startedAt: string;
  lastActivityAt: string;
}

export interface FlowEngineDecision {
  suggestedStageType: FlowStageType;
  suggestedBlockTypes: string[];
  leadScore: number;
  leadTemperature: LeadTemperature;
  shouldHandoff: boolean;
  shouldCaptureLeads: boolean;
  shouldShowPromo: boolean;
  shouldShowTestimonials: boolean;
  contextForAI: string;
  updatedState: ConversationFlowState;
}

export interface SystemFlowTemplate {
  id: string;
  name: string;
  industryId: string;
  functionId: string;
  industryName: string;
  functionName: string;
  stages: FlowStage[];
  transitions: FlowTransition[];
  settings: FlowSettings;
  description: string;
}
