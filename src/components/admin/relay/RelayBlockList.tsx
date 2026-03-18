'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit, Trash2, Zap, Database, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RelayBlockConfig } from '@/lib/types-relay';
import { updateRelayBlockConfig, deleteRelayBlockConfig } from '@/actions/relay-block-actions';
import { toast } from 'sonner';

const BLOCK_TYPE_ICONS: Record<string, string> = {
  rooms: '🛏️',
  book: '📅',
  compare: '⚖️',
  activities: '🎯',
  location: '📍',
  contact: '💬',
  gallery: '🖼️',
  info: 'ℹ️',
  menu: '🍽️',
  services: '💼',
  text: '📝',
};

interface RelayBlockListProps {
  configs: RelayBlockConfig[];
  onRefresh: () => void;
}

export function RelayBlockList({ configs, onRefresh }: RelayBlockListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleToggleStatus = async (config: RelayBlockConfig) => {
    setLoadingId(config.id);
    const newStatus = config.status === 'active' ? 'draft' : 'active';
    const result = await updateRelayBlockConfig(config.id, { status: newStatus });
    if (result.success) {
      toast.success(`Block ${newStatus === 'active' ? 'activated' : 'drafted'}`);
      onRefresh();
    } else {
      toast.error(result.error || 'Update failed');
    }
    setLoadingId(null);
  };

  const handleDelete = async (config: RelayBlockConfig) => {
    if (!confirm(`Delete block "${config.label}"? This cannot be undone.`)) return;
    setLoadingId(config.id);
    const result = await deleteRelayBlockConfig(config.id);
    if (result.success) {
      toast.success('Block deleted');
      onRefresh();
    } else {
      toast.error(result.error || 'Delete failed');
    }
    setLoadingId(null);
  };

  if (configs.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Zap className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <p className="text-lg font-medium">No relay blocks yet</p>
        <p className="text-sm mt-2 max-w-sm mx-auto">
          Relay blocks are generated automatically when you create modules in{' '}
          <Link href="/admin/modules" className="text-indigo-600 hover:underline">
            /admin/modules
          </Link>
          . Go create a module to see blocks here.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Label</TableHead>
          <TableHead>Source Module</TableHead>
          <TableHead>Industries</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {configs.map((config) => (
          <TableRow key={config.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                <span className="text-lg">{BLOCK_TYPE_ICONS[config.blockType] || '🧩'}</span>
                <Badge variant="outline" className="font-mono text-xs">
                  {config.blockType}
                </Badge>
              </div>
            </TableCell>
            <TableCell>
              <div>
                <p className="font-medium">{config.label}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{config.description}</p>
              </div>
            </TableCell>
            <TableCell>
              {config.sourceModuleSlug ? (
                <div className="flex items-center gap-1">
                  <Database className="w-3 h-3 text-muted-foreground" />
                  <span className="font-mono text-xs">{config.sourceModuleSlug}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Wrench className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Functional</span>
                </div>
              )}
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {config.applicableIndustries.slice(0, 2).map((ind) => (
                  <Badge key={ind} variant="secondary" className="text-xs">
                    {ind}
                  </Badge>
                ))}
                {config.applicableIndustries.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{config.applicableIndustries.length - 2}
                  </Badge>
                )}
              </div>
            </TableCell>
            <TableCell>
              <Switch
                checked={config.status === 'active'}
                onCheckedChange={() => handleToggleStatus(config)}
                disabled={loadingId === config.id}
              />
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/admin/relay/${config.id}`}>
                    <Edit className="w-4 h-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(config)}
                  disabled={loadingId === config.id}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
