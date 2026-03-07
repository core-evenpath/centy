import type { RelayConfig, RelayBlockConfig, RelayUIBlock, RelayConversation, RelayBlockType } from './types-relay';

/**
 * Builds the full system prompt for Relay AI responses.
 * Combines: partner's custom prompt + block type fragments + vault context instruction.
 */
export function buildRelaySystemPrompt(
  relayConfig: RelayConfig,
  blockConfigs: RelayBlockConfig[]
): string {
  const blockTypeInstructions = blockConfigs
    .filter(bc => bc.status === 'active')
    .map(bc => `- ${bc.blockType.toUpperCase()}: ${bc.aiPromptFragment}`)
    .join('\n');

  const baseSystemPrompt = relayConfig.systemPrompt ||
    `You are a helpful assistant for ${relayConfig.brandName}. ${relayConfig.brandTagline || ''}
Answer questions based on the provided knowledge base documents.
Be friendly, concise, and helpful. Always recommend the best option for the visitor's needs.`;

  const enabledIntents = relayConfig.intents
    .filter(i => i.enabled)
    .map(i => `- "${i.label}" (${i.icon}): "${i.prompt}" → respond with ${i.uiBlock} block`)
    .join('\n');

  return `${baseSystemPrompt}

## Available UI Blocks
When responding, you MUST return a JSON object with this structure:
{
  "type": "<block_type>",
  "text": "<your natural language response>",
  "items": [...],  // optional structured data
  "suggestions": ["Follow-up question 1", "Follow-up question 2"]  // optional
}

Valid block types and when to use them:
${blockTypeInstructions || `
- rooms: When asked about rooms, accommodation, or pricing
- book: When visitor wants to make a booking or reservation
- activities: When asked about activities, experiences, or services
- location: When asked about location, directions, or address
- contact: When visitor wants to speak with staff or get contact info
- compare: When comparing multiple options side by side
- gallery: When showing photos or visual content
- info: When providing general information in key-value format
- menu: When showing food/beverage items with pricing
- services: When listing services with pricing
- text: For general conversational responses`}

## Intent Mappings
${enabledIntents || 'Respond naturally to any visitor question.'}

## Critical Rules
1. ALWAYS respond with valid JSON matching the structure above
2. Keep "text" concise and friendly (2-4 sentences max)
3. Always include 2-3 relevant "suggestions" to guide the conversation
4. Use "text" block type for general questions
5. Base all answers on the knowledge base documents provided
6. If information is not in the knowledge base, say so honestly and offer to connect them with staff`;
}

/**
 * Parses the AI's raw JSON response into a RelayUIBlock.
 * Falls back to a text block if parsing fails.
 */
export function parseRelayAIResponse(raw: string): RelayUIBlock {
  try {
    // Strip markdown code blocks if present
    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    const validTypes: RelayBlockType[] = [
      'rooms', 'book', 'compare', 'activities', 'location',
      'contact', 'gallery', 'info', 'menu', 'services', 'text'
    ];

    const type: RelayBlockType = validTypes.includes(parsed.type) ? parsed.type : 'text';

    return {
      type,
      text: typeof parsed.text === 'string' ? parsed.text : raw,
      items: Array.isArray(parsed.items) ? parsed.items : undefined,
      suggestions: Array.isArray(parsed.suggestions)
        ? parsed.suggestions.filter((s: unknown) => typeof s === 'string').slice(0, 4)
        : undefined,
    };
  } catch {
    // Fallback: return as plain text block
    return {
      type: 'text',
      text: raw,
      suggestions: ['Tell me more', 'What else can I ask?', 'Connect me with staff'],
    };
  }
}

/**
 * Calculates a lead score based on conversation signals.
 */
export function calculateLeadScore(conversation: RelayConversation): 'cold' | 'warm' | 'hot' {
  const signals = conversation.intentSignals || [];
  const messageCount = conversation.messageCount || 0;
  const hasContact = !!conversation.visitorContact;
  const hasConversion = !!conversation.convertedAt;

  if (hasConversion || hasContact) return 'hot';

  let score = 0;
  score += Math.min(signals.length * 2, 6);
  score += Math.min(messageCount, 5);

  if (signals.includes('book') || signals.includes('rooms')) score += 3;
  if (signals.includes('contact')) score += 2;
  if (signals.includes('compare')) score += 2;

  if (score >= 8) return 'hot';
  if (score >= 4) return 'warm';
  return 'cold';
}
