import type { FlowStageType } from './types-flow-engine';

/**
 * A single customer journey scenario for a sub-vertical.
 * Each sub-vertical has 10+ scenarios representing different customer intents.
 * Stored in Firestore: flowScenarios/{functionId}/scenarios/{id}
 * Designed for RAG: each doc is independently embeddable.
 */
export interface FlowScenario {
  id: string;                     // e.g. "dental_care__emergency_toothache"
  functionId: string;             // e.g. "dental_care"
  name: string;                   // e.g. "Emergency Toothache Visit"
  description: string;            // 1-2 sentence summary of the journey
  customerProfile: string;        // persona description for RAG context
  tags: string[];                 // searchable keywords for RAG retrieval
  activeStages: FlowStageType[];  // only stages this scenario touches
  stageMessages: Record<string, {
    userMessage: string;
    botMessage: string;
    chipLabels: string[];
  }>;
  priority: number;               // display order (1 = most common)
  generatedAt: string;
  modelUsed: string;
}

/** Lightweight list item (no stageMessages) for picker UI. */
export interface FlowScenarioSummary {
  id: string;
  name: string;
  description: string;
  tags: string[];
  activeStages: FlowStageType[];
  priority: number;
}

/** Result of fetching scenarios for a sub-vertical. */
export interface ScenariosResult {
  success: boolean;
  scenarios: FlowScenario[];
  error?: string;
}

/** Result of generating scenarios. */
export interface GenerateScenariosResult {
  success: boolean;
  count: number;
  error?: string;
}
