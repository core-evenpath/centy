import type { RelayConfig, RelayBlockConfig, RelayConversation, RelayUIBlock } from './types-relay';

export function buildRelaySystemPrompt(
  relayConfig: RelayConfig,
  blockConfigs: RelayBlockConfig[]
): string {
  const brandName = relayConfig.brandName || 'this business';

  const basePrompt =
    relayConfig.systemPrompt ||
    `You are a helpful AI assistant for ${brandName}. ${relayConfig.brandTagline ? relayConfig.brandTagline + '.' : ''}
Answer visitor questions using the knowledge base provided. Be friendly, concise, and helpful.
Only answer based on available information — if you don't know, say so honestly.`;

  const blockFragments = blockConfigs
    .filter((b) => b.status === 'active' && b.aiPromptFragment)
    .map((b) => `[${b.blockType.toUpperCase()} BLOCK — ${b.label}]: ${b.aiPromptFragment}`)
    .join('\n');

  const intentMappings = relayConfig.intents
    .filter((i) => i.enabled)
    .map((i) => `- "${i.prompt}" → respond with ${i.uiBlock} block type`)
    .join('\n');

  const responseFormat = `
RESPONSE FORMAT:
Always respond with valid JSON in this exact format:
{
  "type": "<block_type>",
  "text": "<main response text>",
  "items": [<optional array of relevant items>],
  "suggestions": ["<follow-up question 1>", "<follow-up question 2>"]
}

Block types: rooms, book, compare, activities, location, contact, gallery, info, menu, services, text

Choose the most appropriate block type based on the query. Default to "text" if unsure.
Keep suggestions to 2-3 short follow-up questions the visitor might ask.`;

  const parts = [
    basePrompt,
    blockFragments ? `\nBLOCK INSTRUCTIONS:\n${blockFragments}` : '',
    intentMappings ? `\nINTENT MAPPINGS:\n${intentMappings}` : '',
    responseFormat,
  ].filter(Boolean);

  return parts.join('\n\n');
}

export function parseRelayAIResponse(raw: string): RelayUIBlock {
  try {
    // Extract JSON from potential markdown code blocks
    let jsonStr = raw.trim();
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);
    return {
      type: parsed.type || 'text',
      text: parsed.text || raw,
      items: Array.isArray(parsed.items) ? parsed.items : undefined,
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    };
  } catch {
    // Fallback to plain text
    return {
      type: 'text',
      text: raw,
      suggestions: [],
    };
  }
}

export function calculateLeadScore(
  conversation: RelayConversation
): 'cold' | 'warm' | 'hot' {
  // hot: contact info shared OR booking flow completed
  if (conversation.visitorContact) return 'hot';
  if (conversation.conversionType === 'direct_book' || conversation.conversionType === 'whatsapp') {
    return 'hot';
  }

  // warm: 3+ intents triggered OR 5+ messages
  if ((conversation.intentSignals?.length || 0) >= 3) return 'warm';
  if ((conversation.messageCount || 0) >= 5) return 'warm';

  return 'cold';
}
