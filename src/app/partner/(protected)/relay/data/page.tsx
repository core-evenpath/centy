'use client';

// ── Partner-side Relay schemas (PR fix-17) ──────────────────────────
//
// Replaces the legacy ModulesDashboard (which read from the deprecated
// systemModules collection — empty for partners after the schemas
// migration). Now sources schemas from `relaySchemas` exclusively,
// the same canonical store admin manages at /admin/relay/data.
//
// Layout:
//   • Identity banner (category + country + currency from persona)
//     — visual confirmation of context driving the filter
//   • Per-vertical sections, partner's primary vertical expanded by
//     default, others collapsed
//   • Schema cards with field count + partner item count + "Add data"
//     entry pointing into /partner/relay/data/{slug}
//
// Removed: Reset Modules dialog (no enable/reset lifecycle in the new
// model — schemas are intrinsic, partners just fill them).

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Database,
  AlertCircle,
  Globe,
  DollarSign,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import {
  listPartnerSchemasAction,
  type PartnerSchemaCard,
  type PartnerSchemasResult,
} from '@/actions/partner-relay-data';
import { TestChatSeedSampleCTA } from '../test-chat/_TestChatSeedSampleCTA';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function PartnerRelayDataPage() {
  const { user, currentWorkspace } = useMultiWorkspaceAuth();
  const partnerId = currentWorkspace?.partnerId || user?.customClaims?.partnerId || '';

  const [state, setState] = useState<PartnerSchemasResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!partnerId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    listPartnerSchemasAction(partnerId)
      .then((res) => {
        setState(res);
      })
      .finally(() => setLoading(false));
  }, [partnerId]);

  // PR fix-25: render only schemas that match the partner's vertical
  // (or are 'shared' / cross-vertical). Other verticals' schemas are
  // hidden — they'd be irrelevant noise on the partner page.
  const visibleSchemas = useMemo(() => {
    const partnerVertical = state?.partnerVertical;
    return (state?.schemas ?? []).filter(
      (s) => s.vertical === partnerVertical || s.vertical === 'shared',
    );
  }, [state]);

  const totalSchemas = visibleSchemas.length;
  const totalWithItems = visibleSchemas.filter((s) => s.itemCount > 0).length;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2 min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">Your Business Data</h1>
          <p className="text-muted-foreground">
            Schemas describe the shape of data your bot uses to answer
            customers. Each schema lives in{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">relaySchemas</code>{' '}
            — admin manages the structure, you fill it with your items.
          </p>
        </div>
        {partnerId && user?.uid && (
          <TestChatSeedSampleCTA
            partnerId={partnerId}
            userId={user.uid}
            onSeeded={() => {
              // Refetch the list so item counts show up immediately.
              listPartnerSchemasAction(partnerId).then(setState);
            }}
          />
        )}
      </header>

      <IdentityBanner state={state} loading={loading} />

      {loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[140px] w-full rounded-xl" />
          ))}
        </div>
      )}

      {!loading && !state?.success && (
        <ErrorBanner message={state?.error ?? 'Could not load schemas.'} />
      )}

      {!loading && state?.success && totalSchemas === 0 && (
        <EmptyState />
      )}

      {!loading && state?.success && totalSchemas > 0 && (
        <>
          <StatsBanner
            totalSchemas={totalSchemas}
            totalWithItems={totalWithItems}
            totalItems={visibleSchemas.reduce((sum, s) => sum + s.itemCount, 0)}
          />

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {visibleSchemas.map((s) => (
              <SchemaCard key={s.slug} schema={s} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function IdentityBanner({
  state,
  loading,
}: {
  state: PartnerSchemasResult | null;
  loading: boolean;
}) {
  if (loading) {
    return <Skeleton className="h-[60px] w-full rounded-lg" />;
  }
  if (!state?.success) return null;

  const { partnerCategoryLabel, partnerCountry, partnerCurrency, partnerVertical } = state;
  const noIdentity =
    !partnerCategoryLabel && !partnerCountry && !partnerCurrency;

  if (noIdentity) {
    return (
      <Card className="border-amber-300 bg-amber-50/40">
        <CardContent className="py-3 flex items-center gap-3 text-sm">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="text-amber-900">
            Set your <strong>Business Identity</strong> in Settings so we can
            highlight the schemas relevant to your business.
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
    <Card className="bg-muted/20">
      <CardContent className="py-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">
          Showing for
        </span>
        {partnerCategoryLabel && (
          <Pill icon={<Building2 className="h-3.5 w-3.5" />} label={partnerCategoryLabel} />
        )}
        {partnerCountry && (
          <Pill icon={<Globe className="h-3.5 w-3.5" />} label={partnerCountry} />
        )}
        {partnerCurrency && (
          <Pill icon={<DollarSign className="h-3.5 w-3.5" />} label={partnerCurrency} />
        )}
        {partnerVertical && (
          <Badge variant="secondary" className="text-[10px]">
            vertical: {partnerVertical}
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

function Pill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className="text-muted-foreground">{icon}</span>
      <span className="font-medium">{label}</span>
    </span>
  );
}

function SchemaCard({ schema }: { schema: PartnerSchemaCard }) {
  const hasItems = schema.itemCount > 0;
  const previews = schema.previewItems ?? [];
  return (
    <Link
      href={`/partner/relay/data/${schema.slug}`}
      className="group block"
    >
      <div
        className={[
          'rounded-lg border bg-card p-3 transition-colors hover:border-foreground/30 flex flex-col',
          hasItems ? '' : 'border-dashed',
        ].join(' ')}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate" title={schema.name}>
              {schema.name}
            </div>
            <code
              className="text-[10px] text-muted-foreground block truncate"
              title={schema.slug}
            >
              {schema.slug}
            </code>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
        </div>
        {schema.description && (
          <p
            className="text-xs text-muted-foreground mt-2 line-clamp-2"
            title={schema.description}
          >
            {schema.description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-3 text-[11px]">
          <span className="text-muted-foreground">
            <strong className="text-foreground">{schema.fieldCount}</strong>{' '}
            field{schema.fieldCount === 1 ? '' : 's'}
          </span>
          <span className="text-muted-foreground">·</span>
          <span
            className={
              hasItems ? 'text-emerald-700 font-medium' : 'text-muted-foreground'
            }
          >
            {hasItems ? (
              <>
                <strong>{schema.itemCount}</strong> item
                {schema.itemCount === 1 ? '' : 's'}
              </>
            ) : (
              <>No items yet</>
            )}
          </span>
        </div>
        {previews.length > 0 && (
          <ul className="mt-3 pt-3 border-t space-y-1">
            {previews.map((p) => (
              <li key={p.id} className="text-[11px] truncate" title={p.name}>
                <span className="text-foreground">{p.name}</span>
                {p.subtitle && (
                  <span className="text-muted-foreground">
                    {' '}
                    · {p.subtitle}
                  </span>
                )}
              </li>
            ))}
            {schema.itemCount > previews.length && (
              <li className="text-[10px] text-muted-foreground italic">
                + {schema.itemCount - previews.length} more
              </li>
            )}
          </ul>
        )}
      </div>
    </Link>
  );
}

function StatsBanner({
  totalSchemas,
  totalWithItems,
  totalItems,
}: {
  totalSchemas: number;
  totalWithItems: number;
  totalItems: number;
}) {
  const pct =
    totalSchemas === 0 ? 0 : Math.round((totalWithItems / totalSchemas) * 100);
  return (
    <div className="rounded-xl border bg-gradient-to-br from-emerald-50/50 to-background p-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Stat label="Schemas populated" value={`${totalWithItems} / ${totalSchemas}`} />
        <Stat label="Total items" value={totalItems.toLocaleString()} />
        <div className="flex-1 min-w-[180px]">
          <div className="flex items-center justify-between text-[10px] uppercase font-semibold text-muted-foreground mb-1.5">
            <span>Coverage</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">
        {label}
      </div>
      <div className="text-lg font-bold mt-0.5">{value}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 text-center text-sm text-muted-foreground space-y-3">
        <Database className="h-8 w-8 mx-auto text-muted-foreground/60" />
        <p>
          No schemas available yet. Schemas are generated centrally by admin —
          contact support if this looks wrong for your account.
        </p>
      </CardContent>
    </Card>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <Card className="border-destructive/40 bg-destructive/5">
      <CardContent className="py-4 flex items-center gap-3 text-sm">
        <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
        <span className="text-destructive">{message}</span>
      </CardContent>
    </Card>
  );
}
