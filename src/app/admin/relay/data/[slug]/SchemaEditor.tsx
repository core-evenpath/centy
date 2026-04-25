'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  ArrowDown,
  ArrowUp,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  updateRelaySchemaFieldsAction,
  type FieldDraft,
} from '@/actions/relay-schema-edit';
import type { ModuleFieldDefinition, ModuleSchema } from '@/lib/modules/types';

// ── Schema editor (PR E10) ──────────────────────────────────────────
//
// Edit mode for /admin/relay/data/[slug]. Every existing field is
// rendered as a row of inputs; admin can edit name/type/flags,
// reorder via up/down arrows, delete a row, or append a blank row.
// "Save" sends the entire fields[] in one batch to
// updateRelaySchemaFieldsAction (overwrite semantics).
//
// Drag-and-drop reorder is intentionally deferred — up/down arrows
// keep the dependency surface small. Categories editing is also
// out of scope here; PR follow-up will tackle that.

const TYPE_OPTIONS: ReadonlyArray<{ value: ModuleFieldDefinition['type']; label: string }> = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'number', label: 'Number' },
  { value: 'currency', label: 'Currency' },
  { value: 'duration', label: 'Duration' },
  { value: 'url', label: 'URL' },
  { value: 'select', label: 'Select' },
  { value: 'multi_select', label: 'Multi-select' },
  { value: 'tags', label: 'Tags' },
  { value: 'toggle', label: 'Toggle' },
];

function fieldToDraft(f: ModuleFieldDefinition): FieldDraft {
  return {
    name: f.name,
    type: f.type as FieldDraft['type'],
    isRequired: !!f.isRequired,
    isSearchable: !!f.isSearchable,
    showInList: !!f.showInList,
    showInCard: !!f.showInCard,
    options: f.options ? [...f.options] : undefined,
  };
}

interface Props {
  slug: string;
  schema: ModuleSchema;
  onCancel: () => void;
  onSaved: () => void;
}

export default function SchemaEditor({ slug, schema, onCancel, onSaved }: Props) {
  const [drafts, setDrafts] = useState<FieldDraft[]>(() =>
    (schema.fields ?? []).map(fieldToDraft),
  );
  const [isSaving, setIsSaving] = useState(false);

  const updateRow = (idx: number, patch: Partial<FieldDraft>) => {
    setDrafts((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  const moveRow = (idx: number, direction: 'up' | 'down') => {
    setDrafts((prev) => {
      const target = direction === 'up' ? idx - 1 : idx + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = prev.slice();
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const deleteRow = (idx: number) => {
    setDrafts((prev) => prev.filter((_, i) => i !== idx));
  };

  const addRow = () => {
    setDrafts((prev) => [
      ...prev,
      {
        name: '',
        type: 'text',
        isRequired: false,
        isSearchable: false,
        showInList: false,
        showInCard: false,
      },
    ]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await updateRelaySchemaFieldsAction(slug, drafts);
      if (res.success) {
        toast.success(`Saved ${res.fieldCount} field${res.fieldCount === 1 ? '' : 's'}`);
        onSaved();
      } else {
        toast.error(res.error ?? 'Save failed');
      }
    } catch (e: any) {
      toast.error(e?.message ?? 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Edit fields ({drafts.length})</CardTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onCancel} disabled={isSaving}>
              <X className="mr-1 h-3.5 w-3.5" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="mr-1 h-3.5 w-3.5" />
              )}
              {isSaving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {drafts.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No fields. Add one below.
          </p>
        ) : (
          drafts.map((row, idx) => {
            const supportsOptions = row.type === 'select' || row.type === 'multi_select';
            return (
              <div
                key={idx}
                className="rounded-md border bg-muted/20 p-3 space-y-2"
              >
                <div className="grid grid-cols-[1fr_140px_auto] gap-2 items-start">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Name (snake_case)
                    </label>
                    <Input
                      value={row.name}
                      onChange={(e) => updateRow(idx, { name: e.target.value })}
                      placeholder="e.g. variants"
                      className="h-8 text-sm font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Type
                    </label>
                    <Select
                      value={row.type}
                      onValueChange={(v) =>
                        updateRow(idx, { type: v as FieldDraft['type'] })
                      }
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-1 pt-5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => moveRow(idx, 'up')}
                      disabled={idx === 0}
                      title="Move up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => moveRow(idx, 'down')}
                      disabled={idx === drafts.length - 1}
                      title="Move down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteRow(idx)}
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {supportsOptions && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Options (comma-separated)
                    </label>
                    <Input
                      value={(row.options ?? []).join(', ')}
                      onChange={(e) =>
                        updateRow(idx, {
                          options: e.target.value.split(',').map((s) => s.trim()),
                        })
                      }
                      placeholder="e.g. small, medium, large"
                      className="h-8 text-sm"
                    />
                  </div>
                )}

                <div className="flex flex-wrap gap-3 text-xs">
                  <FlagToggle
                    label="Required"
                    checked={row.isRequired}
                    onChange={(v) => updateRow(idx, { isRequired: v })}
                  />
                  <FlagToggle
                    label="Searchable"
                    checked={row.isSearchable}
                    onChange={(v) => updateRow(idx, { isSearchable: v })}
                  />
                  <FlagToggle
                    label="Show in list"
                    checked={row.showInList}
                    onChange={(v) => updateRow(idx, { showInList: v })}
                  />
                  <FlagToggle
                    label="Show in card"
                    checked={row.showInCard}
                    onChange={(v) => updateRow(idx, { showInCard: v })}
                  />
                </div>
              </div>
            );
          })
        )}

        <Button variant="outline" size="sm" onClick={addRow} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add field
        </Button>
      </CardContent>
    </Card>
  );
}

function FlagToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}
