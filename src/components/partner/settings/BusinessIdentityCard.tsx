'use client';

// ── Business Identity Card (PR fix-12a) ─────────────────────────────
//
// Hero card surfaced at the top of /partner/settings. The three
// fields below — Category, Country, Currency — drive everything from
// price formatting to AI tone to which Relay schemas the partner can
// bind. They were previously buried inside collapsible sections; now
// they're the first thing on the page with a completion indicator
// when any of them is missing.
//
// Behaviour notes:
//   • Country auto-fills Currency on first set (via
//     countryToRegion → regionToDefaultCurrency from src/lib/currency).
//     Once set, changing Country no longer overwrites — admin has
//     opted into a specific currency.
//   • Currency is restricted to SUPPORTED_CURRENCIES (16 codes).
//     Free-typing INR vs Inr would silently break the lint guardrail
//     in scripts/check-block-currency-reads.js.
//   • All persistence routes through the same `onUpdate(path, value)`
//     handler the rest of the settings page uses — no new save path.

import { useMemo } from 'react';
import {
  Building2,
  Globe,
  DollarSign,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTaxonomyIndustries } from '@/hooks/use-taxonomy';
import { getCountriesSorted } from '@/lib/business-taxonomy/countries';
import {
  SUPPORTED_CURRENCIES,
  countryToRegion,
  regionToDefaultCurrency,
  isSupportedCurrency,
  type SupportedCurrency,
} from '@/lib/currency';
import type { BusinessPersona } from '@/lib/business-persona-types';

interface Props {
  persona: Partial<BusinessPersona>;
  /**
   * Field updater shared with the rest of the settings page. Path is
   * dot-notation into BusinessPersona, e.g. 'identity.address.country'.
   */
  onUpdate: (path: string, value: unknown) => Promise<void> | void;
}

const SORTED_COUNTRIES = getCountriesSorted();

// Display label for a currency code: "USD ($)" / "INR (₹)".
function currencyLabel(code: SupportedCurrency): string {
  const symbol = symbolFor(code);
  return symbol ? `${code} (${symbol})` : code;
}

function symbolFor(code: SupportedCurrency): string {
  switch (code) {
    case 'USD':
    case 'CAD':
    case 'AUD':
    case 'SGD':
    case 'HKD':
    case 'MXN':
      return '$';
    case 'INR':
      return '₹';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    case 'JPY':
    case 'CNY':
      return '¥';
    case 'KRW':
      return '₩';
    case 'BRL':
      return 'R$';
    case 'AED':
      return 'د.إ';
    case 'SAR':
      return '﷼';
    case 'CHF':
      return 'Fr';
    default:
      return '';
  }
}

export default function BusinessIdentityCard({ persona, onUpdate }: Props) {
  const { industries, loading: industriesLoading } = useTaxonomyIndustries();

  // ── Read current values ───────────────────────────────────────────
  // The taxonomy stores category as either a string or an array
  // depending on how it was set. Coerce to a single primary value.
  const rawCategory = persona.identity?.industry?.category;
  const category = Array.isArray(rawCategory)
    ? rawCategory[0] ?? ''
    : rawCategory ?? '';
  const country = persona.identity?.address?.country ?? '';
  const currencyRaw = persona.identity?.currency ?? '';
  const currency: SupportedCurrency | '' = isSupportedCurrency(currencyRaw)
    ? currencyRaw
    : '';

  const completion = useMemo(() => {
    const present = [category, country, currency].filter(Boolean).length;
    return { present, total: 3 };
  }, [category, country, currency]);

  const isComplete = completion.present === completion.total;

  // ── Handlers ─────────────────────────────────────────────────────

  const handleCategory = async (next: string) => {
    if (next === category) return;
    await onUpdate('identity.industry.category', next);
    const ind = industries.find((i) => i.industryId === next);
    if (ind) {
      await onUpdate('identity.industry.name', ind.name);
    }
  };

  const handleCountry = async (next: string) => {
    if (next === country) return;
    await onUpdate('identity.address.country', next);

    // Auto-fill currency on first set only — once admin has chosen a
    // currency, switching country must not silently overwrite it.
    if (!currency) {
      const region = countryToRegion(next);
      const defaultCurrency = regionToDefaultCurrency(region);
      await onUpdate('identity.currency', defaultCurrency);
      toast.success(
        `Currency set to ${defaultCurrency} based on country. Override below if needed.`,
      );
    }
  };

  const handleCurrency = async (next: string) => {
    if (next === currency) return;
    if (!isSupportedCurrency(next)) {
      toast.error(`Unsupported currency: ${next}`);
      return;
    }
    await onUpdate('identity.currency', next);
  };

  // Country derived → currency divergence indicator. Tells admin
  // when their currency differs from the country's default, so an
  // intentional override is visible (vs. a forgotten one).
  const isCurrencyOverride =
    !!country && !!currency &&
    currency !== regionToDefaultCurrency(countryToRegion(country));

  return (
    <Card
      className={[
        'border-2 transition-colors',
        isComplete
          ? 'border-emerald-200 bg-emerald-50/30'
          : 'border-amber-300 bg-amber-50/40',
      ].join(' ')}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2">
            {isComplete ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-600" />
            )}
            Business Identity
          </CardTitle>
          <Badge
            variant="outline"
            className={[
              'text-[11px]',
              isComplete
                ? 'border-emerald-300 text-emerald-800 bg-emerald-50'
                : 'border-amber-300 text-amber-800 bg-amber-50',
            ].join(' ')}
          >
            {completion.present}/{completion.total} set
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          These three drive currency formatting, AI tone, and which Relay
          schemas your blocks can bind to. Set them first.
        </p>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* ── Category ─────────────────────────────────────────── */}
          <Field
            icon={<Building2 className="h-4 w-4" />}
            label="Category"
            present={!!category}
            displayValue={
              category
                ? industries.find((i) => i.industryId === category)?.name ??
                  category
                : undefined
            }
          >
            <Select
              value={category || undefined}
              onValueChange={handleCategory}
              disabled={industriesLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                {industries.map((ind) => (
                  <SelectItem key={ind.industryId} value={ind.industryId}>
                    {ind.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* ── Country ──────────────────────────────────────────── */}
          <Field
            icon={<Globe className="h-4 w-4" />}
            label="Country"
            present={!!country}
            displayValue={
              country
                ? `${
                    SORTED_COUNTRIES.find((c) => c.countryCode === country)
                      ?.flag ?? ''
                  } ${
                    SORTED_COUNTRIES.find((c) => c.countryCode === country)
                      ?.name ?? country
                  }`.trim()
                : undefined
            }
          >
            <Select
              value={country || undefined}
              onValueChange={handleCountry}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {SORTED_COUNTRIES.map((c) => (
                  <SelectItem key={c.countryCode} value={c.countryCode}>
                    {c.flag} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* ── Currency ─────────────────────────────────────────── */}
          <Field
            icon={<DollarSign className="h-4 w-4" />}
            label="Currency"
            present={!!currency}
            displayValue={currency ? currencyLabel(currency) : undefined}
            secondary={
              isCurrencyOverride
                ? `Override (default for ${country} is ${regionToDefaultCurrency(
                    countryToRegion(country),
                  )})`
                : country && currency
                ? `Default for ${country}`
                : undefined
            }
          >
            <Select
              value={currency || undefined}
              onValueChange={handleCurrency}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_CURRENCIES.map((code) => (
                  <SelectItem key={code} value={code}>
                    {currencyLabel(code)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        {!isComplete && (
          <p className="mt-4 text-xs text-amber-800">
            Complete all three to unlock the full Relay schema catalog and
            currency-correct rendering across blocks.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Field row ──────────────────────────────────────────────────────

function Field({
  icon,
  label,
  present,
  displayValue,
  secondary,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  present: boolean;
  displayValue?: string;
  secondary?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
        <span className="text-slate-500">{icon}</span>
        {label}
        {!present && (
          <span className="text-[10px] text-amber-700 font-semibold uppercase">
            Required
          </span>
        )}
      </div>
      {children}
      {present && displayValue && (
        <p className="text-[11px] text-muted-foreground truncate">
          {displayValue}
          {secondary && (
            <span className="ml-1 text-slate-500">· {secondary}</span>
          )}
        </p>
      )}
    </div>
  );
}
