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

  switch (blockId) {
    case 'ecom_product_card': {
      const items = data.items || [];
      if (items.length === 0) return 'A product catalog block is displayed but has no items.';
      const names = items.slice(0, 4).map((i: any) => i.name).join(', ');
      const priceRange = items
        .filter((i: any) => i.price)
        .map((i: any) => i.price);
      const minP = priceRange.length > 0 ? Math.min(...priceRange) : null;
      const maxP = priceRange.length > 0 ? Math.max(...priceRange) : null;
      const range = minP !== null && maxP !== null && minP !== maxP
        ? ` (${formatCurrency(minP)} - ${formatCurrency(maxP)})`
        : minP !== null
          ? ` (${formatCurrency(minP)})`
          : '';
      return `The customer sees ${items.length} products: ${names}${range}. They can tap to view details or add to bag.`;
    }

    case 'ecom_product_detail': {
      const name = data.name || 'a product';
      const price = data.price ? ` at ${formatCurrency(data.price)}` : '';
      const rating = data.rating ? `, rated ${data.rating}/5` : '';
      return `The customer sees the detail view of "${name}"${price}${rating}. Size/color selectors and Add to Bag button are visible.`;
    }

    case 'ecom_compare': {
      const labels = data.itemLabels || [];
      return `The customer sees a comparison table: ${labels.join(' vs ')}. Key specs are displayed side by side.`;
    }

    case 'ecom_cart': {
      const items = data.items || [];
      if (items.length === 0) return 'The shopping cart is displayed but empty.';
      const total = items.reduce((s: number, i: any) => s + (i.price || 0) * (i.quantity || 1), 0);
      return `The cart shows ${items.length} item(s) totaling ${formatCurrency(total)}. Checkout button is visible.`;
    }

    case 'ecom_order_tracker': {
      const status = data.status || 'unknown';
      const orderId = data.orderId || '';
      return `Order tracker is displayed for ${orderId}. Current status: ${status}.`;
    }

    case 'ecom_promo': {
      const title = data.title || 'a promotion';
      return `A promotional offer is displayed: "${title}". The customer can see the deal details.`;
    }

    case 'ecom_greeting':
      return 'The welcome screen is displayed with quick action buttons. The customer just arrived.';

    case 'shared_contact':
      return 'Contact information is displayed. The customer can see phone, email, and WhatsApp options.';

    default:
      return `A "${blockId}" block is displayed with ${itemsUsed} item(s).`;
  }
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
  intentType: string
): string[] {
  const defaults = ['Tell me more', 'What else do you have?', 'Help me choose'];

  switch (intentType) {
    case 'browse':
    case 'search':
      return ['Filter by price', 'Show bestsellers', 'Compare two products'];
    case 'product_detail':
      return ['Is this in stock?', 'Size guide', 'Similar products'];
    case 'compare':
      return ['Which one do you recommend?', 'Add the better one to bag', 'Show me more options'];
    case 'cart_view':
    case 'checkout':
      return ['Apply coupon', 'Change quantity', 'Continue shopping'];
    case 'order_status':
      return ['When will it arrive?', 'Contact support', 'Order something else'];
    case 'promo_inquiry':
      return ['Show me products on sale', 'Apply this code', 'When does it expire?'];
    case 'greeting':
      return ['Show me bestsellers', 'New arrivals', 'I need help choosing'];
    case 'contact':
    case 'support':
      return ['Shipping policy', 'Return policy', 'Track my order'];
    default:
      return defaults;
  }
}
