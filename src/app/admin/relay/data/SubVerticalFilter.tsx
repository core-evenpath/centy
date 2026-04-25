'use client';

import { useMemo } from 'react';
import { Layers } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ALL_SUB_VERTICALS_DATA } from '@/app/admin/relay/blocks/previews/_registry-data';

// ── Sub-vertical filter ─────────────────────────────────────────────
//
// Mirrors what /admin/relay/flows surfaces: every sub-vertical from
// the block registry, grouped by industry/vertical. Selecting one
// narrows the analytics view to schemas whose blocks are referenced
// by that sub-vertical (via SubVertical.blocks → block.module).
//
// Stays a select rather than pill rows because there are 80+
// sub-verticals — pills would explode the layout.

interface Props {
  active: string | null;
  onChange: (subVerticalId: string | null) => void;
}

export default function SubVerticalFilter({ active, onChange }: Props) {
  const grouped = useMemo(() => {
    const byVertical = new Map<string, Array<{ id: string; name: string }>>();
    for (const sv of ALL_SUB_VERTICALS_DATA) {
      const v = sv.industryId ?? 'shared';
      if (!byVertical.has(v)) byVertical.set(v, []);
      byVertical.get(v)!.push({
        id: sv.id,
        name: sv.name ?? sv.id,
      });
    }
    // Stable sort: vertical alpha, sub-vertical name alpha within.
    return Array.from(byVertical.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([vertical, subs]) => [
        vertical,
        subs.slice().sort((a, b) => a.name.localeCompare(b.name)),
      ] as const);
  }, []);

  const totalCount = useMemo(
    () => grouped.reduce((sum, [, subs]) => sum + subs.length, 0),
    [grouped],
  );

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Layers className="h-4 w-4 text-muted-foreground" />
      <Select
        value={active ?? 'all'}
        onValueChange={(v) => onChange(v === 'all' ? null : v)}
      >
        <SelectTrigger className="h-8 w-[260px] text-xs">
          <SelectValue placeholder={`All sub-verticals (${totalCount})`} />
        </SelectTrigger>
        <SelectContent className="max-h-[400px]">
          <SelectItem value="all">All sub-verticals ({totalCount})</SelectItem>
          {grouped.map(([vertical, subs]) => (
            <SelectGroup key={vertical}>
              <SelectLabel className="text-[10px] uppercase tracking-wide">
                {vertical}
              </SelectLabel>
              {subs.map((sv) => (
                <SelectItem key={sv.id} value={sv.id}>
                  {sv.name}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
