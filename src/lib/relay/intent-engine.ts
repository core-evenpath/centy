import type { RelaySessionCache } from './session-cache';
import { parseQuery } from './query-parser';
import type { ParsedFilters } from './query-parser';
import { extractOrderId } from './order-id-parser';

export type IntentType =
  | 'greeting'
  | 'browse'
  | 'search'
  | 'product_detail'
  | 'compare'
  | 'price_check'
  | 'cart_view'
  | 'cart_add'
  | 'checkout'
  | 'order_status'
  | 'return_request'
  | 'promo_inquiry'
  | 'contact'
  | 'support'
  | 'bundle_inquiry'
  | 'booking'
  | 'subscribe'
  | 'loyalty_inquiry'
  | 'quiz'
  | 'general';

export interface Intent {
  type: IntentType;
  confidence: number;
  filters?: ParsedFilters;
  productRef?: string;
  itemRefs?: string[];
  orderId?: string;
  topic?: string;
  rawMessage: string;
}

export interface IntentContext {
  messageHistory: string[];
  hasProducts: boolean;
  hasCartItems: boolean;
  hasRag: boolean;
  hasContactInfo: boolean;
}

interface IntentPattern {
  type: IntentType;
  keywords: string[];
  patterns: RegExp[];
  confidence: number;
  requiresData?: keyof IntentContext;
}

const INTENT_PATTERNS: IntentPattern[] = [
  {
    type: 'greeting',
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'good afternoon', 'howdy', 'greetings', 'namaste'],
    patterns: [/^(hi|hey|hello|hola|namaste)\b/i, /^good\s+(morning|afternoon|evening)/i],
    confidence: 0.95,
  },
  {
    type: 'order_status',
    keywords: ['track', 'tracking', 'shipment', 'delivery status', 'where is my order', 'order status', 'shipped', 'dispatched', 'out for delivery'],
    patterns: [/where.*(order|package|shipment)/i, /track.*(order|package|delivery)/i, /order.*status/i, /when.*(?:arrive|deliver|reach|come)/i, /#?[A-Z]{2,4}[-_]?\d{4,}/i],
    confidence: 0.9,
    requiresData: 'hasProducts',
  },
  {
    type: 'return_request',
    keywords: ['return', 'exchange', 'refund', 'send back', 'replace', 'damaged', 'defective', 'wrong item', 'wrong size', "doesn't fit"],
    patterns: [/(?:want|need|how)\s*(?:to)?\s*(?:return|exchange|refund)/i, /(?:return|exchange)\s*(?:policy|process|this)/i],
    confidence: 0.9,
  },
  {
    type: 'cart_view',
    keywords: ['my cart', 'my bag', 'my basket', 'view cart', 'show cart', 'view bag', 'show bag', "what's in my cart", 'in my bag'],
    patterns: [/(?:show|view|open|see|check)\s*(?:my\s*)?(?:cart|bag|basket)/i, /what.*(?:in|inside)\s*(?:my\s*)?(?:cart|bag)/i],
    confidence: 0.9,
  },
  {
    type: 'checkout',
    keywords: ['checkout', 'check out', 'pay now', 'place order', 'buy now', 'ready to pay', 'proceed to pay', 'complete order'],
    patterns: [/(?:ready|want|let.*)\s*(?:to\s*)?(?:checkout|check out|pay|order|purchase)/i, /(?:place|complete|confirm|submit)\s*(?:my\s*)?order/i],
    confidence: 0.9,
  },
  {
    type: 'compare',
    keywords: ['compare', 'versus', ' vs ', 'difference between', 'which is better', 'which one', 'better option'],
    patterns: [/compare\s+.+\s+(?:and|with|vs|versus)\s+/i, /.+\s+vs\.?\s+.+/i, /(?:difference|differ)\s+between/i, /which\s+(?:is|one|should|would)\s+(?:be\s+)?better/i],
    confidence: 0.85,
  },
  {
    type: 'product_detail',
    keywords: ['tell me about', 'more about', 'details on', 'details of', 'info about', 'information on', 'specs of', 'specifications'],
    patterns: [/(?:tell|more|details?|info|information|specs?|features?)\s*(?:about|on|of|for)\s+/i, /what\s+(?:is|are)\s+(?:the\s+)?(?:specs?|features?|ingredients?|details?)\s+(?:of|for)/i],
    confidence: 0.85,
    requiresData: 'hasProducts',
  },
  {
    type: 'promo_inquiry',
    keywords: ['discount', 'coupon', 'promo', 'promotion', 'deal', 'offer', 'sale', 'code', 'voucher', 'clearance', 'any offers'],
    patterns: [/(?:any|got|have)\s*(?:discount|coupon|promo|deal|offer|sale)/i, /(?:discount|coupon|promo)\s*(?:code|available)/i],
    confidence: 0.85,
  },
  {
    type: 'price_check',
    keywords: ['how much', 'what price', 'what cost', 'price of', 'cost of', 'pricing', 'rate for'],
    patterns: [/(?:how much|what.*price|what.*cost|price of|cost of)\s+/i, /(?:pricing|rate)\s+(?:for|of)/i],
    confidence: 0.8,
    requiresData: 'hasProducts',
  },
  {
    type: 'contact',
    keywords: ['contact', 'phone number', 'email address', 'call you', 'reach you', 'customer service', 'customer care', 'support number', 'helpline'],
    patterns: [/(?:how|can)\s*(?:i|we)?\s*(?:contact|reach|call|email)/i, /(?:phone|email|contact)\s*(?:number|address|details|info)/i, /(?:customer|tech)\s*(?:service|support|care)/i],
    confidence: 0.85,
  },
  {
    type: 'support',
    keywords: ['help', 'assist', 'issue', 'problem', 'complaint', 'not working', 'broken', 'stuck', 'trouble'],
    patterns: [/(?:need|want)\s*help\s*(?:with|for)/i, /(?:having|got)\s*(?:an?\s*)?(?:issue|problem|trouble)/i],
    confidence: 0.7,
  },
  {
    type: 'cart_add',
    keywords: ['add to cart', 'add to bag', 'add to basket', 'buy this', 'i want this', "i'll take", 'order this'],
    patterns: [/add\s*(?:this|it)?\s*(?:to\s*)?(?:cart|bag|basket)/i, /(?:i.ll|i will|gonna|want to)\s*(?:take|buy|order|get)\s+(?:this|it|that)/i],
    confidence: 0.85,
  },
  {
    type: 'booking',
    keywords: ['book', 'appointment', 'schedule', 'reserve', 'reservation', 'slot', 'time slot', 'consultation'],
    patterns: [/(?:book|schedule|reserve)\s+(?:a|an|my)?\s*(?:appointment|consultation|session|slot|table|room|visit)/i, /(?:available|open)\s*(?:slots?|times?|appointments?)/i],
    confidence: 0.85,
  },
  {
    type: 'subscribe',
    keywords: ['subscribe', 'subscription', 'auto-replenish', 'recurring', 'replenish', 'subscribe and save', 'auto refill'],
    patterns: [/(?:subscribe|subscription)\s*(?:to|for|option|plan)/i, /auto[-\s]*(?:replenish|refill|renew|ship)/i],
    confidence: 0.85,
    requiresData: 'hasProducts',
  },
  {
    type: 'bundle_inquiry',
    keywords: ['bundle', 'combo', 'package deal', 'set deal', 'buy together', 'combo offer', 'gift set', 'value pack'],
    patterns: [/(?:bundle|combo|package|set)\s*(?:deal|offer|price|discount)?/i, /(?:buy|purchase|get)\s*(?:together|as a set|combo)/i],
    confidence: 0.8,
    requiresData: 'hasProducts',
  },
  {
    type: 'loyalty_inquiry',
    keywords: ['points', 'rewards', 'loyalty', 'tier', 'reward points', 'my points', 'loyalty program', 'membership'],
    patterns: [/(?:my|check|view|see)\s*(?:points?|rewards?|loyalty|membership)/i, /(?:loyalty|rewards?)\s*(?:program|status|balance|tier)/i],
    confidence: 0.8,
  },
  {
    type: 'quiz',
    keywords: ['quiz', 'recommend', 'help me find', 'help me choose', 'what should i', 'which one for me', 'skin type', 'find the right'],
    patterns: [/(?:help|assist)\s*(?:me)?\s*(?:find|choose|pick|decide|select)/i, /(?:what|which)\s*(?:should|would|do you)\s*(?:i|you)\s*(?:recommend|suggest|choose)/i, /(?:quiz|assessment|survey|test)\s*(?:for|about)?/i],
    confidence: 0.75,
  },
  {
    type: 'browse',
    keywords: ['show me', 'browse', 'catalog', 'collection', 'what do you have', 'what do you sell', 'products', 'available', 'shop', 'categories'],
    patterns: [/show\s*(?:me\s*)?(?:your|the|some|all)?\s*/i, /(?:what|which)\s*(?:do you|you)\s*(?:have|sell|offer)/i, /(?:browse|see|view|explore)\s*(?:your|the)?\s*(?:catalog|collection|products|store|shop|range)/i],
    confidence: 0.75,
    requiresData: 'hasProducts',
  },
];

function detectCompareItems(message: string, cache: RelaySessionCache): string[] {
  const vsMatch = message.match(/(.+?)\s+(?:vs\.?|versus|or|and|compared?\s*(?:to|with)?)\s+(.+)/i);
  if (!vsMatch) return [];

  const refs: string[] = [];
  for (const part of [vsMatch[1], vsMatch[2]]) {
    const trimmed = part.trim().replace(/^(?:the|a|an)\s+/i, '');
    const results = cache.searchItems(trimmed, 1);
    if (results.length > 0 && results[0].score >= 3) {
      refs.push(results[0].item.id);
    }
  }

  return refs;
}

function detectOrderId(message: string): string | null {
  return extractOrderId(message);
}

function isBrowseQuery(message: string, filters: ParsedFilters): boolean {
  return (
    filters.category !== null ||
    filters.priceMax !== null ||
    filters.priceMin !== null ||
    (filters.keywords.length > 0 && filters.keywords.length <= 4)
  );
}

export function classifyIntent(
  message: string,
  cache: RelaySessionCache,
  context?: Partial<IntentContext>
): Intent {
  const lower = message.toLowerCase().trim();

  if (!lower || lower.length === 0) {
    return { type: 'greeting', confidence: 0.5, rawMessage: message };
  }

  const ctx: IntentContext = {
    messageHistory: context?.messageHistory || [],
    hasProducts: context?.hasProducts ?? cache.getItemCount() > 0,
    hasCartItems: context?.hasCartItems ?? false,
    hasRag: context?.hasRag ?? cache.hasRag(),
    hasContactInfo: context?.hasContactInfo ?? !!(cache.getContact().phone || cache.getContact().email),
  };

  for (const pattern of INTENT_PATTERNS) {
    if (pattern.requiresData) {
      if (!ctx[pattern.requiresData]) continue;
    }

    let matched = false;

    for (const kw of pattern.keywords) {
      if (lower.includes(kw)) {
        matched = true;
        break;
      }
    }

    if (!matched) {
      for (const regex of pattern.patterns) {
        if (regex.test(lower)) {
          matched = true;
          break;
        }
      }
    }

    if (!matched) continue;

    const filters = parseQuery(message, cache);
    const intent: Intent = {
      type: pattern.type,
      confidence: pattern.confidence,
      filters,
      rawMessage: message,
    };

    if (pattern.type === 'compare') {
      intent.itemRefs = detectCompareItems(message, cache);
      if (intent.itemRefs.length < 2) {
        continue;
      }
    }

    if (pattern.type === 'order_status') {
      intent.orderId = detectOrderId(message);
    }

    if (pattern.type === 'product_detail' || pattern.type === 'price_check') {
      intent.productRef = filters.productRef;
    }

    return intent;
  }

  const filters = parseQuery(message, cache);

  if (isBrowseQuery(message, filters) && ctx.hasProducts) {
    return {
      type: filters.productRef ? 'search' : 'browse',
      confidence: 0.6,
      filters,
      productRef: filters.productRef || undefined,
      rawMessage: message,
    };
  }

  return {
    type: 'general',
    confidence: 0.5,
    filters,
    rawMessage: message,
  };
}
