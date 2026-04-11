/**
 * Builds a highly sub-vertical-specific Gemini prompt for generating
 * 10 distinct customer journey scenarios. Runs server-side only.
 */

import type { BlockInfo } from './flow-scenario-actions';

interface StageBlockInfo {
  stage: string;
  blocks: BlockInfo[];
}

export function buildScenariosPrompt(
  subVerticalName: string,
  industryName: string,
  industryId: string,
  stageBlocks: StageBlockInfo[],
  availableStages: string[],
): string {
  // Separate unique (vertical-specific) blocks from shared/generic ones
  const uniqueBlocks = stageBlocks
    .flatMap(s => s.blocks.filter(b => !b.isShared).map(b => ({ ...b, stage: s.stage })));
  const sharedBlocks = stageBlocks
    .flatMap(s => s.blocks.filter(b => b.isShared).map(b => ({ ...b, stage: s.stage })));

  const uniqueList = uniqueBlocks
    .map(b => `  • [${b.stage}] ${b.label}: ${b.desc}${b.intents.length ? ` (triggers: "${b.intents.join('", "')}")` : ''}`)
    .join('\n');

  const sharedList = sharedBlocks
    .map(b => `  • [${b.stage}] ${b.label}: ${b.desc}`)
    .join('\n');

  // Collect all unique intents for context
  const allIntents = [...new Set(uniqueBlocks.flatMap(b => b.intents))];

  return `You are generating customer journey scenarios specifically for a "${subVerticalName}" business (industry: ${industryName}, sector: ${industryId}).

IMPORTANT: These scenarios must be HIGHLY SPECIFIC to ${subVerticalName}. Use real product names, services, price points, and terminology that ONLY a ${subVerticalName} business would use. Do NOT generate generic customer service scenarios.

═══ UNIQUE UI BLOCKS (specific to ${subVerticalName}) ═══
${uniqueList}

═══ SHARED BLOCKS (available to all businesses) ═══
${sharedList}

═══ CUSTOMER INTENT VOCABULARY for ${subVerticalName} ═══
${allIntents.length ? allIntents.join(', ') : 'general inquiries'}

AVAILABLE STAGES: ${availableStages.join(', ')}

═══ REQUIREMENTS ═══
Generate exactly 10 DISTINCT scenarios. Each must feel like a real ${subVerticalName} customer interaction:

1. NAMES: Use specific ${subVerticalName} terminology (e.g., for a dental clinic: "Emergency Wisdom Tooth", not "Urgent Customer Request")
2. STAGE SUBSETS: Each scenario uses 2-6 stages (NOT all stages). "greeting" is always first. Different scenarios should use different stage combinations.
3. MESSAGES: Every userMessage and botMessage must reference specific ${subVerticalName} products, services, prices, or features. Never use generic phrases like "I'm interested in your services" — instead use real queries like what an actual customer would type.
4. CUSTOMER PROFILES: Include age, occupation, specific motivation tied to ${subVerticalName} (e.g., "34yo marketing manager planning team dinner for 12" not "adult looking for options")
5. CHIP LABELS: Use ${subVerticalName}-specific actions (e.g., for hotel: "Check Rates", "Room Tour", "Add Breakfast" — not "Learn More", "Continue")
6. TAGS: Include ${subVerticalName}-specific keywords useful for search/RAG retrieval
7. VARIETY: Mix urgency levels (casual browser → urgent need), budgets (budget → premium), customer types (first-timer → loyal regular → business buyer)
8. For greeting stage, only botMessage (bot speaks first), and personalize it to the scenario context
9. priority: 1 = most common scenario for ${subVerticalName}, 10 = least common

Return ONLY valid JSON matching this structure:
{
  "scenarios": [
    {
      "name": "Specific Scenario Name",
      "description": "1-2 sentence summary with ${subVerticalName}-specific details",
      "customerProfile": "Detailed persona with age, job, specific ${subVerticalName} motivation",
      "tags": ["${subVerticalName.toLowerCase()}-specific", "tag2", "tag3"],
      "activeStages": ["greeting", "discovery", "conversion"],
      "priority": 1,
      "stageMessages": {
        "greeting": { "userMessage": "", "botMessage": "Welcome message mentioning ${subVerticalName}", "chipLabels": ["${subVerticalName}-specific action 1", "Action 2"] },
        "discovery": { "userMessage": "Realistic ${subVerticalName} question", "botMessage": "Detailed response with ${subVerticalName} specifics", "chipLabels": ["Specific CTA", "Option"] },
        "conversion": { "userMessage": "Decision message", "botMessage": "Closing with ${subVerticalName} details", "chipLabels": ["Confirm", "Modify"] }
      }
    }
  ]
}`;
}
