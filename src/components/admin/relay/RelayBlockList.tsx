'use client';

import { useEffect, useState } from 'react';
import { getRelayBlockConfigs, deleteRelayBlockConfig, updateRelayBlockConfig } from '@/actions/relay-admin-actions';
import type { RelayBlockConfig } from '@/lib/types-relay';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, Trash2, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export function RelayBlockList() {
  const [configs, setConfigs] = useState<RelayBlockConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    const result = await getRelayBlockConfigs();
    if (result.success && result.configs) {
      setConfigs(result.configs);
    } else {
      setError(result.error || 'Failed to load');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this block config?')) return;
    await deleteRelayBlockConfig(id);
    load();
  };

  const handleToggleStatus = async (config: RelayBlockConfig) => {
    await updateRelayBlockConfig(config.id, {
      status: config.status === 'active' ? 'draft' : 'active',
    });
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive py-4">{error}</div>;
  }

  if (configs.length === 0) {
    return (
      <div className="border-2 border-dashed border-muted rounded-xl p-12 text-center">
        <p className="text-muted-foreground mb-4">No relay block configs yet.</p>
        <div className="flex gap-2 justify-center">
          <Button asChild variant="outline">
            <Link href="/admin/relay/generator">Use AI Generator</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/relay/new">Create Manually</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Block Type</TableHead>
          <TableHead>Label</TableHead>
          <TableHead>Industries</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {configs.map(config => (
          <TableRow key={config.id}>
            <TableCell>
              <Badge variant="secondary" className="font-mono">{config.blockType}</Badge>
            </TableCell>
            <TableCell>
              <div>
                <p className="font-medium">{config.label}</p>
                <p className="text-xs text-muted-foreground truncate max-w-xs">{config.description}</p>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {(config.applicableIndustries || []).slice(0, 2).map(ind => (
                  <Badge key={ind} variant="outline" className="text-xs">{ind}</Badge>
                ))}
                {(config.applicableIndustries || []).length > 2 && (
                  <Badge variant="outline" className="text-xs">+{config.applicableIndustries.length - 2}</Badge>
                )}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={config.status === 'active' ? 'default' : 'secondary'}>
                {config.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleToggleStatus(config)}
                  title={config.status === 'active' ? 'Deactivate' : 'Activate'}
                >
                  {config.status === 'active'
                    ? <ToggleRight className="w-4 h-4 text-green-600" />
                    : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/admin/relay/${config.id}`}>
                    <Pencil className="w-4 h-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(config.id)}
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
