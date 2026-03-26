'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
    getPartnerFlowAction,
    savePartnerFlowAction,
    deletePartnerFlowAction,
    getFlowTemplatesAction,
    getFlowAnalyticsAction,
} from '@/actions/flow-engine-actions';
import { getFlowTemplateForFunction } from '@/lib/flow-templates';
import FlowVisualization from '@/components/partner/relay/FlowVisualization';
import type {
    FlowStage,
    FlowDefinition,
    FlowStageType,
    IntentSignal,
    FlowSettings,
    SystemFlowTemplate,
} from '@/lib/types-flow-engine';
import { Loader2, Save, Trash2, ArrowLeft, Plus, X } from 'lucide-react';

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

interface EditingFlow {
    name: string;
    industryId: string;
    functionId: string;
    stages: FlowStage[];
    settings: FlowSettings;
    status: 'active' | 'draft';
}

export default function PartnerFlowsPage() {
    const { currentWorkspace, user, loading: authLoading } = useMultiWorkspaceAuth();
    const partnerId = currentWorkspace?.partnerId;
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [partnerFlow, setPartnerFlow] = useState<FlowDefinition | null>(null);
    const [systemDefault, setSystemDefault] = useState<SystemFlowTemplate | null>(null);
    const [analytics, setAnalytics] = useState<{
        totalConversations: number;
        avgLeadScore: number;
        conversionRate: number;
        handoffRate: number;
    } | null>(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);
    const [editorOpen, setEditorOpen] = useState(false);
    const [editingFlow, setEditingFlow] = useState<EditingFlow | null>(null);
    const [templates, setTemplates] = useState<SystemFlowTemplate[]>([]);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const loadData = useCallback(async () => {
        if (!partnerId) return;
        setLoading(true);
        try {
            const [flowResult, tplResult] = await Promise.all([
                getPartnerFlowAction(partnerId),
                getFlowTemplatesAction(''),
            ]);

            if (flowResult.success && flowResult.flow) {
                setPartnerFlow(flowResult.flow);
            } else {
                setPartnerFlow(null);
                // Try to find system default
                const functionId =
                    currentWorkspace?.partnerId ? 'general' : 'general';
                const tpl = getFlowTemplateForFunction(functionId);
                setSystemDefault(tpl);
            }

            if (tplResult.success) setTemplates(tplResult.templates);
        } catch (e) {
            console.error('Failed to load flow data:', e);
        } finally {
            setLoading(false);
        }
    }, [partnerId, currentWorkspace]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (!partnerId) return;
        setAnalyticsLoading(true);
        getFlowAnalyticsAction(partnerId)
            .then((result) => {
                if (result.success && result.analytics) {
                    setAnalytics({
                        totalConversations: result.analytics.totalConversations,
                        avgLeadScore: result.analytics.avgLeadScore,
                        conversionRate: result.analytics.conversionRate,
                        handoffRate: result.analytics.handoffRate,
                    });
                }
            })
            .catch(() => {})
            .finally(() => setAnalyticsLoading(false));
    }, [partnerId]);

    const handleEditFlow = () => {
        if (partnerFlow) {
            setEditingFlow({
                name: partnerFlow.name,
                industryId: partnerFlow.industryId,
                functionId: partnerFlow.functionId,
                stages: [...partnerFlow.stages],
                settings: { ...partnerFlow.settings },
                status: partnerFlow.status,
            });
        } else {
            setEditingFlow({
                name: 'My Custom Flow',
                industryId: '',
                functionId: '',
                stages: [makeEmptyStage(0)],
                settings: { ...DEFAULT_SETTINGS },
                status: 'draft',
            });
        }
        setEditorOpen(true);
    };

    const handleTemplateSelect = (templateId: string) => {
        if (templateId === 'scratch') {
            setEditingFlow({
                name: 'My Custom Flow',
                industryId: '',
                functionId: '',
                stages: [makeEmptyStage(0)],
                settings: { ...DEFAULT_SETTINGS },
                status: 'draft',
            });
            return;
        }
        const tpl = templates.find((t) => t.id === templateId);
        if (!tpl) return;
        setEditingFlow({
            name: tpl.name,
            industryId: tpl.industryId,
            functionId: tpl.functionId,
            stages: tpl.stages.map((s) => ({ ...s })),
            settings: { ...tpl.settings },
            status: 'draft',
        });
    };

    const handleSave = async () => {
        if (!partnerId || !editingFlow || !user) return;
        setSaving(true);
        try {
            const flowData = {
                name: editingFlow.name,
                partnerId,
                industryId: editingFlow.industryId,
                functionId: editingFlow.functionId,
                stages: editingFlow.stages,
                transitions: buildTransitions(editingFlow.stages),
                settings: editingFlow.settings,
                status: editingFlow.status,
                sourceTemplateId: undefined,
            };
            const result = await savePartnerFlowAction(partnerId, flowData, user.uid);
            if (result.success) {
                toast({ title: 'Flow saved', description: 'Your conversation flow has been saved.' });
                setEditorOpen(false);
                loadData();
            } else {
                toast({ title: 'Save failed', description: result.error || 'Unknown error', variant: 'destructive' });
            }
        } catch (e) {
            toast({ title: 'Save failed', description: 'An unexpected error occurred.', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!partnerId) return;
        if (!window.confirm('Reset to system default? Your custom flow will be deleted.')) return;
        setDeleting(true);
        try {
            const result = await deletePartnerFlowAction(partnerId);
            if (result.success) {
                toast({ title: 'Flow reset', description: 'Reverted to system defaults.' });
                setPartnerFlow(null);
                setEditorOpen(false);
                loadData();
            } else {
                toast({ title: 'Delete failed', description: result.error || 'Unknown error', variant: 'destructive' });
            }
        } catch {
            toast({ title: 'Delete failed', description: 'An unexpected error occurred.', variant: 'destructive' });
        } finally {
            setDeleting(false);
        }
    };

    const updateStage = (index: number, updates: Partial<FlowStage>) => {
        if (!editingFlow) return;
        const stages = [...editingFlow.stages];
        stages[index] = { ...stages[index], ...updates };
        setEditingFlow({ ...editingFlow, stages });
    };

    const removeStage = (index: number) => {
        if (!editingFlow || editingFlow.stages.length <= 1) return;
        const stages = editingFlow.stages.filter((_, i) => i !== index);
        setEditingFlow({ ...editingFlow, stages });
    };

    const addStage = () => {
        if (!editingFlow) return;
        setEditingFlow({
            ...editingFlow,
            stages: [...editingFlow.stages, makeEmptyStage(editingFlow.stages.length)],
        });
    };

    const updateSettings = (updates: Partial<FlowSettings>) => {
        if (!editingFlow) return;
        setEditingFlow({
            ...editingFlow,
            settings: { ...editingFlow.settings, ...updates },
        });
    };

    // Loading / auth guards
    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!partnerId) {
        return (
            <div className="container mx-auto py-16 text-center">
                <p className="text-muted-foreground">No workspace selected.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-6 max-w-4xl">
            <Link
                href="/partner/relay"
                className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4"
            >
                <ArrowLeft className="h-3 w-3" /> Back to Relay
            </Link>
            <h1 className="text-2xl font-bold mb-1">Conversation Flows</h1>
            <p className="text-muted-foreground mb-6">
                Configure how your AI assistant guides visitors through the sales journey
            </p>

            {/* Section A: Active Flow Overview */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-base">Active Flow</CardTitle>
                </CardHeader>
                <CardContent>
                    {partnerFlow ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="font-medium">{partnerFlow.name}</span>
                                <Badge variant={partnerFlow.status === 'active' ? 'success' : 'secondary'}>
                                    {partnerFlow.status}
                                </Badge>
                            </div>
                            <FlowVisualization stages={partnerFlow.stages} />
                            <div className="flex items-center gap-2 pt-2">
                                <Button size="sm" onClick={handleEditFlow}>
                                    Edit Flow
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                >
                                    {deleting ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                    ) : (
                                        <Trash2 className="h-4 w-4 mr-1" />
                                    )}
                                    Reset to Default
                                </Button>
                            </div>
                        </div>
                    ) : systemDefault ? (
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                Using system default: <span className="font-medium text-foreground">{systemDefault.name}</span>
                            </p>
                            <FlowVisualization stages={systemDefault.stages} compact />
                            <Button size="sm" variant="outline" onClick={handleEditFlow}>
                                Customize Flow
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                Using smart defaults (intent-only mode). The AI adapts to visitor
                                intent without a predefined flow structure.
                            </p>
                            <Button size="sm" variant="outline" onClick={handleEditFlow}>
                                Create Custom Flow
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold">
                            {analyticsLoading ? '...' : analytics?.totalConversations ?? '—'}
                        </div>
                        <div className="text-xs text-muted-foreground">Conversations</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold">
                            {analyticsLoading ? '...' : analytics?.avgLeadScore?.toFixed(1) ?? '—'}
                        </div>
                        <div className="text-xs text-muted-foreground">Avg Lead Score</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold">
                            {analyticsLoading
                                ? '...'
                                : analytics
                                    ? `${Math.round(analytics.conversionRate * 100)}%`
                                    : '—'}
                        </div>
                        <div className="text-xs text-muted-foreground">Conversion Rate</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold">
                            {analyticsLoading
                                ? '...'
                                : analytics
                                    ? `${Math.round(analytics.handoffRate * 100)}%`
                                    : '—'}
                        </div>
                        <div className="text-xs text-muted-foreground">Handoff Rate</div>
                    </CardContent>
                </Card>
            </div>

            {/* Section B: Flow Editor */}
            {editorOpen && editingFlow && (
                <div className="space-y-6">
                    {/* Template Selector */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Flow Editor</CardTitle>
                            <CardDescription>
                                Start from a template or build from scratch
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label>Flow Name</Label>
                                    <Input
                                        value={editingFlow.name}
                                        onChange={(e) =>
                                            setEditingFlow({ ...editingFlow, name: e.target.value })
                                        }
                                        placeholder="My Custom Flow"
                                    />
                                </div>
                                <div>
                                    <Label>Start from Template</Label>
                                    <Select onValueChange={handleTemplateSelect}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose a template..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="scratch">
                                                Start from Scratch
                                            </SelectItem>
                                            {templates.map((tpl) => (
                                                <SelectItem key={tpl.id} value={tpl.id}>
                                                    {tpl.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stage List */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Stages ({editingFlow.stages.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {editingFlow.stages.map((stage, i) => (
                                <div
                                    key={stage.id}
                                    className="border rounded-lg p-4 space-y-3 relative"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-muted-foreground">
                                            Stage {i + 1}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => removeStage(i)}
                                            disabled={editingFlow.stages.length <= 1}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div>
                                            <Label className="text-xs">Stage Type</Label>
                                            <Select
                                                value={stage.type}
                                                onValueChange={(val) =>
                                                    updateStage(i, {
                                                        type: val as FlowStageType,
                                                    })
                                                }
                                            >
                                                <SelectTrigger>
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
                                                value={stage.label}
                                                onChange={(e) =>
                                                    updateStage(i, { label: e.target.value })
                                                }
                                                placeholder="Stage label"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">
                                                Block Types (comma-separated)
                                            </Label>
                                            <Input
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
                                            <Label className="text-xs">
                                                Intent Triggers (comma-separated)
                                            </Label>
                                            <Input
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
                                                type="number"
                                                value={stage.leadScoreImpact}
                                                onChange={(e) =>
                                                    updateStage(i, {
                                                        leadScoreImpact: parseInt(e.target.value) || 0,
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={addStage}
                                className="w-full"
                            >
                                <Plus className="h-4 w-4 mr-1" /> Add Stage
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label className="text-xs">Handoff Threshold</Label>
                                    <Input
                                        type="number"
                                        value={editingFlow.settings.handoffThreshold}
                                        onChange={(e) =>
                                            updateSettings({
                                                handoffThreshold: parseInt(e.target.value) || 15,
                                            })
                                        }
                                        min={1}
                                        max={30}
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Max Turns Before Handoff</Label>
                                    <Input
                                        type="number"
                                        value={editingFlow.settings.maxTurnsBeforeHandoff}
                                        onChange={(e) =>
                                            updateSettings({
                                                maxTurnsBeforeHandoff:
                                                    parseInt(e.target.value) || 12,
                                            })
                                        }
                                        min={5}
                                        max={20}
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Lead Capture After Turn</Label>
                                    <Input
                                        type="number"
                                        value={editingFlow.settings.leadCaptureAfterTurn}
                                        onChange={(e) =>
                                            updateSettings({
                                                leadCaptureAfterTurn:
                                                    parseInt(e.target.value) || 3,
                                            })
                                        }
                                        min={1}
                                        max={10}
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Fallback Behavior</Label>
                                    <Select
                                        value={editingFlow.settings.fallbackBehavior}
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
                                            <SelectItem value="quick_actions">
                                                Quick Actions
                                            </SelectItem>
                                            <SelectItem value="handoff">Handoff</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm">Enable Lead Capture</Label>
                                    <Switch
                                        checked={editingFlow.settings.enableLeadCapture}
                                        onCheckedChange={(checked) =>
                                            updateSettings({ enableLeadCapture: checked })
                                        }
                                    />
                                </div>
                                {editingFlow.settings.enableLeadCapture && (
                                    <div className="flex items-center gap-4 pl-4">
                                        {['name', 'phone', 'email'].map((field) => (
                                            <label
                                                key={field}
                                                className="flex items-center gap-1.5 text-sm"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={editingFlow.settings.leadCaptureFields.includes(
                                                        field
                                                    )}
                                                    onChange={(e) => {
                                                        const fields = e.target.checked
                                                            ? [
                                                                  ...editingFlow.settings
                                                                      .leadCaptureFields,
                                                                  field,
                                                              ]
                                                            : editingFlow.settings.leadCaptureFields.filter(
                                                                  (f) => f !== field
                                                              );
                                                        updateSettings({
                                                            leadCaptureFields: fields,
                                                        });
                                                    }}
                                                    className="rounded border-gray-300"
                                                />
                                                {field}
                                            </label>
                                        ))}
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm">Show Testimonials</Label>
                                    <Switch
                                        checked={editingFlow.settings.showTestimonials}
                                        onCheckedChange={(checked) =>
                                            updateSettings({ showTestimonials: checked })
                                        }
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm">Show Promos</Label>
                                    <Switch
                                        checked={editingFlow.settings.showPromos}
                                        onCheckedChange={(checked) =>
                                            updateSettings({ showPromos: checked })
                                        }
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Save / Cancel */}
                    <div className="flex items-center gap-2">
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                                <Save className="h-4 w-4 mr-1" />
                            )}
                            Save Flow
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setEditorOpen(false);
                                setEditingFlow(null);
                            }}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Auto-generate transitions from stages based on intent triggers.
 * Creates transitions from each stage to subsequent stages based on their intent triggers.
 */
function buildTransitions(stages: FlowStage[]) {
    const transitions: Array<{ from: string; to: string; trigger: IntentSignal; priority?: number }> = [];

    for (let i = 0; i < stages.length; i++) {
        for (let j = 0; j < stages.length; j++) {
            if (i === j) continue;
            for (const trigger of stages[j].intentTriggers) {
                // Don't duplicate
                if (transitions.some((t) => t.from === stages[i].id && t.to === stages[j].id && t.trigger === trigger)) {
                    continue;
                }
                transitions.push({
                    from: stages[i].id,
                    to: stages[j].id,
                    trigger,
                    priority: stages[j].type === 'conversion' ? 1 : 0,
                });
            }
        }
    }

    return transitions;
}
