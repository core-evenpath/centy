export interface ScenarioMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp?: number;
}

export interface Scenario {
  id: string;
  partnerId: string;
  title: string;
  description?: string;
  vertical?: string;
  messages: ScenarioMessage[];
  createdAt: number;
  updatedAt: number;
}

export type ScenarioInput = Omit<Scenario, 'id' | 'createdAt' | 'updatedAt'>;
