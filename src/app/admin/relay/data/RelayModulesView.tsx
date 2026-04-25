'use client';

// ── Client orchestrator for /admin/relay/data ───────────────────────────
//
// PR fix-7 collapsed the legacy 5-tab layout
// (Gallery / Dark / Connected / Module-less / Modules) into 2 tabs:
//   - Blocks (default) — visual gallery with inline status pills
//   - Schemas — schema-level cards (was "Modules")
//
// The old "Dark" / "Connected" / "Module-less" tabs were just status
// filters dressed up as tabs. They're replaced by status filter chips
// on the Blocks tab — admin clicks one to narrow without changing
// view. Module-less became dead post-fix-2 (every block has a module
// now). "Modules" was renamed to "Schemas" since that's what the
// underlying docs are called everywhere else.

import { useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type {
  BlockModuleBinding,
  RelayModuleAnalytics,
} from '@/lib/relay/module-analytics-types';
import { ALL_SUB_VERTICALS_DATA } from '@/app/admin/relay/blocks/previews/_registry-data';
import SummaryCards from './SummaryCards';
import VerticalFilter from './VerticalFilter';
import SubVerticalFilter from './SubVerticalFilter';
import ModuleCard from './ModuleCard';
import BlockGalleryView, { type BlockStatus } from './BlockGalleryView';

interface Props {
  data: RelayModuleAnalytics;
}

export default function RelayModulesView({ data }: Props) {
  const [verticalFilter, setVerticalFilter] = useState<string | null>(null);
  const [subVerticalFilter, setSubVerticalFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<BlockStatus | 'all'>('all');

  const verticals = useMemo(() => {
    const set = new Set<string>();
    [...data.connectedBlocks, ...data.darkBlocks].forEach((b) =>
      b.verticals.forEach((v) => set.add(v)),
    );
    return Array.from(set).sort();
  }, [data.connectedBlocks, data.darkBlocks]);

  // Sub-vertical → allowed block IDs.
  const allowedBlockIds = useMemo(() => {
    if (!subVerticalFilter) return null;
    const sv = ALL_SUB_VERTICALS_DATA.find((s) => s.id === subVerticalFilter);
    return sv ? new Set(sv.blocks) : null;
  }, [subVerticalFilter]);

  // All bindings — used by the gallery and the status counts.
  const allBindings = useMemo(
    () => [...data.connectedBlocks, ...data.darkBlocks],
    [data.connectedBlocks, data.darkBlocks],
  );

  // Apply vertical + sub-vertical filters before the gallery sees the
  // bindings. Status filter is applied inside the gallery so the
  // counts on the chips stay accurate even within a narrowed scope.
  const scopedBindings = useMemo(() => {
    let out = allBindings;
    if (verticalFilter) {
      out = out.filter((b) => b.verticals.includes(verticalFilter));
    }
    if (allowedBlockIds) {
      out = out.filter((b) => allowedBlockIds.has(b.blockId));
    }
    return out;
  }, [allBindings, verticalFilter, allowedBlockIds]);

  // Drift count across every module-backed binding — surfaces the
  // number PR B started computing. Status pills below replace the
  // legacy banner here, but we keep this as a visible signal at the
  // top of the page when any drift exists.
  const driftCount = useMemo(
    () =>
      scopedBindings.filter((b) => (b.driftFields?.length ?? 0) > 0).length,
    [scopedBindings],
  );

  return (
    <div className="space-y-6">
      <SummaryCards data={data} />

      {driftCount > 0 && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          <strong>{driftCount}</strong> block{driftCount === 1 ? '' : 's'} read
          fields that aren't in their schema. Filter by{' '}
          <button
            type="button"
            onClick={() => setStatusFilter('drift')}
            className="underline font-medium hover:no-underline"
          >
            Drift
          </button>{' '}
          on the Blocks tab to see them.
        </div>
      )}

      <div className="flex flex-col gap-2">
        <VerticalFilter
          verticals={verticals}
          active={verticalFilter}
          onChange={setVerticalFilter}
        />
        <SubVerticalFilter
          active={subVerticalFilter}
          onChange={setSubVerticalFilter}
        />
      </div>

      <Tabs defaultValue="blocks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="blocks">Blocks</TabsTrigger>
          <TabsTrigger value="schemas">
            Schemas ({data.modules.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="blocks" className="space-y-4">
          <BlockGalleryView
            bindings={scopedBindings}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        </TabsContent>

        <TabsContent value="schemas" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.modules.map((module) => (
              <ModuleCard key={module.moduleId} module={module} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
