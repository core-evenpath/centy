'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createRelayBlockConfig, updateRelayBlockConfig } from '@/actions/relay-admin-actions';
import type { RelayBlockConfig, RelayBlockType } from '@/lib/types-relay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const BLOCK_TYPES: RelayBlockType[] = [
  'rooms', 'book', 'compare', 'activities', 'location',
  'contact', 'gallery', 'info', 'menu', 'services', 'text'
];

const INDUSTRIES = [
  'hospitality', 'food_beverage', 'retail', 'wellness', 'travel', 'real_estate',
  'healthcare', 'education', 'finance', 'technology'
];

interface Props {
  config?: RelayBlockConfig;
}

export function RelayBlockEditor({ config }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    blockType: config?.blockType || 'text' as RelayBlockType,
    label: config?.label || '',
    description: config?.description || '',
    applicableIndustries: config?.applicableIndustries || [] as string[],
    applicableFunctions: config?.applicableFunctions || [] as string[],
    aiPromptFragment: config?.aiPromptFragment || '',
    status: config?.status || 'draft' as 'active' | 'draft',
    dataSchema: config?.dataSchema || {
      sourceCollection: 'modules',
      sourceFields: [],
      displayTemplate: 'default',
    },
  });

  const toggleIndustry = (ind: string) => {
    setForm(prev => ({
      ...prev,
      applicableIndustries: prev.applicableIndustries.includes(ind)
        ? prev.applicableIndustries.filter(i => i !== ind)
        : [...prev.applicableIndustries, ind],
    }));
  };

  const handleSave = async () => {
    if (!form.label || !form.blockType) {
      setError('Label and block type are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (config?.id) {
        await updateRelayBlockConfig(config.id, form);
      } else {
        await createRelayBlockConfig(form);
      }
      router.push('/admin/relay');
    } catch {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/relay"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Basic Info</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Block Type</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {BLOCK_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => setForm(prev => ({ ...prev, blockType: type }))}
                  className={`px-3 py-1.5 rounded-md text-sm border font-mono transition-colors ${
                    form.blockType === type
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={form.label}
              onChange={e => setForm(prev => ({ ...prev, label: e.target.value }))}
              placeholder="e.g., Room Cards"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="What does this block display?"
              rows={2}
            />
          </div>

          <div>
            <Label>Status</Label>
            <div className="flex gap-2 mt-2">
              {(['active', 'draft'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setForm(prev => ({ ...prev, status: s }))}
                  className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                    form.status === s
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Applicable Industries</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {INDUSTRIES.map(ind => (
              <Badge
                key={ind}
                variant={form.applicableIndustries.includes(ind) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleIndustry(ind)}
              >
                {ind}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>AI Prompt Fragment</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            value={form.aiPromptFragment}
            onChange={e => setForm(prev => ({ ...prev, aiPromptFragment: e.target.value }))}
            placeholder="Instructions for the AI on when and how to use this block type..."
            rows={5}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-2">
            This fragment is injected into the Relay system prompt. Be specific about when to use this block and what data to include in items[].
          </p>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Save Block Config</>}
      </Button>
    </div>
  );
}
