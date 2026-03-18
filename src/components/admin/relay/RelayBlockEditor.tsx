'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import type { RelayBlockConfig } from '@/lib/types-relay';
import { updateRelayBlockConfig } from '@/actions/relay-block-actions';
import { getSystemModuleAction } from '@/actions/modules-actions';
import type { SystemModule } from '@/lib/modules/types';

interface RelayBlockEditorProps {
  config: RelayBlockConfig;
}

export function RelayBlockEditor({ config }: RelayBlockEditorProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [linkedModule, setLinkedModule] = useState<SystemModule | null>(null);

  const [label, setLabel] = useState(config.label);
  const [description, setDescription] = useState(config.description);
  const [aiPromptFragment, setAiPromptFragment] = useState(config.aiPromptFragment);
  const [sourceFields, setSourceFields] = useState<string[]>(config.dataSchema.sourceFields);
  const [isActive, setIsActive] = useState(config.status === 'active');
  const [intentLabel, setIntentLabel] = useState(config.defaultIntent?.label || '');
  const [intentPrompt, setIntentPrompt] = useState(config.defaultIntent?.prompt || '');
  const [intentIcon, setIntentIcon] = useState(config.defaultIntent?.icon || '');

  useEffect(() => {
    if (config.sourceModuleSlug) {
      getSystemModuleAction(config.sourceModuleSlug).then((result) => {
        if (result.success && result.data) {
          setLinkedModule(result.data);
        }
      });
    }
  }, [config.sourceModuleSlug]);

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateRelayBlockConfig(config.id, {
      label,
      description,
      aiPromptFragment,
      status: isActive ? 'active' : 'draft',
      dataSchema: {
        ...config.dataSchema,
        sourceFields,
      },
      defaultIntent: config.defaultIntent
        ? {
            ...config.defaultIntent,
            label: intentLabel,
            prompt: intentPrompt,
            icon: intentIcon,
          }
        : undefined,
    });

    if (result.success) {
      toast.success('Block config updated');
      router.push('/admin/relay');
    } else {
      toast.error(result.error || 'Update failed');
    }
    setIsSaving(false);
  };

  const toggleField = (fieldId: string) => {
    setSourceFields((prev) =>
      prev.includes(fieldId) ? prev.filter((f) => f !== fieldId) : [...prev, fieldId]
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin/relay')}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <div>
          <h2 className="text-xl font-semibold">Edit Relay Block</h2>
          <p className="text-sm text-muted-foreground">
            {config.blockType} {config.sourceModuleSlug ? `— linked to ${config.sourceModuleSlug}` : '— functional block'}
          </p>
        </div>
      </div>

      {/* Read-only info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Read-only Properties</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <div>
            <span className="text-xs text-muted-foreground">Block Type</span>
            <Badge variant="outline" className="ml-2 font-mono">{config.blockType}</Badge>
          </div>
          {config.sourceModuleSlug && (
            <div>
              <span className="text-xs text-muted-foreground">Source Module</span>
              <Badge variant="secondary" className="ml-2 font-mono">{config.sourceModuleSlug}</Badge>
            </div>
          )}
          <div>
            <span className="text-xs text-muted-foreground">Industries</span>
            {config.applicableIndustries.map((i) => (
              <Badge key={i} variant="secondary" className="ml-1">{i}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Editable fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Block Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Block label"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="aiPromptFragment">AI Prompt Fragment</Label>
            <Textarea
              id="aiPromptFragment"
              value={aiPromptFragment}
              onChange={(e) => setAiPromptFragment(e.target.value)}
              rows={4}
              placeholder="Instructions for the AI on how to present this block's data..."
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              This text is injected into the Relay system prompt to guide the AI response format.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={isActive} onCheckedChange={setIsActive} id="status" />
            <Label htmlFor="status">{isActive ? 'Active' : 'Draft'}</Label>
          </div>
        </CardContent>
      </Card>

      {/* Source fields (only for data-driven blocks) */}
      {linkedModule && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Source Fields</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Select which fields from <span className="font-mono font-medium">{config.sourceModuleSlug}</span> this block should use.
            </p>
            <div className="flex flex-wrap gap-2">
              {linkedModule.schema.fields.map((field) => (
                <button
                  key={field.id}
                  onClick={() => toggleField(field.id)}
                  className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                    sourceFields.includes(field.id)
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="font-mono text-xs text-muted-foreground mr-1">{field.id}</span>
                  {field.name}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Default intent config */}
      {config.defaultIntent !== undefined && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Default Intent Chip</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Icon (emoji)</Label>
              <Input value={intentIcon} onChange={(e) => setIntentIcon(e.target.value)} maxLength={2} />
            </div>
            <div className="space-y-2">
              <Label>Label (max 12 chars)</Label>
              <Input value={intentLabel} onChange={(e) => setIntentLabel(e.target.value)} maxLength={12} />
            </div>
            <div className="space-y-2 col-span-1">
              <Label>Prompt</Label>
              <Input value={intentPrompt} onChange={(e) => setIntentPrompt(e.target.value)} />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
