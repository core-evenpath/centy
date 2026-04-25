'use client';

// ── Identity strip (PR fix-16b) ─────────────────────────────────────
//
// Shows the partner-context driving the test-chat session: category,
// country, currency. If any of these is missing the bot will render
// generic defaults — the strip surfaces that so admin can fix it
// before chasing rendering bugs.

import Link from 'next/link';
import { Building2, Globe, DollarSign, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Props {
  category?: string;
  country?: string;
  currency?: string;
  vertical?: string | null;
}

export function TestChatIdentityStrip({
  category,
  country,
  currency,
  vertical,
}: Props) {
  const allMissing = !category && !country && !currency;

  if (allMissing) {
    return (
      <Card className="border-amber-300 bg-amber-50/40 mb-4">
        <CardContent className="py-3 flex flex-wrap items-center gap-3 text-sm">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="text-amber-900">
            <strong>Set your Business Identity</strong> first — the bot will
            render generic defaults until category, country, and currency are
            configured.
          </span>
          <Link
            href="/partner/settings"
            className="ml-auto text-amber-900 underline text-xs font-medium hover:no-underline"
          >
            Open Settings →
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-muted/20 mb-4">
      <CardContent className="py-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">
          Bot context
        </span>
        {category && (
          <Pill icon={<Building2 className="h-3.5 w-3.5" />} label={category} present />
        )}
        {!category && (
          <Pill icon={<Building2 className="h-3.5 w-3.5" />} label="Category not set" />
        )}
        {country && (
          <Pill icon={<Globe className="h-3.5 w-3.5" />} label={country} present />
        )}
        {!country && (
          <Pill icon={<Globe className="h-3.5 w-3.5" />} label="Country not set" />
        )}
        {currency && (
          <Pill icon={<DollarSign className="h-3.5 w-3.5" />} label={currency} present />
        )}
        {!currency && (
          <Pill icon={<DollarSign className="h-3.5 w-3.5" />} label="Currency not set" />
        )}
        {vertical && (
          <Badge variant="secondary" className="text-[10px]">
            vertical: {vertical}
          </Badge>
        )}
        <Link
          href="/partner/settings"
          className="ml-auto text-xs text-muted-foreground hover:text-foreground hover:underline"
        >
          Edit identity →
        </Link>
      </CardContent>
    </Card>
  );
}

function Pill({
  icon,
  label,
  present,
}: {
  icon: React.ReactNode;
  label: string;
  present?: boolean;
}) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 text-xs',
        present ? '' : 'text-amber-700 italic',
      ].join(' ')}
    >
      <span className={present ? 'text-muted-foreground' : 'text-amber-600'}>
        {icon}
      </span>
      <span className="font-medium">{label}</span>
    </span>
  );
}
