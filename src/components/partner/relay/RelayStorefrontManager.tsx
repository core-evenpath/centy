'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  getPartnerBlockConfigsAction,
  togglePartnerBlockVisibilityAction,
  reorderPartnerBlocksAction,
  removePartnerBlockAction,
  updatePartnerBlockAction,
} from '@/actions/relay-block-actions';
import type { PartnerBlockConfig } from '@/actions/relay-block-actions';
import { BlockRenderer } from '@/components/relay/blocks';
import { DEFAULT_THEME } from '@/components/relay/blocks/types';
import type { RelayTheme, RelayBlock } from '@/components/relay/blocks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Eye, EyeOff, ChevronUp, ChevronDown, Trash2,
  Loader2, Layers, Pencil, X, Save,
} from 'lucide-react';
import { toast } from 'sonner';

interface RelayStorefrontManagerProps {
  partnerId: string;
  accentColor: string;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b]
    .map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
    .join('');
}

function buildTheme(accent: string): RelayTheme {
  const [r, g, b] = hexToRgb(accent);
  return {
    ...DEFAULT_THEME,
    accent,
    accentHi: rgbToHex(r + 30, g + 30, b + 30),
    accentDk: rgbToHex(r - 25, g - 25, b - 25),
    accentBg: `rgba(${r},${g},${b},0.06)`,
    accentBg2: `rgba(${r},${g},${b},0.13)`,
  };
}

export default function RelayStorefrontManager({ partnerId, accentColor }: RelayStorefrontManagerProps) {
  const [blocks, setBlocks] = useState<PartnerBlockConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');

  const theme = useMemo(() => buildTheme(accentColor || '#6366f1'), [accentColor]);

  const selectedBlock = useMemo(
    () => blocks.find(b => b.id === selectedId) ?? null,
    [blocks, selectedId],
  );

  const visibleCount = useMemo(() => blocks.filter(b => b.isVisible).length, [blocks]);
  const hiddenCount = blocks.length - visibleCount;

  const loadBlocks = useCallback(async () => {
    try {
      const result = await getPartnerBlockConfigsAction(partnerId);
      if (result.success) {
        setBlocks(result.blocks);
      } else {
        toast.error(result.error || 'Failed to load blocks');
      }
    } catch {
      toast.error('Failed to load blocks');
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  useEffect(() => {
    loadBlocks();
  }, [loadBlocks]);

  useEffect(() => {
    if (selectedBlock) {
      setEditLabel(selectedBlock.customLabel || selectedBlock.label);
    }
  }, [selectedBlock]);

  const handleToggle = async (blockId: string, isVisible: boolean) => {
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, isVisible } : b));
    try {
      await togglePartnerBlockVisibilityAction(partnerId, blockId, isVisible);
      toast.success(isVisible ? 'Block shown' : 'Block hidden');
    } catch {
      setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, isVisible: !isVisible } : b));
      toast.error('Failed to toggle visibility');
    }
  };

  const moveBlock = async (index: number, direction: -1 | 1) => {
    const newBlocks = [...blocks];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    setBlocks(newBlocks);
    const orderedIds = newBlocks.map(b => b.id);
    try {
      await reorderPartnerBlocksAction(partnerId, orderedIds);
    } catch {
      toast.error('Failed to reorder blocks');
      await loadBlocks();
    }
  };

  const handleSaveLabel = async () => {
    if (!selectedBlock) return;
    try {
      const result = await updatePartnerBlockAction(partnerId, selectedBlock.id, {
        customLabel: editLabel,
      });
      if (result.success) {
        setBlocks(prev =>
          prev.map(b => b.id === selectedBlock.id ? { ...b, customLabel: editLabel } : b),
        );
        toast.success('Label updated');
      } else {
        toast.error(result.error || 'Failed to update label');
      }
    } catch {
      toast.error('Failed to update label');
    }
  };

  const handleDelete = async (blockId: string) => {
    if (!confirm('Remove this block from your storefront?')) return;
    try {
      const result = await removePartnerBlockAction(partnerId, blockId);
      if (result.success) {
        setBlocks(prev => prev.filter(b => b.id !== blockId));
        if (selectedId === blockId) setSelectedId(null);
        toast.success('Block removed');
      } else {
        toast.error(result.error || 'Failed to remove block');
      }
    } catch {
      toast.error('Failed to remove block');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (blocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <Layers className="h-12 w-12 text-muted-foreground" />
        <div>
          <p className="font-semibold text-lg">No storefront blocks yet</p>
          <p className="text-sm text-muted-foreground">
            No blocks are configured for this storefront.
          </p>
        </div>
      </div>
    );
  }

  const mockBlock: RelayBlock | null = selectedBlock
    ? { type: selectedBlock.blockType, ...selectedBlock.blockTypeTemplate?.sampleData }
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg">Storefront Blocks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {blocks.map((block, index) => (
                <div
                  key={block.id}
                  onClick={() => setSelectedId(block.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    block.id === selectedId ? 'border-primary bg-accent/5' : 'hover:bg-muted/50'
                  } ${!block.isVisible ? 'opacity-50' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">
                        {block.customLabel || block.label}
                      </span>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {block.blockType}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{block.category}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={index === 0}
                      onClick={(e) => { e.stopPropagation(); moveBlock(index, -1); }}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={index === blocks.length - 1}
                      onClick={(e) => { e.stopPropagation(); moveBlock(index, 1); }}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Switch
                      checked={block.isVisible}
                      onCheckedChange={(checked) => { handleToggle(block.id, checked); }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              {visibleCount} visible · {hiddenCount} hidden
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedBlock && mockBlock ? (
              <div className="space-y-4">
                <div className="max-w-[360px] bg-[#FAFAF6] rounded-2xl p-4 border">
                  {selectedBlock.blockTypeTemplate?.sampleData ? (
                    <BlockRenderer block={mockBlock} theme={theme} />
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No preview available
                    </p>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      placeholder="Custom label"
                      className="text-sm"
                    />
                    <Button size="sm" onClick={handleSaveLabel}>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(selectedBlock.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Select a block to preview
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
