import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SystemModule, ModuleFieldDefinition } from '@/lib/modules/types';

// ── Schema fields + categories table ────────────────────────────────
//
// Presentational. Renders the schema the way an admin needs to read
// it when debugging drift: field name, type, required, indexing
// flags, sort order. Categories get a second section below.

interface Props {
  schema: SystemModule;
}

export default function SchemaFieldsTable({ schema }: Props) {
  const fields: ModuleFieldDefinition[] = schema.schema?.fields ?? [];
  const categories = schema.schema?.categories ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Fields ({fields.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              Schema has no fields yet.
            </p>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <div className="grid grid-cols-[1fr_100px_60px_120px_60px] gap-0 bg-muted px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <div>Name</div>
                <div>Type</div>
                <div>Req</div>
                <div>Visible in</div>
                <div className="text-right">Order</div>
              </div>
              <div className="divide-y">
                {fields
                  .slice()
                  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                  .map((f) => (
                    <div
                      key={f.id ?? f.name}
                      className="grid grid-cols-[1fr_100px_60px_120px_60px] gap-0 px-3 py-2 text-sm items-center"
                    >
                      <div className="font-medium truncate" title={f.name}>
                        {f.name}
                      </div>
                      <div>
                        <code className="text-xs bg-slate-100 rounded px-1 py-0.5">
                          {f.type}
                        </code>
                      </div>
                      <div>
                        {f.isRequired ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] border-amber-200 text-amber-700 bg-amber-50"
                          >
                            Required
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {[
                          f.showInList && 'List',
                          f.showInCard && 'Card',
                          f.isSearchable && 'Search',
                        ]
                          .filter(Boolean)
                          .join(' · ') || '—'}
                      </div>
                      <div className="text-right text-[11px] text-muted-foreground">
                        {f.order ?? 0}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Categories ({categories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No categories defined.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <span
                  key={c.id ?? c.name}
                  className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1 text-xs"
                >
                  {c.icon && <span>{c.icon}</span>}
                  {c.name}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
