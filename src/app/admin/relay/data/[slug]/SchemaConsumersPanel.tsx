import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ServerBlockData } from '@/app/admin/relay/blocks/previews/_registry-data';
import type { BlockTag } from '@/lib/relay/engine-types';
import EngineChips from '../EngineChips';

// ── Schema consumers sidebar ────────────────────────────────────────
//
// Shows which blocks consume this Relay schema + which engines they
// belong to. Block.reads[] is the authoritative field list (from
// PR C), so listing them here tells the admin exactly which
// contracts this schema has to satisfy.

interface Props {
  moduleSlug: string;
  blocks: ServerBlockData[];
  engines: BlockTag[];
}

export default function SchemaConsumersPanel({
  moduleSlug,
  blocks,
  engines,
}: Props) {
  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Consumers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
            Engines
          </div>
          <EngineChips engines={engines} emptyLabel="No engines tagged" />
        </div>

        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
            Blocks ({blocks.length})
          </div>
          {blocks.length === 0 ? (
            <p className="text-[11px] text-muted-foreground italic">
              No blocks bind <code>{moduleSlug}</code> in the registry.
            </p>
          ) : (
            <div className="space-y-2">
              {blocks.map((b) => (
                <div
                  key={b.id}
                  className="rounded-md border bg-muted/30 px-2.5 py-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium truncate" title={b.label}>
                      {b.label}
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {b.family}
                    </Badge>
                  </div>
                  {b.reads && b.reads.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {b.reads.map((r) => (
                        <span
                          key={r}
                          className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium border bg-background"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
