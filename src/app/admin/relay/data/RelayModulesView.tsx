'use client';

// ── Client orchestrator for /admin/relay/data ───────────────────────────
//
// Owns the vertical + sub-vertical filter and active-tab state, then
// hands the filtered rows to the card components. Stays thin — each
// card lives in its own file.

import { useMemo, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { RelayModuleAnalytics } from '@/lib/relay/module-analytics-types';
import { ALL_SUB_VERTICALS_DATA } from '@/app/admin/relay/blocks/previews/_registry-data';
import SummaryCards from './SummaryCards';
import VerticalFilter from './VerticalFilter';
import SubVerticalFilter from './SubVerticalFilter';
import DarkBlockCard from './DarkBlockCard';
import ConnectedBlockCard from './ConnectedBlockCard';
import ModuleCard from './ModuleCard';
import ModuleLessSection from './ModuleLessSection';

interface Props {
  data: RelayModuleAnalytics;
}

export default function RelayModulesView({ data }: Props) {
  const [verticalFilter, setVerticalFilter] = useState<string | null>(null);
  const [subVerticalFilter, setSubVerticalFilter] = useState<string | null>(null);

  const verticals = useMemo(() => {
    const set = new Set<string>();
    [...data.connectedBlocks, ...data.darkBlocks].forEach((b) =>
      b.verticals.forEach((v) => set.add(v)),
    );
    return Array.from(set).sort();
  }, [data.connectedBlocks, data.darkBlocks]);

  // Sub-vertical → allowed block IDs. When a sub-vertical is selected,
  // only bindings whose blockId appears in that sub-vertical's
  // `blocks: string[]` survive the filter.
  const allowedBlockIds = useMemo(() => {
    if (!subVerticalFilter) return null;
    const sv = ALL_SUB_VERTICALS_DATA.find((s) => s.id === subVerticalFilter);
    return sv ? new Set(sv.blocks) : null;
  }, [subVerticalFilter]);

  const trulyConnected = useMemo(
    () => data.connectedBlocks.filter((b) => b.moduleSlug !== null),
    [data.connectedBlocks],
  );
  const moduleLess = useMemo(
    () => data.connectedBlocks.filter((b) => b.moduleSlug === null),
    [data.connectedBlocks],
  );

  const filterRows = <T extends { verticals: string[]; blockId: string }>(
    rows: T[],
  ): T[] => {
    let out = rows;
    if (verticalFilter) {
      out = out.filter((r) => r.verticals.includes(verticalFilter));
    }
    if (allowedBlockIds) {
      out = out.filter((r) => allowedBlockIds.has(r.blockId));
    }
    return out;
  };

  const filteredConnected = useMemo(
    () => filterRows(trulyConnected),
    [trulyConnected, verticalFilter, allowedBlockIds],
  );
  const filteredDark = useMemo(
    () => filterRows(data.darkBlocks),
    [data.darkBlocks, verticalFilter, allowedBlockIds],
  );
  const filteredModuleLess = useMemo(
    () => filterRows(moduleLess),
    [moduleLess, verticalFilter, allowedBlockIds],
  );

  // Drift count across every module-backed binding — surfaces the
  // number PR B started computing so admins can see it at a glance.
  const driftCount = useMemo(
    () =>
      [...trulyConnected, ...data.darkBlocks].filter(
        (b) => (b.driftFields?.length ?? 0) > 0,
      ).length,
    [trulyConnected, data.darkBlocks],
  );

  return (
    <div className="space-y-6">
      <SummaryCards data={data} />

      {driftCount > 0 && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          <strong>{driftCount}</strong> block{driftCount === 1 ? '' : 's'} read
          fields that aren't in their module's schema. Open any amber card
          below to see which fields are missing.
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

      <Tabs defaultValue="dark" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dark">
            Dark ({filteredDark.length})
          </TabsTrigger>
          <TabsTrigger value="connected">
            Connected ({filteredConnected.length})
          </TabsTrigger>
          <TabsTrigger value="moduleless">
            Module-less ({filteredModuleLess.length})
          </TabsTrigger>
          <TabsTrigger value="modules">
            Modules ({data.modules.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dark" className="space-y-4">
          {filteredDark.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p>No dark blocks! All module-dependent blocks have data.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDark.map((block) => (
                <DarkBlockCard key={block.blockId} block={block} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="connected" className="space-y-4">
          {filteredConnected.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground text-sm">
                No module-backed blocks with live data in this filter.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredConnected.map((block) => (
                <ConnectedBlockCard key={block.blockId} block={block} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="moduleless">
          <ModuleLessSection blocks={filteredModuleLess} />
        </TabsContent>

        <TabsContent value="modules" className="space-y-4">
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
