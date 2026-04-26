'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
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
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'date', label: 'Date' },
  { value: 'time', label: 'Time' },
  { value: 'image', label: 'Image' },
  { value: 'select', label: 'Select' },
  { value: 'multi_select', label: 'Multi-select' },
  { value: 'tags', label: 'Tags' },
  { value: 'toggle', label: 'Toggle' },
];

// Numeric-ish types use min/max; string-ish types use length+pattern.
// Toggle/date/time/image/select/etc. don't expose validation hints
// here — keeps the form scoped to what the partner-side ItemEditor
// actually applies.
const NUMERIC_TYPES = new Set<ModuleFieldDefinition['type']>([
  'number',
  'currency',
  'duration',
]);
const STRING_TYPES = new Set<ModuleFieldDefinition['type']>([
  'text',
  'textarea',
  'url',
  'email',
  'phone',
]);

function fieldToDraft(f: ModuleFieldDefinition): FieldDraft {
  return {
    name: f.name,
    type: f.type as FieldDraft['type'],
    isRequired: !!f.isRequired,
    isSearchable: !!f.isSearchable,
    showInList: !!f.showInList,
    showInCard: !!f.showInCard,
    options: f.options ? [...f.options] : undefined,
    description: f.description ?? '',
    placeholder: f.placeholder ?? '',
    defaultValue: f.defaultValue,
    validation: f.validation ? { ...f.validation } : undefined,
    conditionalOn: f.conditionalOn ? { ...f.conditionalOn } : undefined,
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
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const updateRow = (idx: number, patch: Partial<FieldDraft>) => {
    setDrafts((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  const updateValidation = (
    idx: number,
    patch: Partial<NonNullable<FieldDraft['validation']>>,
  ) => {
    setDrafts((prev) =>
      prev.map((row, i) =>
        i === idx
          ? { ...row, validation: { ...(row.validation ?? {}), ...patch } }
          : row,
      ),
    );
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
    setExpandedRows((prev) => {
      const next = new Set<number>();
      // After splice, indices shift. Drop expanded entries past `idx`
      // and decrement those past it. Simpler to rebuild empty.
      for (const i of prev) {
        if (i < idx) next.add(i);
        else if (i > idx) next.add(i - 1);
      }
      return next;
    });
  };

  const toggleExpanded = (idx: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
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
        description: '',
        placeholder: '',
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
            const isNumeric = NUMERIC_TYPES.has(row.type);
            const isString = STRING_TYPES.has(row.type);
            const isExpanded = expandedRows.has(idx);
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

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Description (admin/partner help)
                    </label>
                    <Input
                      value={row.description ?? ''}
                      onChange={(e) =>
                        updateRow(idx, { description: e.target.value })
                      }
                      placeholder="e.g. Short product summary used in cards"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Placeholder (partner input)
                    </label>
                    <Input
                      value={row.placeholder ?? ''}
                      onChange={(e) =>
                        updateRow(idx, { placeholder: e.target.value })
                      }
                      placeholder="e.g. Enter a short tagline"
                      className="h-8 text-sm"
                    />
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

                <button
                  type="button"
                  onClick={() => toggleExpanded(idx)}
                  className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  Advanced (default value, validation)
                </button>

                {isExpanded && (
                  <div className="rounded border border-dashed bg-background/40 p-2 space-y-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Default value
                      </label>
                      <Input
                        value={
                          row.defaultValue === undefined || row.defaultValue === null
                            ? ''
                            : String(row.defaultValue)
                        }
                        onChange={(e) =>
                          updateRow(idx, {
                            defaultValue:
                              e.target.value === '' ? undefined : e.target.value,
                          })
                        }
                        placeholder="Optional fallback when partner leaves it blank"
                        className="h-8 text-sm"
                      />
                    </div>

                    {isNumeric && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Min
                          </label>
                          <Input
                            type="number"
                            value={row.validation?.min ?? ''}
                            onChange={(e) =>
                              updateValidation(idx, {
                                min:
                                  e.target.value === ''
                                    ? undefined
                                    : Number(e.target.value),
                              })
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Max
                          </label>
                          <Input
                            type="number"
                            value={row.validation?.max ?? ''}
                            onChange={(e) =>
                              updateValidation(idx, {
                                max:
                                  e.target.value === ''
                                    ? undefined
                                    : Number(e.target.value),
                              })
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    )}

                    {isString && (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                              Min length
                            </label>
                            <Input
                              type="number"
                              value={row.validation?.minLength ?? ''}
                              onChange={(e) =>
                                updateValidation(idx, {
                                  minLength:
                                    e.target.value === ''
                                      ? undefined
                                      : Number(e.target.value),
                                })
                              }
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                              Max length
                            </label>
                            <Input
                              type="number"
                              value={row.validation?.maxLength ?? ''}
                              onChange={(e) =>
                                updateValidation(idx, {
                                  maxLength:
                                    e.target.value === ''
                                      ? undefined
                                      : Number(e.target.value),
                                })
                              }
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Pattern (regex)
                          </label>
                          <Input
                            value={row.validation?.pattern ?? ''}
                            onChange={(e) =>
                              updateValidation(idx, {
                                pattern:
                                  e.target.value === '' ? undefined : e.target.value,
                              })
                            }
                            placeholder="e.g. ^[A-Z]{2,3}$"
                            className="h-8 text-sm font-mono"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
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
