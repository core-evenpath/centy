// ── /admin/relay/data/[slug] ────────────────────────────────────────
//
// Read-only viewer for a single Relay schema, introduced in PR E6
// to close the UX loop created by the PR E3/E4 collection split —
// before this, the "View Module" CTAs on /admin/relay/data pointed
// at /admin/modules, which no longer owns Relay schemas.
//
// Server component. Three responsibilities:
//   1. Fetch the schema from `relaySchemas/{slug}`
//   2. Compute which blocks read this schema (via the pure graph
//      helper so we stay consistent with the analytics page)
//   3. Render fields + categories + consumer-block chips
//
// No edit capability yet — Relay schemas are infra-level, rarely
// edited, and the block registry's `reads[]` is the real driver.
// Edits land in a follow-up once the drift-aware edit story is
// designed.

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRelaySchemaBySlugAction } from '@/actions/relay-schema-read';
import { ALL_BLOCKS_DATA } from '@/app/admin/relay/blocks/previews/_registry-data';
import {
  getBlocksForModule,
  getEnginesForModule,
} from '@/lib/relay/block-module-graph';
import RelaySubNav from '../../components/RelaySubNav';
import RelayPageIntro from '../../components/RelayPageIntro';
import SchemaFieldsPanel from './SchemaFieldsPanel';
import SchemaConsumersPanel from './SchemaConsumersPanel';
import EnrichButton from './EnrichButton';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function RelaySchemaViewerPage({ params }: PageProps) {
  const { slug } = await params;
  const result = await getRelaySchemaBySlugAction(slug);

  if (!result.success || !result.data) {
    // Distinguish "doc doesn't exist" (notFound) from "Firestore
    // error" (inline message) so admins don't hit a generic 404 when
    // the real problem is deployment/permissions.
    if (result.error?.startsWith('No relaySchemas doc')) {
      notFound();
    }
    return (
      <div className="container mx-auto py-4 px-6 flex flex-col gap-4">
        <RelaySubNav />
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Error loading Relay schema: {result.error ?? 'unknown'}
        </div>
      </div>
    );
  }

  const schema = result.data;
  const consumerBlocks = getBlocksForModule(slug, ALL_BLOCKS_DATA);
  const engines = getEnginesForModule(slug, ALL_BLOCKS_DATA);

  // Surface provenance: when this schema was last derived from the
  // block registry, and when it was last enriched by AI. Helps admin
  // see freshness and trace which generation produced the current
  // shape. Both fields are optional — older docs may have neither.
  const generatedAt = (schema as unknown as { generatedFromRegistryAt?: string })
    .generatedFromRegistryAt;
  const enrichedAt = (schema as unknown as { lastEnrichedAt?: string })
    .lastEnrichedAt;
  const enrichedModel = (schema as unknown as { lastEnrichedModel?: string })
    .lastEnrichedModel;

  return (
    <div className="container mx-auto py-4 px-6 flex flex-col gap-4">
      <RelaySubNav />
      <RelayPageIntro
        title={`Schema · ${schema.name}`}
        description={`Read-only view of the Relay schema stored at relaySchemas/${slug}. Lists every field the schema exposes and every block that reads from it. Editing lands in a follow-up — until then, the block registry's reads[] annotation is the source of truth for how this schema is shaped.`}
      />

      <Button variant="ghost" className="self-start pl-0 hover:pl-0 hover:bg-transparent" asChild>
        <Link href="/admin/relay/data">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Data
        </Link>
      </Button>

      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="text-sm text-muted-foreground space-y-0.5">
          <div>
            {schema.schema?.fields?.length ?? 0} fields ·{' '}
            {consumerBlocks.length} consumer block
            {consumerBlocks.length === 1 ? '' : 's'}
          </div>
          <div className="text-[11px] text-muted-foreground/80 flex flex-wrap gap-x-3">
            {generatedAt && (
              <span title={generatedAt}>
                Generated <strong>{formatStamp(generatedAt)}</strong>
              </span>
            )}
            {enrichedAt && (
              <span title={enrichedAt}>
                AI-enriched <strong>{formatStamp(enrichedAt)}</strong>
                {enrichedModel ? ` · ${enrichedModel}` : ''}
              </span>
            )}
            {!generatedAt && !enrichedAt && (
              <span className="italic">No generation provenance recorded.</span>
            )}
          </div>
        </div>
        <EnrichButton slug={slug} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SchemaFieldsPanel slug={slug} schema={schema} />
        </div>
        <div>
          <SchemaConsumersPanel
            moduleSlug={slug}
            blocks={consumerBlocks}
            engines={engines}
          />
        </div>
      </div>
    </div>
  );
}

// Concise relative-or-absolute formatter for the provenance line.
// "5m ago" / "2h ago" / "3d ago" for recent stamps; falls back to a
// short locale date for older ones so it stays readable without
// bringing in a date library.
function formatStamp(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso;
  const diffMs = Date.now() - t;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diffMs < 30 * 1000) return 'just now';
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}m ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`;
  if (diffMs < 30 * day) return `${Math.floor(diffMs / day)}d ago`;
  return new Date(t).toLocaleDateString();
}
