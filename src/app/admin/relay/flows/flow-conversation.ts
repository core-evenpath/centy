import type { ComponentType } from 'react';
import { getBlocksForFunction, getSubVertical } from '../blocks/previews/registry';
import { buildFlowSync, STAGE_ORDER } from './flow-helpers';
import type { VerticalBlockDef } from '../blocks/previews/_types';

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
  browsing: 'Browse more',
  comparing: 'Compare options',
  pricing: 'See prices',
  booking: 'Book now',
  inquiry: 'Learn more',
  complaint: 'Report issue',
  returning: 'My orders',
  urgent: 'Urgent help',
  location: 'Get directions',
  contact: 'Talk to someone',
  promo: 'See offers',
  schedule: 'Check schedule',
};

export function generateConversation(functionId: string): FlowMessage[] {
  const result = getSubVertical(functionId);
  if (!result) return [];

  const { subVertical } = result;
  const blocks = getBlocksForFunction(functionId);
  const flow = buildFlowSync(functionId);
  if (!flow) return [];

  const blocksByStage: Record<string, VerticalBlockDef[]> = {};
  for (const b of blocks) {
    if (!blocksByStage[b.stage]) blocksByStage[b.stage] = [];
    blocksByStage[b.stage].push(b);
  }

  const messages: FlowMessage[] = [];
  let idx = 0;

  for (const stageType of STAGE_ORDER) {
    const stageBlocks = blocksByStage[stageType];
    if (!stageBlocks?.length) continue;

    // Stage divider
    messages.push({ id: `m${idx++}`, type: 'stage-divider', stage: stageType, text: stageType.replace(/_/g, ' ') });

    // User message (skip for greeting)
    if (stageType !== 'greeting') {
      const userText = USER_MSG[stageType] || `Tell me about ${stageType.replace(/_/g, ' ')}`;
      messages.push({ id: `m${idx++}`, type: 'user', text: userText, stage: stageType });
    }

    // Bot message with block previews (max 2 per message)
    const previews = stageBlocks.slice(0, 2).map(b => b.preview);
    const botText = BOT_MSG[stageType] || `Here's what we have for ${subVertical.name}:`;

    // Find suggestion chips from transitions leaving this stage
    const stageObj = flow.stages.find(s => s.type === stageType);
    const outgoing = stageObj ? flow.transitions.filter(t => t.from === stageObj.id) : [];
    const chips = outgoing
      .map(t => CHIP_LABELS[t.trigger])
      .filter((v, i, a) => v && a.indexOf(v) === i)
      .slice(0, 3);

    messages.push({
      id: `m${idx++}`,
      type: 'bot',
      text: botText,
      blockPreviews: previews,
      stage: stageType,
      suggestions: chips.length > 0 ? chips : undefined,
    });

    // Extra bot message if more than 2 blocks
    if (stageBlocks.length > 2) {
      const extraPreviews = stageBlocks.slice(2, 4).map(b => b.preview);
      messages.push({
        id: `m${idx++}`,
        type: 'bot',
        text: 'And more options:',
        blockPreviews: extraPreviews,
        stage: stageType,
      });
    }
  }

  return messages;
}
