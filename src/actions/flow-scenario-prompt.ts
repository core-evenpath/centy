/**
 * Builds a deeply sub-vertical-specific Gemini prompt for generating
 * 10 distinct customer journey scenarios. Uses block-level differentiation
 * and sibling awareness to ensure no two sub-verticals produce similar output.
 */

import type { GenerateContext } from './flow-scenario-actions';

export function buildScenariosPrompt(ctx: GenerateContext): string {
  const { subVerticalName, verticalName, industryId, stageBlocks, siblings, uniqueBlocks, missingBlocks } = ctx;
  const availableStages = stageBlocks.map(s => s.stage);

  // Separate unique (vertical-specific) blocks from shared/generic ones
  const unique = stageBlocks.flatMap(s => s.blocks.filter(b => !b.isShared).map(b => ({ ...b, stage: s.stage })));
  const shared = stageBlocks.flatMap(s => s.blocks.filter(b => b.isShared).map(b => ({ ...b, stage: s.stage })));

  const uniqueList = unique
    .map(b => `  • [${b.stage}] ${b.label} — ${b.desc}\n    Customer says: "${b.intents.slice(0, 3).join('", "')}"`)
    .join('\n');

  const sharedList = shared.map(b => `  • [${b.stage}] ${b.label}`).join('\n');

  // Sibling differentiation section
  let diffSection = '';
  if (siblings.length > 0) {
    diffSection += `\n═══ COMPETITIVE DIFFERENTIATION ═══\n`;
    diffSection += `"${subVerticalName}" sits alongside these siblings in ${verticalName}:\n`;
    diffSection += siblings.map(s => `  • ${s}`).join('\n');
    diffSection += `\n\nYour scenarios must be CLEARLY DIFFERENT from what these siblings would produce.\n`;

    if (uniqueBlocks.length > 0) {
      diffSection += `\n"${subVerticalName}" has these EXCLUSIVE capabilities (no sibling has them):\n`;
      diffSection += uniqueBlocks.map(b => `  ★ ${b}`).join('\n');
      diffSection += `\n→ At least 3 scenarios MUST heavily feature these unique capabilities.\n`;
    }

    if (missingBlocks.length > 0) {
      diffSection += `\n"${subVerticalName}" intentionally LACKS (siblings have, but this doesn't):\n`;
      diffSection += missingBlocks.map(b => `  ✗ ${b}`).join('\n');
      diffSection += `\n→ This tells you what this business model does NOT do. Never reference these.\n`;
    }
  }

  return `You are generating customer journey scenarios for a "${subVerticalName}" business.
Industry: ${verticalName} | Sector: ${industryId}

CRITICAL: Every scenario name, message, and chip label must use terminology ONLY a real "${subVerticalName}" would use. If swapping the business name with a sibling (like "${siblings[0] || 'another business'}") still makes the scenario work, it's too generic. Rewrite it.

═══ THIS BUSINESS'S UI CAPABILITIES ═══
${uniqueList}

═══ GENERIC / SHARED BLOCKS ═══
${sharedList}

AVAILABLE STAGES: ${availableStages.join(', ')}
${diffSection}
═══ SCENARIO REQUIREMENTS ═══

Generate exactly 10 scenarios. Each must pass the "would this ONLY happen at a ${subVerticalName}?" test:

NAMING: Use ${subVerticalName}-specific nouns and verbs. Bad: "Premium Customer Inquiry". Good examples by type:
  - Hotel: "Honeymoon Suite Upgrade Request", "Late Night Room Service Craving"
  - Dental: "Wisdom Tooth Extraction Consult", "Kids' First Cavity Filling"
  - Gym: "Post-Injury Rehab Program", "6AM HIIT Class Waitlist"

MESSAGES: Reference specific products, prices, features of a ${subVerticalName}:
  - userMessage: What the customer actually types (colloquial, not formal)
  - botMessage: How the business responds (with specific offerings, not vague platitudes)
  - chipLabels: Next actions specific to this business (2-4 per stage)

STAGES: Each scenario uses 2-6 of the available stages. "greeting" is always first.
  - Vary stage combinations across scenarios (don't repeat the same pattern)
  - Short journeys (2-3 stages) for quick transactions
  - Longer journeys (5-6 stages) for complex decisions

PERSONAS: Include age, occupation, and a SPECIFIC ${subVerticalName} motivation:
  - Bad: "35yo professional looking for services"
  - Good: "28yo bride-to-be comparing garden ceremony vs ballroom reception for 120 guests"

VARIETY across the 10 scenarios:
  - 2 high-urgency / time-sensitive scenarios
  - 2 casual browsing / research-phase scenarios
  - 2 price-sensitive / budget-conscious scenarios
  - 2 premium / high-value scenarios
  - 2 returning customer / loyalty scenarios

TAGS: 3-6 keywords that are RAG-searchable and ${subVerticalName}-specific.

Return ONLY valid JSON:
{
  "scenarios": [
    {
      "name": "Specific ${subVerticalName} Scenario",
      "description": "1-2 sentences with ${subVerticalName} specifics",
      "customerProfile": "Age, job, specific motivation for visiting a ${subVerticalName}",
      "tags": ["specific-keyword-1", "keyword-2", "keyword-3"],
      "activeStages": ["greeting", "discovery", ...],
      "priority": 1,
      "stageMessages": {
        "greeting": { "userMessage": "", "botMessage": "Contextual welcome", "chipLabels": ["Action 1", "Action 2"] },
        "discovery": { "userMessage": "Real customer question", "botMessage": "Specific response", "chipLabels": ["CTA 1", "CTA 2"] }
      }
    }
  ]
}`;
}
