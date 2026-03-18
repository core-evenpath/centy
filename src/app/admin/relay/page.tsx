'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Zap, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RelayBlockList } from '@/components/admin/relay/RelayBlockList';
import { getRelayBlockConfigs } from '@/actions/relay-block-actions';
import type { RelayBlockConfig } from '@/lib/types-relay';

type FilterTab = 'all' | 'data-driven' | 'functional' | 'draft';

const DATA_DRIVEN_TYPES = ['rooms', 'compare', 'activities', 'gallery', 'info', 'menu', 'services'];
const FUNCTIONAL_TYPES = ['book', 'contact', 'location', 'text'];

export default function AdminRelayPage() {
  const [configs, setConfigs] = useState<RelayBlockConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const loadConfigs = useCallback(async () => {
    setIsLoading(true);
    const result = await getRelayBlockConfigs();
    if (result.success && result.configs) {
      setConfigs(result.configs);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  const filteredConfigs = configs.filter((c) => {
    if (activeTab === 'data-driven') return DATA_DRIVEN_TYPES.includes(c.blockType);
    if (activeTab === 'functional') return FUNCTIONAL_TYPES.includes(c.blockType);
    if (activeTab === 'draft') return c.status === 'draft';
    return true;
  });

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Relay Blocks</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Block configs auto-generated with modules. Manage and edit them here.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={loadConfigs} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/admin/modules/new">
              Generate via Modules
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)}>
          <TabsList>
            <TabsTrigger value="all">All ({configs.length})</TabsTrigger>
            <TabsTrigger value="data-driven">
              Data-driven ({configs.filter(c => DATA_DRIVEN_TYPES.includes(c.blockType)).length})
            </TabsTrigger>
            <TabsTrigger value="functional">
              Functional ({configs.filter(c => FUNCTIONAL_TYPES.includes(c.blockType)).length})
            </TabsTrigger>
            <TabsTrigger value="draft">
              Draft ({configs.filter(c => c.status === 'draft').length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <RelayBlockList configs={filteredConfigs} onRefresh={loadConfigs} />
        )}
      </div>
    </div>
  );
}
