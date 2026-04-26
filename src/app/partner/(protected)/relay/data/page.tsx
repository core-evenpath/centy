'use client';

// ── Partner-facing inventory hub (Phase 1A) ─────────────────────────
//
// Shows the partner everything they manage in one screen, organized by
// what it IS (Products / Bookings / Offers / About) instead of what
// internal slug it lives under. Every piece of admin jargon (slug,
// vertical, schema, fields, modules) is intentionally hidden — the
// partner shouldn't know those words exist.
//
// Architecture: admin owns the schema + block bindings via
// /admin/relay/data; partner only updates content. This page is a
// pure consumer of `listPartnerSchemasAction`, which now attaches a
// `contentCategory` (inferred or admin-overridden) and a display name
// per schema.
//
// Replaces the previous vertical-grouped flat list. Rows still link to
// `/partner/relay/data/{slug}` for editing — the slug is preserved as
// a routing token, just never shown.

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Calendar,
  DollarSign,
  Globe,
  Info,
  Package,
  Plus,
  Sparkles,
  Tag,
  Wrench,
} from 'lucide-react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import {
  listPartnerSchemasAction,
  type PartnerSchemaCard,
  type PartnerSchemasResult,
} from '@/actions/partner-relay-data';
import {
  CONTENT_CATEGORY_META,
  orderedCategories,
  type ContentCategory,
} from '@/lib/relay/content-categories';
import { TestChatSeedSampleCTA } from '../test-chat/_TestChatSeedSampleCTA';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const ICON_MAP = {
  package: Package,
  tag: Tag,
  calendar: Calendar,
  info: Info,
  wrench: Wrench,
  sparkles: Sparkles,
} as const;

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

  // Show only schemas in the partner's vertical (or shared). Other
  // verticals' schemas are irrelevant noise — admin layer keeps them
  // out of the partner's view.
  const visibleSchemas = useMemo(() => {
    const partnerVertical = state?.partnerVertical;
    return (state?.schemas ?? []).filter(
      (s) => s.vertical === partnerVertical || s.vertical === 'shared',
    );
  }, [state]);

  const grouped = useMemo(() => groupByCategory(visibleSchemas), [visibleSchemas]);
  const totalItems = visibleSchemas.reduce((sum, s) => sum + s.itemCount, 0);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2 min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">Your Content</h1>
          <p className="text-muted-foreground">
            Add the products, offers, and bookings your customers will see in
            chat. We&apos;ll handle the rest.
          </p>
        </div>
        {partnerId && user?.uid && (
          <TestChatSeedSampleCTA
            partnerId={partnerId}
            userId={user.uid}
            onSeeded={() => {
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
        <ErrorBanner message={state?.error ?? 'Could not load your content.'} />
      )}

      {!loading && state?.success && visibleSchemas.length === 0 && (
        <EmptyState />
      )}

      {!loading && state?.success && visibleSchemas.length > 0 && (
        <>
          {totalItems > 0 && (
            <div className="rounded-lg border bg-muted/20 px-4 py-3 text-sm">
              <strong>{totalItems.toLocaleString()}</strong> live{' '}
              {totalItems === 1 ? 'item' : 'items'} across your content.
            </div>
          )}

          <div className="space-y-8">
            {orderedCategories().map((category) => {
              const schemas = grouped.get(category) ?? [];
              if (schemas.length === 0) return null;
              return (
                <CategorySection
                  key={category}
                  category={category}
                  schemas={schemas}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function groupByCategory(
  schemas: PartnerSchemaCard[],
): Map<ContentCategory, PartnerSchemaCard[]> {
  const out = new Map<ContentCategory, PartnerSchemaCard[]>();
  for (const s of schemas) {
    const list = out.get(s.contentCategory) ?? [];
    list.push(s);
    out.set(s.contentCategory, list);
  }
  return out;
}

function CategorySection({
  category,
  schemas,
}: {
  category: ContentCategory;
  schemas: PartnerSchemaCard[];
}) {
  const meta = CONTENT_CATEGORY_META[category];
  const Icon = ICON_MAP[meta.icon];
  const totalItems = schemas.reduce((sum, s) => sum + s.itemCount, 0);

  return (
    <section>
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">{meta.label}</h2>
          {totalItems > 0 && (
            <span className="text-xs text-muted-foreground">
              · {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-3">{meta.description}</p>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {schemas.map((s) => (
          <SchemaTile key={s.slug} schema={s} categorySingular={meta.singular} />
        ))}
      </div>
    </section>
  );
}

function SchemaTile({
  schema,
  categorySingular,
}: {
  schema: PartnerSchemaCard;
  categorySingular: string;
}) {
  const hasItems = schema.itemCount > 0;
  const previews = schema.previewItems ?? [];
  return (
    <Link
      href={`/partner/relay/data/${schema.slug}`}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
    >
      <div
        className={[
          'rounded-lg border bg-card p-4 transition-colors hover:border-foreground/30 flex flex-col h-full',
          hasItems ? '' : 'border-dashed',
        ].join(' ')}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate" title={schema.displayName}>
              {schema.displayName}
            </div>
            {schema.description && (
              <p
                className="text-xs text-muted-foreground mt-1 line-clamp-2"
                title={schema.description}
              >
                {schema.description}
              </p>
            )}
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
        </div>

        <div className="mt-3 text-[11px]">
          {hasItems ? (
            <span className="text-emerald-700 font-medium">
              <strong>{schema.itemCount}</strong>{' '}
              {schema.itemCount === 1 ? 'item' : 'items'} live
            </span>
          ) : (
            <span className="text-muted-foreground">No {categorySingular}s yet</span>
          )}
        </div>

        <AppearsInRow appearsIn={schema.appearsIn} />

        {previews.length > 0 && (
          <ul className="mt-3 pt-3 border-t space-y-1">
            {previews.map((p) => (
              <li key={p.id} className="text-[11px] truncate" title={p.name}>
                <span className="text-foreground">{p.name}</span>
                {p.subtitle && (
                  <span className="text-muted-foreground"> · {p.subtitle}</span>
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

        {!hasItems && (
          <div className="mt-auto pt-3 flex items-center gap-1 text-xs text-foreground/70 group-hover:text-foreground">
            <Plus className="h-3 w-3" />
            Add {categorySingular}
          </div>
        )}
      </div>
    </Link>
  );
}

function AppearsInRow({
  appearsIn,
}: {
  appearsIn?: Array<{ id: string; label: string }>;
}) {
  if (!appearsIn || appearsIn.length === 0) return null;
  // Cap visible labels so the tile stays scannable; everything beyond
  // the cap collapses into a "+N more" — the full list is admin-side
  // concern, not partner-facing.
  const VISIBLE = 2;
  const visible = appearsIn.slice(0, VISIBLE);
  const overflow = appearsIn.length - visible.length;
  return (
    <div className="mt-2 text-[10px] text-muted-foreground line-clamp-1">
      <span className="uppercase tracking-wide font-semibold mr-1">
        Appears in
      </span>
      {visible.map((b, i) => (
        <span key={b.id}>
          {i > 0 ? ', ' : ''}
          <span className="font-medium text-foreground/80">{b.label}</span>
        </span>
      ))}
      {overflow > 0 && (
        <span className="ml-1 italic">+{overflow} more</span>
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

  const { partnerCategoryLabel, partnerCountry, partnerCurrency } = state;
  const noIdentity =
    !partnerCategoryLabel && !partnerCountry && !partnerCurrency;

  if (noIdentity) {
    return (
      <Card className="border-amber-300 bg-amber-50/40">
        <CardContent className="py-3 flex items-center gap-3 text-sm">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="text-amber-900">
            Set your <strong>Business Identity</strong> in Settings so we can
            tailor the right content for your business.
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
      <CardContent className="py-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs">
        {partnerCategoryLabel && (
          <Pill icon={<Building2 className="h-3.5 w-3.5" />} label={partnerCategoryLabel} />
        )}
        {partnerCountry && (
          <Pill icon={<Globe className="h-3.5 w-3.5" />} label={partnerCountry} />
        )}
        {partnerCurrency && (
          <Pill icon={<DollarSign className="h-3.5 w-3.5" />} label={partnerCurrency} />
        )}
        <Link
          href="/partner/settings"
          className="ml-auto text-[11px] text-muted-foreground hover:text-foreground hover:underline"
        >
          Edit
        </Link>
      </CardContent>
    </Card>
  );
}

function Pill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-muted-foreground">{icon}</span>
      <span className="font-medium">{label}</span>
    </span>
  );
}

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 text-center text-sm text-muted-foreground space-y-3">
        <Package className="h-8 w-8 mx-auto text-muted-foreground/60" />
        <p>
          Nothing to manage yet. Once your business identity is set up, we&apos;ll
          show you the content sections that fit your business.
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
