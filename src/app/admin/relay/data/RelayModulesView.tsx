'use client';

// ── Client orchestrator for /admin/relay/data ───────────────────────────
//
// Owns the vertical filter + active tab state, then hands the
// filtered rows to the card components. Stays thin — each card lives
// in its own file.

import { useMemo, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { RelayModuleAnalytics } from '@/lib/relay/module-analytics-types';
import SummaryCards from './SummaryCards';
import VerticalFilter from './VerticalFilter';
import DarkBlockCard from './DarkBlockCard';
import ConnectedBlockCard from './ConnectedBlockCard';
import ModuleCard from './ModuleCard';
import ModuleLessSection from './ModuleLessSection';

interface Props {
  data: RelayModuleAnalytics;
}

export default function RelayModulesView({ data }: Props) {
  const [verticalFilter, setVerticalFilter] = useState<string | null>(null);

  const verticals = useMemo(() => {
    const set = new Set<string>();
    [...data.connectedBlocks, ...data.darkBlocks].forEach((b) =>
      b.verticals.forEach((v) => set.add(v)),
    );
    return Array.from(set).sort();
  }, [data.connectedBlocks, data.darkBlocks]);

  // PR D: split `connectedBlocks` into "truly connected" (module-backed
  // with items) and "module-less" (module === null). The upstream
  // analytics action still returns both under `connectedBlocks` so the
  // old UI didn't break on PR B — we rebucket client-side here.
  const trulyConnected = useMemo(
    () => data.connectedBlocks.filter((b) => b.moduleSlug !== null),
    [data.connectedBlocks],
  );
  const moduleLess = useMemo(
    () => data.connectedBlocks.filter((b) => b.moduleSlug === null),
    [data.connectedBlocks],
  );

  const filterByVertical = <T extends { verticals: string[] }>(
    rows: T[],
  ): T[] =>
    verticalFilter ? rows.filter((r) => r.verticals.includes(verticalFilter)) : rows;

  const filteredConnected = useMemo(
    () => filterByVertical(trulyConnected),
    [trulyConnected, verticalFilter],
  );
  const filteredDark = useMemo(
    () => filterByVertical(data.darkBlocks),
    [data.darkBlocks, verticalFilter],
  );
  const filteredModuleLess = useMemo(
    () => filterByVertical(moduleLess),
    [moduleLess, verticalFilter],
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

      <VerticalFilter
        verticals={verticals}
        active={verticalFilter}
        onChange={setVerticalFilter}
      />

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
