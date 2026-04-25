'use client';

// ── Block context panel (PR fix-16b) ────────────────────────────────
//
// Shows the BlockContext (schema + flow + binding) for the most
// recently fired block in the chat. Calls getBlockContextAction
// lazily — only fetches when blockId changes.
//
// Surfaces the wiring we built across the admin pages:
//   • Schema fields (from /admin/relay/data via relaySchemas)
//   • Flow membership + role (from /admin/relay/engine flow-definitions)
//   • Drift state (block reads fields not in schema)
//   • Binding override (admin can mark a block "unbound")
//
// Each surface deep-links into its admin page so admin can jump from
// "this block is firing in test-chat" to "edit its schema" or
// "see its flow happy path".

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Boxes,
  Workflow,
  Anchor,
  Hash,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getBlockContextAction } from '@/actions/relay-block-context';
import type { BlockContext } from '@/lib/relay/block-context-types';

interface Props {
  partnerId: string;
  blockId: string | null;
}

export function TestChatBlockContext({ partnerId, blockId }: Props) {
  const [context, setContext] = useState<BlockContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!blockId || !partnerId) {
      setContext(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getBlockContextAction(partnerId, blockId)
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.context) {
          setContext(res.context);
        } else {
          setError(res.error ?? 'Failed to load block context');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [partnerId, blockId]);

  if (!blockId) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-xs text-muted-foreground space-y-2">
          <Boxes className="h-6 w-6 mx-auto text-muted-foreground/60" />
          <p>
            Tap a tile or send a message to see the block's schema, flow,
            and drift here.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading && !context) {
    return (
      <Card>
        <CardContent className="py-6 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading context for {blockId}…
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/40 bg-destructive/5">
        <CardContent className="py-4 text-xs text-destructive flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </CardContent>
      </Card>
    );
  }

  if (!context) return null;

  const { block, schema, flow, binding } = context;
  const driftCount = schema?.drift.length ?? 0;
  const allRead = schema ? schema.fields.filter((f) => f.isRead).length : 0;

  return (
    <Card className="space-y-0">
      <CardContent className="py-4 space-y-4">
        {/* ── Header: block id + label ─────────────────────────────── */}
        <div className="flex items-start justify-between gap-2 pb-3 border-b">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              {block.label}
            </div>
            <code className="text-[10px] text-muted-foreground block truncate mt-0.5">
              {block.id} · {block.family} · {block.stage}
            </code>
          </div>
          {!binding.isBound && (
            <Badge
              variant="outline"
              className="text-[10px] border-slate-300 bg-slate-50 text-slate-700"
              title="Admin disabled this block ↔ schema binding."
            >
              Unbound
            </Badge>
          )}
        </div>

        {/* ── Flow ────────────────────────────────────────────────── */}
        <Section
          icon={<Workflow className="h-4 w-4" />}
          title="Transaction flow"
        >
          {flow ? (
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <Badge className="bg-foreground text-background">
                {flow.label}
              </Badge>
              {flow.role && (
                <Badge variant="outline" className="capitalize">
                  {flow.role}
                </Badge>
              )}
              {flow.required === true && (
                <Badge
                  variant="outline"
                  className="border-amber-300 bg-amber-50 text-amber-800"
                >
                  Required step
                </Badge>
              )}
              {flow.required === false && (
                <Badge variant="outline" className="text-muted-foreground">
                  Optional step
                </Badge>
              )}
              <code className="text-[10px] text-muted-foreground ml-auto">
                engine={flow.engine}
              </code>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Block is not on any flow's happy path.
            </p>
          )}
        </Section>

        {/* ── Schema ──────────────────────────────────────────────── */}
        <Section
          icon={<Boxes className="h-4 w-4" />}
          title="Schema"
          right={
            schema ? (
              <Link
                href={`/partner/relay/data/${schema.slug}`}
                className="text-[11px] text-muted-foreground hover:text-foreground hover:underline inline-flex items-center gap-1"
              >
                Open data <ExternalLink className="h-3 w-3" />
              </Link>
            ) : null
          }
        >
          {!schema ? (
            <p className="text-xs text-muted-foreground italic">
              Block has no schema binding (or relaySchemas doc not yet generated).
            </p>
          ) : (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <code className="font-medium">{schema.slug}</code>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{schema.name}</span>
                <span className="ml-auto text-muted-foreground">
                  <strong className="text-foreground">{allRead}</strong> read
                  {' '}
                  of {schema.fieldCount} field{schema.fieldCount === 1 ? '' : 's'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {schema.fields.length === 0 && (
                  <span className="text-[11px] text-amber-700 italic">
                    Schema has 0 fields — run "Generate + Enrich" in admin.
                  </span>
                )}
                {schema.fields.map((f) => (
                  <FieldChip
                    key={f.name}
                    name={f.name}
                    isRead={f.isRead}
                    isRequired={f.isRequired}
                  />
                ))}
                {schema.drift.map((name) => (
                  <FieldChip key={`drift-${name}`} name={name} drift />
                ))}
              </div>
              {driftCount > 0 ? (
                <p className="text-[11px] text-amber-700 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {driftCount} drift field{driftCount === 1 ? '' : 's'} —
                  block reads field{driftCount === 1 ? '' : 's'} not in the
                  schema.
                </p>
              ) : schema.fieldCount > 0 ? (
                <p className="text-[11px] text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> No drift — block
                  reads only schema-defined fields.
                </p>
              ) : null}
            </div>
          )}
        </Section>

        {/* ── Binding ─────────────────────────────────────────────── */}
        <Section
          icon={<Anchor className="h-4 w-4" />}
          title="Binding"
        >
          <p className="text-xs">
            {binding.isBound ? (
              <>
                <strong className="text-emerald-700">Bound</strong> — block
                reads from the schema above.
              </>
            ) : (
              <>
                <strong className="text-slate-700">Unbound</strong> — admin
                disabled this block ↔ schema binding. Block falls back to
                its design sample.
              </>
            )}
          </p>
        </Section>
      </CardContent>
    </Card>
  );
}

function Section({
  icon,
  title,
  right,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">{icon}</span>
        <span className="font-semibold uppercase tracking-wide text-[10px] text-muted-foreground">
          {title}
        </span>
        {right && <span className="ml-auto">{right}</span>}
      </div>
      <div className="pl-6">{children}</div>
    </div>
  );
}

function FieldChip({
  name,
  isRead,
  isRequired,
  drift,
}: {
  name: string;
  isRead?: boolean;
  isRequired?: boolean;
  drift?: boolean;
}) {
  const styles = drift
    ? 'border-amber-300 bg-amber-50 text-amber-800'
    : isRead
      ? 'border-blue-200 bg-blue-50 text-blue-800'
      : 'border-border bg-muted/40 text-muted-foreground';
  const title = drift
    ? `Block reads "${name}" but the schema has no such field — drift.`
    : isRead
      ? `Block reads "${name}" from the schema.${
          isRequired ? ' (required)' : ''
        }`
      : `Schema has "${name}" but this block doesn't read it.`;
  return (
    <span
      title={title}
      className={[
        'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium border',
        styles,
      ].join(' ')}
    >
      {drift && (
        <span className="h-1 w-1 rounded-full bg-amber-500" aria-hidden />
      )}
      {name}
      {isRequired && !drift && (
        <span className="text-[9px] opacity-70">*</span>
      )}
    </span>
  );
}
