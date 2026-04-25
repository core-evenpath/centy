// ── Currency utilities (PR fix-11) ──────────────────────────────────
//
// Canonical currency code list + formatter for the Relay system. Use
// these everywhere instead of hand-rolled `'$' + amount` or one of the
// five pre-existing `formatCurrency` variants that disagree on locale
// and default currency.
//
// Existing callsites that should migrate (tracked, not migrated in
// this PR):
//   - src/lib/modules/utils.ts:201           (hardcoded en-IN)
//   - src/lib/country-autofill-config.ts:571 (country-keyed)
//   - src/lib/relay/rag-context-builder.ts:57
//   - src/lib/relay/blocks/ecommerce/product-card.tsx:47
//   - src/lib/relay/blocks/ecommerce/cart.tsx:45
//
// The migration is a separate PR — this file only ships the new
// helper + validators so guardrail tooling has something to enforce.

/**
 * ISO 4217 currency codes the system accepts. Start tight; extend
 * here as we onboard partners in new markets. Anything outside this
 * list is rejected at the schema/action boundary so we never store
 * a typo or unsupported currency.
 *
 * Order roughly: primary markets first (US/IN), then global majors,
 * then APAC/LATAM/MEA growth markets.
 */
export const SUPPORTED_CURRENCIES = [
  // Primary
  'USD',
  'INR',
  // Global majors
  'EUR',
  'GBP',
  'JPY',
  'CAD',
  'AUD',
  'CHF',
  // APAC
  'SGD',
  'HKD',
  'CNY',
  'KRW',
  // MEA
  'AED',
  'SAR',
  // LATAM
  'BRL',
  'MXN',
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

const SUPPORTED_SET = new Set<string>(SUPPORTED_CURRENCIES);

export function isSupportedCurrency(code: string): code is SupportedCurrency {
  return SUPPORTED_SET.has(code);
}

/**
 * Validate at the action boundary. Throws (don't catch silently —
 * a bad currency code is a programming error / malicious input).
 */
export function assertSupportedCurrency(code: string): void {
  if (!isSupportedCurrency(code)) {
    throw new Error(
      `Unsupported currency code: ${JSON.stringify(code)}. ` +
        `Add it to SUPPORTED_CURRENCIES in src/lib/currency.ts if intended.`,
    );
  }
}

/**
 * Region → default currency. Mirrors the region taxonomy added in
 * the upcoming PR fix-12 (US / IN / Global). Global defaults to USD
 * because most cross-border B2B work prices in dollars; partners can
 * override per-item.
 */
export type Region = 'US' | 'IN' | 'Global';

export const REGION_TO_DEFAULT_CURRENCY: Record<Region, SupportedCurrency> = {
  US: 'USD',
  IN: 'INR',
  Global: 'USD',
};

export function regionToDefaultCurrency(region: Region): SupportedCurrency {
  return REGION_TO_DEFAULT_CURRENCY[region];
}

/**
 * Country (ISO 3166-1 alpha-2) → region. Single source of truth for
 * deriving region from a partner's `identity.address.country`. Anything
 * not US or IN falls into 'Global' so we don't have to enumerate every
 * country up-front.
 */
export function countryToRegion(country: string | null | undefined): Region {
  if (!country) return 'Global';
  const upper = country.trim().toUpperCase();
  if (upper === 'US' || upper === 'USA' || upper === 'UNITED STATES') return 'US';
  if (upper === 'IN' || upper === 'IND' || upper === 'INDIA') return 'IN';
  return 'Global';
}

// ── Formatter ──────────────────────────────────────────────────────

/**
 * Format a money amount for display. Always pass an explicit currency
 * — never let the helper guess. Locale defaults to a region-appropriate
 * one but can be overridden per render context.
 *
 * Examples:
 *   formatMoney(1234.5, 'USD')           // "$1,234.50"
 *   formatMoney(1234.5, 'INR')           // "₹1,234.50"
 *   formatMoney(1234.5, 'INR', 'en-US')  // "₹1,234.50" (US-style grouping)
 *   formatMoney(0, 'USD')                // "$0.00"
 *
 * Returns the original number stringified if the amount is non-finite
 * (NaN, Infinity) — caller bug, but don't throw inside a render.
 */
export function formatMoney(
  amount: number,
  currency: string,
  locale?: string,
): string {
  if (!Number.isFinite(amount)) return String(amount);
  if (!isSupportedCurrency(currency)) {
    // Don't throw inside a render; return a clearly-broken string so
    // QA notices in screenshots and the lint script catches the
    // unsupported code at the action layer.
    return `??${amount.toFixed(2)} ${currency}`;
  }
  const lc = locale ?? defaultLocaleForCurrency(currency);
  return new Intl.NumberFormat(lc, {
    style: 'currency',
    currency,
    minimumFractionDigits: minorUnitsFor(currency),
    maximumFractionDigits: minorUnitsFor(currency),
  }).format(amount);
}

function defaultLocaleForCurrency(currency: SupportedCurrency): string {
  switch (currency) {
    case 'INR':
      return 'en-IN';
    case 'USD':
    case 'CAD':
      return 'en-US';
    case 'GBP':
      return 'en-GB';
    case 'EUR':
      return 'en-IE';
    case 'JPY':
      return 'ja-JP';
    case 'AUD':
      return 'en-AU';
    case 'SGD':
      return 'en-SG';
    case 'HKD':
      return 'en-HK';
    case 'CNY':
      return 'zh-CN';
    case 'KRW':
      return 'ko-KR';
    case 'AED':
    case 'SAR':
      return 'en';
    case 'BRL':
      return 'pt-BR';
    case 'MXN':
      return 'es-MX';
    case 'CHF':
      return 'de-CH';
    default:
      return 'en';
  }
}

/**
 * ISO 4217 minor unit count. Matters for JPY/KRW (zero-decimal
 * currencies) — formatting `100.00 JPY` is wrong, should be `¥100`.
 */
function minorUnitsFor(currency: SupportedCurrency): number {
  switch (currency) {
    case 'JPY':
    case 'KRW':
      return 0;
    default:
      return 2;
  }
}

// ── Money pair helpers ─────────────────────────────────────────────

/**
 * Canonical money shape. Always carry currency next to amount —
 * never store a bare number. PR fix-12 will introduce a `MoneyField`
 * field type that enforces this on relaySchemas docs.
 */
export interface Money {
  amount: number;
  currency: SupportedCurrency;
}

export function isMoney(value: unknown): value is Money {
  if (!value || typeof value !== 'object') return false;
  const m = value as Record<string, unknown>;
  return (
    typeof m.amount === 'number' &&
    Number.isFinite(m.amount) &&
    typeof m.currency === 'string' &&
    isSupportedCurrency(m.currency)
  );
}

export function formatMoneyPair(m: Money, locale?: string): string {
  return formatMoney(m.amount, m.currency, locale);
}
