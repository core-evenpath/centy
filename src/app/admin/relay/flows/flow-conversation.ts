import type { ComponentType } from 'react';
import { getBlocksForFunction, getSubVertical } from '../blocks/previews/registry';
import { buildFlowSync, STAGE_ORDER } from './flow-helpers';
import type { VerticalBlockDef } from '../blocks/previews/_types';
import type { SystemFlowTemplate } from '@/lib/types-flow-engine';
import type { FlowScenario } from '@/lib/types-flow-scenarios';

export interface FlowMessage {
  id: string;
  type: 'user' | 'bot' | 'stage-divider';
  text?: string;
  blockPreviews?: ComponentType[];
  stage?: string;
  suggestions?: string[];
}

const USER_MSG: Record<string, string> = {
  discovery: 'What do you offer?',
  showcase: 'Tell me more about that — what are the prices?',
  comparison: 'Can you compare the options for me?',
  social_proof: 'What do your customers say?',
  conversion: "I'd like to book / get started",
  objection: "What's your cancellation policy?",
  handoff: 'Can I speak to someone?',
  followup: "What's the status of my order?",
};

const BOT_MSG: Record<string, string> = {
  greeting: 'Welcome! How can we help you today?',
  discovery: "Here's what we have for you:",
  showcase: 'Great choice — here are the details:',
  comparison: 'Here is a side-by-side comparison:',
  social_proof: 'Our customers love us — see for yourself:',
  conversion: "Let's get you set up:",
  objection: 'Here are our policies:',
  handoff: "I'll connect you with our team:",
  followup: "Here's your latest update:",
};

const CHIP_LABELS: Record<string, string> = {
  browsing: 'Browse more', comparing: 'Compare options', pricing: 'See prices',
  booking: 'Book now', inquiry: 'Learn more', complaint: 'Report issue',
  returning: 'My orders', urgent: 'Urgent help', location: 'Get directions',
  contact: 'Talk to someone', promo: 'See offers', schedule: 'Check schedule',
};

/** Default conversation: walks through all stages with hardcoded text. */
export function generateConversation(functionId: string, template?: SystemFlowTemplate | null): FlowMessage[] {
  const result = getSubVertical(functionId);
  if (!result) return [];

  const { subVertical } = result;
  const blocks = getBlocksForFunction(functionId);
  const flow = template || buildFlowSync(functionId);
  if (!flow) return [];

  const byStage = groupByStage(blocks);
  const messages: FlowMessage[] = [];
  let idx = 0;

  for (const st of STAGE_ORDER) {
    const sb = byStage[st];
    if (!sb?.length) continue;
    messages.push({ id: `m${idx++}`, type: 'stage-divider', stage: st, text: st.replace(/_/g, ' ') });
    if (st !== 'greeting') messages.push({ id: `m${idx++}`, type: 'user', text: USER_MSG[st] || `Tell me about ${st.replace(/_/g, ' ')}`, stage: st });
    const chips = getTransitionChips(flow, st);
    messages.push({ id: `m${idx++}`, type: 'bot', text: BOT_MSG[st] || `Here's what we have for ${subVertical.name}:`, blockPreviews: sb.slice(0, 2).map(b => b.preview), stage: st, suggestions: chips.length ? chips : undefined });
    if (sb.length > 2) messages.push({ id: `m${idx++}`, type: 'bot', text: 'And more options:', blockPreviews: sb.slice(2, 4).map(b => b.preview), stage: st });
  }
  return messages;
}

/** Scenario-driven conversation: uses AI-generated text, only active stages. */
export function generateConversationFromScenario(
  functionId: string, scenario: FlowScenario, template?: SystemFlowTemplate | null,
): FlowMessage[] {
  const result = getSubVertical(functionId);
  if (!result) return [];

  const blocks = getBlocksForFunction(functionId);
  const flow = template || buildFlowSync(functionId);
  if (!flow) return [];

  const byStage = groupByStage(blocks);
  const activeSet = new Set(scenario.activeStages);
  const messages: FlowMessage[] = [];
  let idx = 0;

  for (const st of STAGE_ORDER) {
    if (!activeSet.has(st)) continue;
    const sb = byStage[st];
    if (!sb?.length) continue;

    const sc = scenario.stageMessages[st];
    messages.push({ id: `m${idx++}`, type: 'stage-divider', stage: st, text: st.replace(/_/g, ' ') });

    if (st !== 'greeting') {
      messages.push({ id: `m${idx++}`, type: 'user', text: sc?.userMessage || USER_MSG[st] || `Tell me about ${st.replace(/_/g, ' ')}`, stage: st });
    }

    let chips = sc?.chipLabels?.slice(0, 3) || [];
    if (!chips.length) chips = getTransitionChips(flow, st);

    messages.push({ id: `m${idx++}`, type: 'bot', text: sc?.botMessage || BOT_MSG[st] || "Here's what we have:", blockPreviews: sb.slice(0, 2).map(b => b.preview), stage: st, suggestions: chips.length ? chips : undefined });
    if (sb.length > 2) messages.push({ id: `m${idx++}`, type: 'bot', text: 'And more options:', blockPreviews: sb.slice(2, 4).map(b => b.preview), stage: st });
  }
  return messages;
}

function groupByStage(blocks: VerticalBlockDef[]): Record<string, VerticalBlockDef[]> {
  const m: Record<string, VerticalBlockDef[]> = {};
  for (const b of blocks) { if (!m[b.stage]) m[b.stage] = []; m[b.stage].push(b); }
  return m;
}

function getTransitionChips(flow: SystemFlowTemplate, stageType: string): string[] {
  const stageObj = flow.stages.find(s => s.type === stageType);
  if (!stageObj) return [];
  return flow.transitions.filter(t => t.from === stageObj.id)
    .map(t => CHIP_LABELS[t.trigger]).filter((v, i, a) => v && a.indexOf(v) === i).slice(0, 3);
}
