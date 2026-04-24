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
import SchemaFieldsTable from './SchemaFieldsTable';
import SchemaConsumersPanel from './SchemaConsumersPanel';

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SchemaFieldsTable schema={schema} />
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
