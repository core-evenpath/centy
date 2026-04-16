'use client';

// ── Client orchestrator for /admin/relay/modules ────────────────────────
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

  const filteredConnected = useMemo(
    () =>
      verticalFilter
        ? data.connectedBlocks.filter((b) =>
            b.verticals.includes(verticalFilter),
          )
        : data.connectedBlocks,
    [data.connectedBlocks, verticalFilter],
  );

  const filteredDark = useMemo(
    () =>
      verticalFilter
        ? data.darkBlocks.filter((b) => b.verticals.includes(verticalFilter))
        : data.darkBlocks,
    [data.darkBlocks, verticalFilter],
  );

  return (
    <div className="space-y-6">
      <SummaryCards data={data} />

      <VerticalFilter
        verticals={verticals}
        active={verticalFilter}
        onChange={setVerticalFilter}
      />

      <Tabs defaultValue="dark" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dark">
            Dark Blocks ({filteredDark.length})
          </TabsTrigger>
          <TabsTrigger value="connected">
            Connected ({filteredConnected.length})
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredConnected.map((block) => (
              <ConnectedBlockCard key={block.blockId} block={block} />
            ))}
          </div>
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
