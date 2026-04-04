import type { RelaySessionCache } from './session-cache';

export interface ParsedFilters {
  category: string | null;
  priceMin: number | null;
  priceMax: number | null;
  keywords: string[];
  sortBy: SortPreference | null;
  productRef: string | null;
  quantity: number | null;
}

export type SortPreference =
  | 'price_asc'
  | 'price_desc'
  | 'rating'
  | 'newest'
  | 'popular';

const PRICE_MAX_PATTERNS = [
  /(?:under|below|less than|within|max|upto|up to|at most|budget)\s*(?:₹|rs\.?|inr|usd|\$)?\s*([\d,]+(?:\.\d+)?)\s*(?:k)?/i,
  /(?:₹|rs\.?|inr|\$)\s*([\d,]+(?:\.\d+)?)\s*(?:k)?\s*(?:or less|max|budget|ceiling)/i,
  /([\d,]+(?:\.\d+)?)\s*(?:k)?\s*(?:₹|rs|inr|\$)?\s*(?:or less|or under|max|budget)/i,
];

const PRICE_MIN_PATTERNS = [
  /(?:above|over|more than|at least|min|minimum|starting|from)\s*(?:₹|rs\.?|inr|usd|\$)?\s*([\d,]+(?:\.\d+)?)\s*(?:k)?/i,
  /(?:₹|rs\.?|inr|\$)\s*([\d,]+(?:\.\d+)?)\s*(?:k)?\s*(?:or more|and above|plus|\+)/i,
];

const PRICE_RANGE_PATTERNS = [
  /(?:between|from)\s*(?:₹|rs\.?|inr|\$)?\s*([\d,]+(?:\.\d+)?)\s*(?:k)?\s*(?:to|and|-)\s*(?:₹|rs\.?|inr|\$)?\s*([\d,]+(?:\.\d+)?)\s*(?:k)?/i,
  /(?:₹|rs\.?|inr|\$)?\s*([\d,]+(?:\.\d+)?)\s*(?:k)?\s*-\s*(?:₹|rs\.?|inr|\$)?\s*([\d,]+(?:\.\d+)?)\s*(?:k)?/i,
];

const SORT_KEYWORDS: Record<SortPreference, string[]> = {
  price_asc: ['cheapest', 'lowest price', 'affordable', 'budget', 'least expensive', 'value'],
  price_desc: ['expensive', 'premium', 'luxury', 'highest price', 'top end', 'high end'],
  rating: ['top rated', 'highest rated', 'best rated', 'best reviewed', 'most popular', 'bestseller', 'best seller'],
  newest: ['newest', 'latest', 'new arrivals', 'just arrived', 'recently added', 'new in', 'fresh'],
  popular: ['trending', 'hot', 'popular', 'most bought', 'most sold', 'in demand'],
};

const STOP_WORDS = new Set([
  'i', 'me', 'my', 'we', 'you', 'your', 'the', 'a', 'an', 'is', 'are',
  'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
  'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall',
  'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into',
  'about', 'between', 'through', 'after', 'before', 'above', 'below',
  'and', 'but', 'or', 'not', 'no', 'so', 'if', 'then', 'than', 'too',
  'very', 'just', 'also', 'some', 'any', 'all', 'each', 'every', 'both',
  'this', 'that', 'these', 'those', 'it', 'its',
  'show', 'me', 'want', 'need', 'looking', 'find', 'get', 'give',
  'see', 'tell', 'help', 'please', 'thanks', 'hi', 'hello',
  'something', 'anything', 'thing', 'stuff', 'like',
]);

function parseNumber(raw: string): number {
  const cleaned = raw.replace(/,/g, '');
  let num = parseFloat(cleaned);
  if (raw.toLowerCase().endsWith('k')) {
    num *= 1000;
  }
  return isNaN(num) ? 0 : num;
}

function extractPriceRange(message: string): { min: number | null; max: number | null } {
  let min: number | null = null;
  let max: number | null = null;

  for (const pattern of PRICE_RANGE_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      min = parseNumber(match[1]);
      max = parseNumber(match[2]);
      return { min, max };
    }
  }

  for (const pattern of PRICE_MAX_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      max = parseNumber(match[1]);
      break;
    }
  }

  for (const pattern of PRICE_MIN_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      min = parseNumber(match[1]);
      break;
    }
  }

  return { min, max };
}

function extractSortPreference(message: string): SortPreference | null {
  const lower = message.toLowerCase();
  for (const [pref, keywords] of Object.entries(SORT_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        return pref as SortPreference;
      }
    }
  }
  return null;
}

function extractCategoryMatch(
  message: string,
  knownCategories: string[]
): string | null {
  const lower = message.toLowerCase();

  for (const cat of knownCategories) {
    const catLower = cat.toLowerCase();
    if (lower.includes(catLower)) {
      return cat;
    }
    const singular = catLower.endsWith('s') ? catLower.slice(0, -1) : null;
    if (singular && singular.length > 2 && lower.includes(singular)) {
      return cat;
    }
  }

  return null;
}

function extractProductRef(
  message: string,
  cache: RelaySessionCache
): string | null {
  const results = cache.searchItems(message, 1);
  if (results.length > 0 && results[0].score >= 5) {
    return results[0].item.id;
  }
  return null;
}

function extractKeywords(
  message: string,
  knownCategories: string[]
): string[] {
  const priceStripped = message
    .toLowerCase()
    .replace(/(?:₹|rs\.?|inr|\$)\s*[\d,]+(?:\.\d+)?k?/gi, '')
    .replace(/\b\d+(?:,\d+)*(?:\.\d+)?k?\b/g, '');

  const cleaned = priceStripped.split(/\s+/).filter((w) => w.length > 2);

  const keywords: string[] = [];
  const catLowers = new Set(knownCategories.map((c) => c.toLowerCase()));
  const sortKwSet = new Set<string>();
  for (const sortKws of Object.values(SORT_KEYWORDS)) {
    for (const sk of sortKws) {
      for (const word of sk.split(/\s+/)) {
        sortKwSet.add(word);
      }
    }
  }

  for (const word of cleaned) {
    if (STOP_WORDS.has(word)) continue;
    if (catLowers.has(word)) continue;
    const singular = word.endsWith('s') ? word.slice(0, -1) : '';
    if (singular && catLowers.has(singular)) continue;
    if (sortKwSet.has(word)) continue;
    keywords.push(word);
  }

  return keywords;
}

function extractQuantity(message: string): number | null {
  const match = message.match(
    /\b(\d+)\s*(?:pcs?|pieces?|items?|units?|nos?|qty|quantity)\b/i
  );
  if (match) {
    const n = parseInt(match[1], 10);
    return n > 0 && n < 1000 ? n : null;
  }
  return null;
}

export function parseQuery(
  message: string,
  cache: RelaySessionCache
): ParsedFilters {
  const knownCategories = cache.getCategories();
  const { min, max } = extractPriceRange(message);

  return {
    category: extractCategoryMatch(message, knownCategories),
    priceMin: min,
    priceMax: max,
    keywords: extractKeywords(message, knownCategories),
    sortBy: extractSortPreference(message),
    productRef: extractProductRef(message, cache),
    quantity: extractQuantity(message),
  };
}
