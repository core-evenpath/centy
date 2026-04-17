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
  intentTriggers: IntentSignal[];
  leadScoreImpact: number;
  isEntry?: boolean;
  isExit?: boolean;
}

export interface FlowTransition {
  from: string;
  to: string;
  trigger: IntentSignal;
  priority?: number;
}

export interface FlowSettings {
  handoffThreshold: number;
  maxTurnsBeforeHandoff: number;
  enableLeadCapture: boolean;
  leadCaptureFields: string[];
  showTestimonials: boolean;
  showPromos: boolean;
  leadCaptureAfterTurn: number;
  fallbackBehavior: 'text' | 'quick_actions' | 'handoff';
}

export interface FlowDefinition {
  id: string;
  name: string;
  partnerId: string;
  industryId: string;
  functionId: string;
  stages: FlowStage[];
  transitions: FlowTransition[];
  settings: FlowSettings;
  status: 'active' | 'draft';
  sourceTemplateId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  // Engine scoping (M02). Optional; absent flows fall through to legacy
  // function-scoped template resolution. Populated by M05 for booking flows.
  engine?: import('./relay/engine-types').Engine;
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

export interface SystemFlowTemplateRecord extends SystemFlowTemplate {
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  status: 'active' | 'draft' | 'archived';
}
