import type { BlockResolution } from './block-resolver';

export interface RelayPromptInput {
  brandName: string;
  brandTagline: string;
  industryId?: string;
  businessContext: string;
  customerMessage: string;
  conversationHistory: ConversationMessage[];
  blockResolution: BlockResolution | null;
  maxHistoryMessages?: number;
}

export interface ConversationMessage {
  role: 'customer' | 'assistant';
  text: string;
}

export interface BuiltPrompt {
  systemPrompt: string;
  userPrompt: string;
  estimatedTokens: number;
}

function summarizeBlockContext(resolution: BlockResolution | null): string {
  if (!resolution || !resolution.blockId) {
    return 'No product block is displayed. Answer based on business documents and general knowledge.';
  }

  const { blockId, data, itemsUsed } = resolution;

  if (Array.isArray(data?.items) && data.items.length > 0) {
    const names = data.items
      .slice(0, 4)
      .map((i: any) => i.name || i.title || 'item')
      .join(', ');
    return `The customer sees ${data.items.length} item(s): ${names}. They can tap to view details.`;
  }

  if (data?.name || data?.title) {
    const label = data.name || data.title;
    const price = typeof data.price === 'number' ? ` priced at ${formatCurrency(data.price)}` : '';
    return `The customer sees details for "${label}"${price}.`;
  }

  if (data?.brandName || data?.welcomeMessage) {
    return 'The welcome screen is displayed. The customer just arrived.';
  }

  if (data?.whatsapp || data?.phone || data?.email) {
    return 'Contact information is displayed.';
  }

  return `A "${blockId}" block is displayed with ${itemsUsed} item(s).`;
}

function formatCurrency(amount: number): string {
  if (amount >= 100) {
    return '\u20B9' + amount.toLocaleString('en-IN');
  }
  return '$' + amount.toFixed(2);
}

function formatHistory(
  messages: ConversationMessage[],
  maxMessages: number
): string {
  if (messages.length === 0) return '';

  const recent = messages.slice(-maxMessages);
  return recent
    .map((m) => `${m.role === 'customer' ? 'Customer' : 'You'}: ${m.text}`)
    .join('\n');
}

function truncateContext(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.substring(0, maxChars) + '...';
}

export function buildRelayPrompt(input: RelayPromptInput): BuiltPrompt {
  const maxHistory = input.maxHistoryMessages ?? 6;
  const blockContext = summarizeBlockContext(input.blockResolution);
  const historyText = formatHistory(input.conversationHistory, maxHistory);
  const bizContext = truncateContext(input.businessContext, 800);

  const systemPrompt = `You are the AI assistant for ${input.brandName}${input.brandTagline ? ` — ${input.brandTagline}` : ''}. You help customers browse, choose, and buy.

RULES:
- Keep replies to 1-3 sentences. Be concise and helpful.
- The customer already sees a visual block with product/service information. Do NOT repeat what the block shows.
- Instead: comment, recommend, highlight key differences, or guide next steps.
- If asked about policies, shipping, or returns, answer from the business context below.
- If you don't know something, say so honestly. Never invent prices, stock, or policies.
- Suggest 2-3 natural follow-up questions the customer might ask.
- Match the brand's tone: professional but warm.

BUSINESS CONTEXT:
${bizContext || 'No business documents available.'}

CURRENTLY DISPLAYED:
${blockContext}`;

  const userPrompt = historyText
    ? `RECENT CONVERSATION:\n${historyText}\n\nCUSTOMER'S NEW MESSAGE:\n"${input.customerMessage}"`
    : `CUSTOMER'S MESSAGE:\n"${input.customerMessage}"`;

  const estimatedTokens = Math.ceil(
    (systemPrompt.length + userPrompt.length) / 4
  );

  return { systemPrompt, userPrompt, estimatedTokens };
}

export function buildFollowUpPrompt(
  blockResolution: BlockResolution | null,
  _intentType: string
): string[] {
  if (!blockResolution?.blockId) {
    return ['What do you offer?', 'Help me choose', 'Contact info'];
  }
  const data = blockResolution.data || {};
  if (Array.isArray(data.items) && data.items.length > 0) {
    return ['Tell me more about one of these', 'Filter by price', 'Compare options'];
  }
  if (data.name || data.title) {
    return ['Is this available?', 'Show similar options', 'How do I book?'];
  }
  return ['Show me options', 'What else do you have?', 'Help me choose'];
}
