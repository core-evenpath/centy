/**
 * Builds the Gemini prompt for generating 10 distinct customer journey
 * scenarios for a given sub-vertical. Runs server-side only.
 */

interface StageBlockInfo {
  stage: string;
  blockLabels: string[];
}

export function buildScenariosPrompt(
  subVerticalName: string,
  industryName: string,
  stageBlocks: StageBlockInfo[],
  availableStages: string[],
): string {
  const stageList = stageBlocks
    .map(s => `  - ${s.stage}: ${s.blockLabels.join(', ')}`)
    .join('\n');

  return `You are a market research expert generating realistic customer interaction scenarios for a "${subVerticalName}" business in the "${industryName}" industry.

AVAILABLE CONVERSATION STAGES AND THEIR UI BLOCKS:
${stageList}

AVAILABLE STAGES: ${availableStages.join(', ')}

Generate exactly 10 DISTINCT customer journey scenarios. Each scenario represents a different real-world customer need or situation. Examples of what makes scenarios distinct:
- Different customer intents (browsing vs urgent need vs returning customer)
- Different entry points (price inquiry vs product question vs complaint)
- Different journey lengths (quick 2-stage vs full 6-stage journey)
- Different personas (first-timer, budget-conscious, premium, business buyer, etc.)

RULES:
1. Each scenario must have a unique, descriptive name (e.g., "Emergency Repair Request", "Price-Conscious First Timer")
2. Each scenario should only use a SUBSET of available stages (2-6 stages, not all stages every time)
3. "greeting" stage must always be included as the first active stage
4. customerProfile should be a realistic persona (age range, motivation, context)
5. tags should include 3-6 searchable keywords useful for RAG retrieval
6. stageMessages: only include entries for stages listed in activeStages
7. For greeting stage, only botMessage (the bot speaks first, no userMessage needed)
8. Messages must use industry-specific terminology for ${subVerticalName}
9. priority: 1 = most common scenario, 10 = least common
10. description: 1-2 sentences summarizing the customer journey

Return ONLY valid JSON matching this exact structure:
{
  "scenarios": [
    {
      "name": "Scenario Name",
      "description": "Brief journey summary",
      "customerProfile": "Persona description",
      "tags": ["tag1", "tag2", "tag3"],
      "activeStages": ["greeting", "discovery", "conversion"],
      "priority": 1,
      "stageMessages": {
        "greeting": { "userMessage": "", "botMessage": "Welcome message", "chipLabels": ["Browse", "Quick help"] },
        "discovery": { "userMessage": "Customer asks...", "botMessage": "Bot responds...", "chipLabels": ["Option A", "Option B"] },
        "conversion": { "userMessage": "Customer decides...", "botMessage": "Bot helps...", "chipLabels": ["Confirm", "Edit"] }
      }
    }
  ]
}`;
}
