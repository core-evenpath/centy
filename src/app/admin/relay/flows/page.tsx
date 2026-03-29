'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
} from '@/components/ui/dialog';
import FlowVisualization from '@/components/partner/relay/FlowVisualization';
import {
    getSystemFlowTemplatesFromDB,
    createSystemFlowTemplateAction,
    updateSystemFlowTemplateAction,
    deleteSystemFlowTemplateAction,
    duplicateSystemFlowTemplateAction,
    seedSystemFlowTemplatesToDB,
    getAdminFlowOverviewAction,
} from '@/actions/flow-engine-actions';
import type {
    SystemFlowTemplateRecord,
    FlowStage,
    FlowStageType,
    IntentSignal,
    FlowSettings,
} from '@/lib/types-flow-engine';
import {
    Loader2,
    ArrowLeft,
    Plus,
    Save,
    Trash2,
    Copy,
    ChevronDown,
    ChevronRight,
    Sparkles,
    X,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STAGE_TYPES: FlowStageType[] = [
    'greeting', 'discovery', 'showcase', 'comparison',
    'social_proof', 'conversion', 'objection', 'handoff', 'followup',
];

const INTENT_OPTIONS: IntentSignal[] = [
    'browsing', 'comparing', 'pricing', 'booking', 'inquiry',
    'complaint', 'returning', 'urgent', 'location', 'contact', 'promo', 'schedule',
];

const DEFAULT_SETTINGS: FlowSettings = {
    handoffThreshold: 15,
    maxTurnsBeforeHandoff: 12,
    enableLeadCapture: true,
    leadCaptureFields: ['name', 'phone', 'email'],
    showTestimonials: true,
    showPromos: true,
    leadCaptureAfterTurn: 3,
    fallbackBehavior: 'quick_actions',
};

const STATUS_COLORS: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    draft: 'bg-gray-100 text-gray-600',
    archived: 'bg-red-100 text-red-700',
};

function makeEmptyStage(index: number): FlowStage {
    return {
        id: `stage_${Date.now()}_${index}`,
        type: 'greeting',
        label: 'New Stage',
        blockTypes: ['greeting'],
        intentTriggers: ['browsing'],
        leadScoreImpact: 1,
        isEntry: index === 0,
    };
}

// ---------------------------------------------------------------------------
// Template Card
// ---------------------------------------------------------------------------

function TemplateCard({
    template,
    onUpdate,
    onDelete,
    onDuplicate,
}: {
    template: SystemFlowTemplateRecord;
    onUpdate: (id: string, updated: SystemFlowTemplateRecord) => void;
    onDelete: (id: string) => void;
    onDuplicate: (newTemplate: SystemFlowTemplateRecord) => void;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [draft, setDraft] = useState<SystemFlowTemplateRecord>(template);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [duplicating, setDuplicating] = useState(false);

    const updateDraft = <K extends keyof SystemFlowTemplateRecord>(
        key: K,
        value: SystemFlowTemplateRecord[K]
    ) => {
        setDraft((prev) => ({ ...prev, [key]: value }));
    };

    const updateStage = (index: number, updates: Partial<FlowStage>) => {
        const stages = [...draft.stages];
        stages[index] = { ...stages[index], ...updates };
        updateDraft('stages', stages);
    };

    const removeStage = (index: number) => {
        if (draft.stages.length <= 1) return;
        updateDraft('stages', draft.stages.filter((_, i) => i !== index));
    };

    const addStage = () => {
        updateDraft('stages', [...draft.stages, makeEmptyStage(draft.stages.length)]);
    };

    const updateSettings = (updates: Partial<FlowSettings>) => {
        updateDraft('settings', { ...draft.settings, ...updates });
    };

    const handleSave = async () => {
        setSaving(true);
        const result = await updateSystemFlowTemplateAction(
            template.id,
            {
                name: draft.name,
                description: draft.description,
                industryId: draft.industryId,
                functionId: draft.functionId,
                industryName: draft.industryName,
                functionName: draft.functionName,
                status: draft.status,
                stages: draft.stages,
                transitions: draft.transitions,
                settings: draft.settings,
            },
            'admin'
        );
        if (result.success) {
            toast.success('Template saved');
            onUpdate(template.id, { ...draft, updatedAt: new Date().toISOString() });
        } else {
            toast.error(result.error || 'Failed to save');
        }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!window.confirm(`Delete template "${template.name}"? This cannot be undone.`)) return;
        setDeleting(true);
        const result = await deleteSystemFlowTemplateAction(template.id);
        if (result.success) {
            toast.success('Template deleted');
            onDelete(template.id);
        } else {
            toast.error(result.error || 'Failed to delete');
        }
        setDeleting(false);
    };

    const handleDuplicate = async () => {
        setDuplicating(true);
        const result = await duplicateSystemFlowTemplateAction(template.id, 'admin');
        if (result.success && result.templateId) {
            toast.success('Template duplicated');
            onDuplicate({
                ...template,
                id: result.templateId,
                name: `${template.name} (Copy)`,
                status: 'draft',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'admin',
            });
        } else {
            toast.error(result.error || 'Failed to duplicate');
        }
        setDuplicating(false);
    };

    return (
        <Card className="border border-[#e5e5e5]">
            <button
                type="button"
                className="w-full text-left px-5 py-4 flex items-center gap-3"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className="font-medium truncate">{template.name}</span>
                <Badge variant="secondary" className="text-xs shrink-0">
                    {template.functionId}
                </Badge>
                <Badge variant="outline" className="text-xs shrink-0">
                    {template.industryId}
                </Badge>
                <span className="text-xs text-muted-foreground shrink-0">
                    {template.stages.length} stages
                </span>
                <div className="hidden md:flex shrink-0">
                    <FlowVisualization stages={template.stages} compact />
                </div>
                <span className="ml-auto shrink-0">
                    <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                            STATUS_COLORS[template.status] || STATUS_COLORS.draft
                        }`}
                    >
                        {template.status}
                    </span>
                </span>
            </button>

            {isOpen && (
                <CardContent className="pt-0 pb-5 px-5">
                    <Separator className="mb-4" />
                    <div className="grid gap-6 lg:grid-cols-[1fr,auto]">
                        {/* Left: Editable form */}
                        <div className="space-y-5">
                            {/* Basic fields */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label className="text-xs">Name</Label>
                                    <Input
                                        value={draft.name}
                                        onChange={(e) => updateDraft('name', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Status</Label>
                                    <Select
                                        value={draft.status}
                                        onValueChange={(val) =>
                                            updateDraft('status', val as 'active' | 'draft' | 'archived')
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="archived">Archived</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div>
                                <Label className="text-xs">Description</Label>
                                <Textarea
                                    value={draft.description}
                                    onChange={(e) => updateDraft('description', e.target.value)}
                                    rows={2}
                                />
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label className="text-xs">Industry ID</Label>
                                    <Input
                                        value={draft.industryId}
                                        onChange={(e) => updateDraft('industryId', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Function ID</Label>
                                    <Input
                                        value={draft.functionId}
                                        onChange={(e) => updateDraft('functionId', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label className="text-xs">Industry Name</Label>
                                    <Input
                                        value={draft.industryName}
                                        onChange={(e) => updateDraft('industryName', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Function Name</Label>
                                    <Input
                                        value={draft.functionName}
                                        onChange={(e) => updateDraft('functionName', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Stages Editor */}
                            <Separator />
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <Label className="text-sm font-medium">
                                        Stages ({draft.stages.length})
                                    </Label>
                                    <Button variant="outline" size="sm" onClick={addStage}>
                                        <Plus className="h-3 w-3 mr-1" /> Add Stage
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {draft.stages.map((stage, i) => (
                                        <div
                                            key={stage.id}
                                            className="border rounded-lg p-3 space-y-2 relative"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-muted-foreground">
                                                    Stage {i + 1}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => removeStage(i)}
                                                    disabled={draft.stages.length <= 1}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <div className="grid gap-2 md:grid-cols-2">
                                                <div>
                                                    <Label className="text-xs">Type</Label>
                                                    <Select
                                                        value={stage.type}
                                                        onValueChange={(val) =>
                                                            updateStage(i, { type: val as FlowStageType })
                                                        }
                                                    >
                                                        <SelectTrigger className="h-8 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {STAGE_TYPES.map((st) => (
                                                                <SelectItem key={st} value={st}>
                                                                    {st}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Label</Label>
                                                    <Input
                                                        className="h-8 text-xs"
                                                        value={stage.label}
                                                        onChange={(e) =>
                                                            updateStage(i, { label: e.target.value })
                                                        }
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid gap-2 md:grid-cols-3">
                                                <div>
                                                    <Label className="text-xs">Block Types</Label>
                                                    <Input
                                                        className="h-8 text-xs"
                                                        value={stage.blockTypes.join(', ')}
                                                        onChange={(e) =>
                                                            updateStage(i, {
                                                                blockTypes: e.target.value
                                                                    .split(',')
                                                                    .map((s) => s.trim())
                                                                    .filter(Boolean),
                                                            })
                                                        }
                                                        placeholder="greeting, welcome"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Intent Triggers</Label>
                                                    <Input
                                                        className="h-8 text-xs"
                                                        value={stage.intentTriggers.join(', ')}
                                                        onChange={(e) =>
                                                            updateStage(i, {
                                                                intentTriggers: e.target.value
                                                                    .split(',')
                                                                    .map((s) => s.trim())
                                                                    .filter(Boolean) as IntentSignal[],
                                                            })
                                                        }
                                                        placeholder="browsing, inquiry"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Lead Score Impact</Label>
                                                    <Input
                                                        className="h-8 text-xs"
                                                        type="number"
                                                        value={stage.leadScoreImpact}
                                                        onChange={(e) =>
                                                            updateStage(i, {
                                                                leadScoreImpact: Number(e.target.value),
                                                            })
                                                        }
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <label className="flex items-center gap-1.5 text-xs">
                                                    <Switch
                                                        checked={stage.isEntry || false}
                                                        onCheckedChange={(val) =>
                                                            updateStage(i, { isEntry: val })
                                                        }
                                                    />
                                                    Entry
                                                </label>
                                                <label className="flex items-center gap-1.5 text-xs">
                                                    <Switch
                                                        checked={stage.isExit || false}
                                                        onCheckedChange={(val) =>
                                                            updateStage(i, { isExit: val })
                                                        }
                                                    />
                                                    Exit
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Settings Panel */}
                            <Separator />
                            <div>
                                <Label className="text-sm font-medium mb-3 block">Settings</Label>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <Label className="text-xs">Handoff Threshold</Label>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={30}
                                            value={draft.settings.handoffThreshold}
                                            onChange={(e) =>
                                                updateSettings({ handoffThreshold: Number(e.target.value) })
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Max Turns Before Handoff</Label>
                                        <Input
                                            type="number"
                                            min={5}
                                            max={20}
                                            value={draft.settings.maxTurnsBeforeHandoff}
                                            onChange={(e) =>
                                                updateSettings({
                                                    maxTurnsBeforeHandoff: Number(e.target.value),
                                                })
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Lead Capture After Turn</Label>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={10}
                                            value={draft.settings.leadCaptureAfterTurn}
                                            onChange={(e) =>
                                                updateSettings({
                                                    leadCaptureAfterTurn: Number(e.target.value),
                                                })
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Fallback Behavior</Label>
                                        <Select
                                            value={draft.settings.fallbackBehavior}
                                            onValueChange={(val) =>
                                                updateSettings({
                                                    fallbackBehavior: val as 'text' | 'quick_actions' | 'handoff',
                                                })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="text">Text</SelectItem>
                                                <SelectItem value="quick_actions">Quick Actions</SelectItem>
                                                <SelectItem value="handoff">Handoff</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid gap-4 md:grid-cols-3 mt-4">
                                    <label className="flex items-center gap-2 text-sm">
                                        <Switch
                                            checked={draft.settings.enableLeadCapture}
                                            onCheckedChange={(val) =>
                                                updateSettings({ enableLeadCapture: val })
                                            }
                                        />
                                        Lead Capture
                                    </label>
                                    <label className="flex items-center gap-2 text-sm">
                                        <Switch
                                            checked={draft.settings.showTestimonials}
                                            onCheckedChange={(val) =>
                                                updateSettings({ showTestimonials: val })
                                            }
                                        />
                                        Testimonials
                                    </label>
                                    <label className="flex items-center gap-2 text-sm">
                                        <Switch
                                            checked={draft.settings.showPromos}
                                            onCheckedChange={(val) =>
                                                updateSettings({ showPromos: val })
                                            }
                                        />
                                        Promos
                                    </label>
                                </div>
                                {draft.settings.enableLeadCapture && (
                                    <div className="mt-3">
                                        <Label className="text-xs">Lead Capture Fields</Label>
                                        <div className="flex items-center gap-4 mt-1">
                                            {['name', 'phone', 'email'].map((field) => (
                                                <label
                                                    key={field}
                                                    className="flex items-center gap-1.5 text-sm"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={draft.settings.leadCaptureFields.includes(field)}
                                                        onChange={(e) => {
                                                            const fields = e.target.checked
                                                                ? [...draft.settings.leadCaptureFields, field]
                                                                : draft.settings.leadCaptureFields.filter(
                                                                      (f) => f !== field
                                                                  );
                                                            updateSettings({ leadCaptureFields: fields });
                                                        }}
                                                    />
                                                    {field}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action buttons */}
                            <Separator />
                            <div className="flex items-center gap-2">
                                <Button onClick={handleSave} disabled={saving} size="sm">
                                    {saving ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="mr-2 h-4 w-4" />
                                    )}
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDuplicate}
                                    disabled={duplicating}
                                >
                                    {duplicating ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Copy className="mr-2 h-4 w-4" />
                                    )}
                                    Duplicate
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                >
                                    {deleting ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="mr-2 h-4 w-4" />
                                    )}
                                    {deleting ? 'Deleting...' : 'Delete'}
                                </Button>
                            </div>
                        </div>

                        {/* Right: Live preview */}
                        <div className="lg:w-64 space-y-3">
                            <Label className="text-xs text-muted-foreground">Live Preview</Label>
                            <FlowVisualization stages={draft.stages} />
                        </div>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}

// ---------------------------------------------------------------------------
// Create Dialog
// ---------------------------------------------------------------------------

function CreateTemplateDialog({
    open,
    onOpenChange,
    onCreate,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreate: (template: SystemFlowTemplateRecord) => void;
}) {
    const [name, setName] = useState('');
    const [industryId, setIndustryId] = useState('');
    const [functionId, setFunctionId] = useState('');
    const [industryName, setIndustryName] = useState('');
    const [functionName, setFunctionName] = useState('');
    const [description, setDescription] = useState('');
    const [creating, setCreating] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) {
            toast.error('Template name is required');
            return;
        }
        setCreating(true);
        const result = await createSystemFlowTemplateAction(
            {
                name: name.trim(),
                industryId: industryId.trim(),
                functionId: functionId.trim(),
                industryName: industryName.trim(),
                functionName: functionName.trim(),
                description: description.trim(),
                stages: [makeEmptyStage(0)],
                transitions: [],
                settings: { ...DEFAULT_SETTINGS },
                status: 'active',
            },
            'admin'
        );
        if (result.success && result.templateId) {
            toast.success('Template created');
            onCreate({
                id: result.templateId,
                name: name.trim(),
                industryId: industryId.trim(),
                functionId: functionId.trim(),
                industryName: industryName.trim(),
                functionName: functionName.trim(),
                description: description.trim(),
                stages: [makeEmptyStage(0)],
                transitions: [],
                settings: { ...DEFAULT_SETTINGS },
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'admin',
            });
            onOpenChange(false);
            setName('');
            setIndustryId('');
            setFunctionId('');
            setIndustryName('');
            setFunctionName('');
            setDescription('');
        } else {
            toast.error(result.error || 'Failed to create template');
        }
        setCreating(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Flow Template</DialogTitle>
                    <DialogDescription>
                        Create a new system flow template. You can add stages and configure settings after creation.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div>
                        <Label>Template Name</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Boutique Hotel Flow"
                        />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <Label>Industry ID</Label>
                            <Input
                                value={industryId}
                                onChange={(e) => setIndustryId(e.target.value)}
                                placeholder="e.g. hospitality"
                            />
                        </div>
                        <div>
                            <Label>Function ID</Label>
                            <Input
                                value={functionId}
                                onChange={(e) => setFunctionId(e.target.value)}
                                placeholder="e.g. hotels_resorts"
                            />
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <Label>Industry Name</Label>
                            <Input
                                value={industryName}
                                onChange={(e) => setIndustryName(e.target.value)}
                                placeholder="e.g. Hospitality"
                            />
                        </div>
                        <div>
                            <Label>Function Name</Label>
                            <Input
                                value={functionName}
                                onChange={(e) => setFunctionName(e.target.value)}
                                placeholder="e.g. Hotels & Resorts"
                            />
                        </div>
                    </div>
                    <div>
                        <Label>Description</Label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of this flow template..."
                            rows={2}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={creating}>
                        {creating ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Plus className="mr-2 h-4 w-4" />
                        )}
                        {creating ? 'Creating...' : 'Create Template'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AdminFlowsPage() {
    const [templates, setTemplates] = useState<SystemFlowTemplateRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);

    const loadTemplates = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getSystemFlowTemplatesFromDB();
            if (result.success) {
                setTemplates(result.templates);
            } else {
                toast.error(result.error || 'Failed to load templates');
            }
        } catch (e) {
            console.error('Failed to load templates:', e);
            toast.error('Failed to load templates');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTemplates();
    }, [loadTemplates]);

    const handleSeed = async () => {
        setSeeding(true);
        try {
            const result = await seedSystemFlowTemplatesToDB('admin');
            if (result.success) {
                toast.success(`Seeded ${result.seeded} template(s), skipped ${result.skipped}`);
                loadTemplates();
            } else {
                toast.error(result.error || 'Seed failed');
            }
        } catch {
            toast.error('Seed failed');
        } finally {
            setSeeding(false);
        }
    };

    const handleUpdate = useCallback((id: string, updated: SystemFlowTemplateRecord) => {
        setTemplates((prev) => prev.map((t) => (t.id === id ? updated : t)));
    }, []);

    const handleDelete = useCallback((id: string) => {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const handleDuplicate = useCallback((newTemplate: SystemFlowTemplateRecord) => {
        setTemplates((prev) => [newTemplate, ...prev]);
    }, []);

    const handleCreate = useCallback((newTemplate: SystemFlowTemplateRecord) => {
        setTemplates((prev) => [newTemplate, ...prev]);
    }, []);

    // Stats
    const activeCount = templates.filter((t) => t.status === 'active').length;
    const draftCount = templates.filter((t) => t.status === 'draft').length;
    const archivedCount = templates.filter((t) => t.status === 'archived').length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-6">
            {/* Header */}
            <div className="mb-6">
                <Link
                    href="/admin/relay"
                    className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4"
                >
                    <ArrowLeft className="h-3 w-3" /> Back to Relay
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Flow Templates</h1>
                        <p className="text-muted-foreground">
                            Manage system flow templates used by partner AI assistants
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSeed}
                            disabled={seeding}
                        >
                            {seeding ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="mr-2 h-4 w-4" />
                            )}
                            Seed from Code
                        </Button>
                        <Button size="sm" onClick={() => setCreateOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Template
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats bar */}
            {templates.length > 0 && (
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
                        <span className="text-lg font-bold">{templates.length}</span>
                        <span className="text-xs text-muted-foreground">Total</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50">
                        <span className="text-lg font-bold text-green-700">{activeCount}</span>
                        <span className="text-xs text-green-600">Active</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
                        <span className="text-lg font-bold text-gray-600">{draftCount}</span>
                        <span className="text-xs text-gray-500">Draft</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50">
                        <span className="text-lg font-bold text-red-700">{archivedCount}</span>
                        <span className="text-xs text-red-600">Archived</span>
                    </div>
                </div>
            )}

            {/* Template list or empty state */}
            {templates.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                        <h2 className="text-xl font-semibold mb-2">No Flow Templates Yet</h2>
                        <p className="text-muted-foreground mb-6 max-w-md">
                            Seed the 8 built-in templates from code, or create a new one from scratch.
                        </p>
                        <div className="flex items-center gap-2">
                            <Button onClick={handleSeed} disabled={seeding}>
                                {seeding ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Sparkles className="mr-2 h-4 w-4" />
                                )}
                                Seed from Code
                            </Button>
                            <Button variant="outline" onClick={() => setCreateOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Template
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {templates.map((tpl) => (
                        <TemplateCard
                            key={tpl.id}
                            template={tpl}
                            onUpdate={handleUpdate}
                            onDelete={handleDelete}
                            onDuplicate={handleDuplicate}
                        />
                    ))}
                </div>
            )}

            {/* Create dialog */}
            <CreateTemplateDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                onCreate={handleCreate}
            />
        </div>
    );
}
