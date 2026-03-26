'use client';

import { useState, useEffect, useCallback } from 'react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import {
    getPartnerFlowAction,
    savePartnerFlowAction,
    deletePartnerFlowAction,
    getFlowTemplatesAction,
    getAllFlowTemplatesAction,
} from '@/actions/flow-engine-actions';
import type {
    FlowDefinition,
    FlowStage,
    FlowTransition,
    FlowSettings,
    FlowStageType,
    IntentSignal,
    SystemFlowTemplate,
} from '@/lib/types-flow-engine';
import FlowStageCard from './FlowStageCard';
import FlowVisualization from './FlowVisualization';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';
import {
    Loader2,
    Save,
    Check,
    Plus,
    Trash2,
    RotateCcw,
    GitBranch,
    Zap,
} from 'lucide-react';

const DEFAULT_SETTINGS: FlowSettings = {
    handoffThreshold: 10,
    maxTurnsBeforeHandoff: 15,
    enableLeadCapture: true,
    leadCaptureFields: ['name', 'phone', 'email'],
    enablePromos: false,
    enableTestimonials: false,
    testimonialTriggerAfter: 5,
    fallbackBehavior: 'text',
};

export default function FlowEditor() {
    const { currentWorkspace, loading: authLoading } = useMultiWorkspaceAuth();
    const partnerId = currentWorkspace?.partnerId;

    const [flow, setFlow] = useState<FlowDefinition | null>(null);
    const [templates, setTemplates] = useState<SystemFlowTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [dirty, setDirty] = useState(false);

    // Load partner flow + templates
    useEffect(() => {
        if (!partnerId) return;
        (async () => {
            try {
                const [flowResult, templatesResult] = await Promise.all([
                    getPartnerFlowAction(partnerId),
                    getAllFlowTemplatesAction(),
                ]);
                if (flowResult.success && flowResult.flow) {
                    setFlow(flowResult.flow);
                }
                if (templatesResult.success) {
                    setTemplates(templatesResult.templates);
                }
            } catch (e) {
                console.error('Failed to load flow data:', e);
            } finally {
                setLoading(false);
            }
        })();
    }, [partnerId]);

    const handleSave = async () => {
        if (!partnerId || !flow) return;
        setSaving(true);
        try {
            const result = await savePartnerFlowAction(partnerId, {
                name: flow.name,
                description: flow.description,
                industryId: flow.industryId,
                functionId: flow.functionId,
                stages: flow.stages,
                transitions: flow.transitions,
                settings: flow.settings,
                status: flow.status,
                isSystem: false,
            });
            if (result.success) {
                setSaved(true);
                setDirty(false);
                setTimeout(() => setSaved(false), 2000);
            }
        } catch (e) {
            console.error('Failed to save flow:', e);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!partnerId) return;
        if (!confirm('Delete your custom flow? The system template will be used instead.')) return;
        try {
            await deletePartnerFlowAction(partnerId);
            setFlow(null);
            setDirty(false);
        } catch (e) {
            console.error('Failed to delete flow:', e);
        }
    };

    const applyTemplate = (template: SystemFlowTemplate) => {
        const newFlow: FlowDefinition = {
            id: `flow_${partnerId}`,
            name: template.name,
            description: template.description,
            industryId: template.industryId,
            functionId: template.functionId,
            stages: template.stages.map(s => ({ ...s })),
            transitions: template.transitions.map(t => ({ ...t })),
            settings: { ...template.settings },
            status: 'active',
            isSystem: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: partnerId || 'partner',
        };
        setFlow(newFlow);
        setDirty(true);
    };

    const createBlankFlow = () => {
        const entryId = `stage_${Date.now()}_greeting`;
        const newFlow: FlowDefinition = {
            id: `flow_${partnerId}`,
            name: 'Custom Flow',
            industryId: 'general',
            functionId: 'general',
            stages: [
                {
                    id: entryId,
                    type: 'greeting',
                    label: 'Welcome',
                    blockTypes: ['greeting', 'quick_actions'],
                    triggerIntents: [],
                    exitIntents: ['browsing', 'inquiry'],
                    isEntry: true,
                    leadScoreImpact: 1,
                },
            ],
            transitions: [],
            settings: { ...DEFAULT_SETTINGS },
            status: 'active',
            isSystem: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: partnerId || 'partner',
        };
        setFlow(newFlow);
        setDirty(true);
    };

    const addStage = () => {
        if (!flow) return;
        const id = `stage_${Date.now()}`;
        const newStage: FlowStage = {
            id,
            type: 'discovery',
            label: 'New Stage',
            blockTypes: ['catalog'],
            triggerIntents: [],
            exitIntents: [],
            leadScoreImpact: 2,
        };
        setFlow({ ...flow, stages: [...flow.stages, newStage] });
        setDirty(true);
    };

    const updateStage = (index: number, updated: FlowStage) => {
        if (!flow) return;
        const stages = [...flow.stages];
        stages[index] = updated;
        setFlow({ ...flow, stages });
        setDirty(true);
    };

    const deleteStage = (index: number) => {
        if (!flow) return;
        const stageId = flow.stages[index].id;
        const stages = flow.stages.filter((_, i) => i !== index);
        const transitions = flow.transitions.filter(
            t => t.fromStageId !== stageId && t.toStageId !== stageId
        );
        setFlow({ ...flow, stages, transitions });
        setDirty(true);
    };

    const addTransition = () => {
        if (!flow || flow.stages.length < 2) return;
        const newTransition: FlowTransition = {
            fromStageId: flow.stages[0].id,
            toStageId: flow.stages[1].id,
            condition: 'browsing',
            priority: 10,
        };
        setFlow({ ...flow, transitions: [...flow.transitions, newTransition] });
        setDirty(true);
    };

    const updateTransition = (index: number, updated: FlowTransition) => {
        if (!flow) return;
        const transitions = [...flow.transitions];
        transitions[index] = updated;
        setFlow({ ...flow, transitions });
        setDirty(true);
    };

    const deleteTransition = (index: number) => {
        if (!flow) return;
        setFlow({ ...flow, transitions: flow.transitions.filter((_, i) => i !== index) });
        setDirty(true);
    };

    const updateSettings = (partial: Partial<FlowSettings>) => {
        if (!flow) return;
        setFlow({ ...flow, settings: { ...flow.settings, ...partial } });
        setDirty(true);
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!partnerId) {
        return <div className="text-center py-16 text-muted-foreground">No workspace selected.</div>;
    }

    // No flow yet — show template picker
    if (!flow) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <GitBranch className="h-5 w-5" /> Conversation Flow
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        No custom flow configured. The system will auto-select a template based on your business type.
                        You can customize by starting from a template or creating a blank flow.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card
                        className="cursor-pointer border-dashed hover:border-primary transition-colors"
                        onClick={createBlankFlow}
                    >
                        <CardContent className="flex flex-col items-center justify-center py-8">
                            <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="font-medium text-sm">Blank Flow</p>
                            <p className="text-xs text-muted-foreground mt-1">Start from scratch</p>
                        </CardContent>
                    </Card>

                    {templates.map(t => (
                        <Card
                            key={t.id}
                            className="cursor-pointer hover:border-primary transition-colors"
                            onClick={() => applyTemplate(t)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                        <Zap className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium text-sm">{t.name}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                                        <div className="flex gap-1 mt-2 flex-wrap">
                                            {t.stages.map(s => (
                                                <Badge key={s.id} variant="secondary" className="text-[10px]">
                                                    {s.label}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    // Flow editor
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <GitBranch className="h-5 w-5" /> {flow.name}
                        {dirty && <Badge variant="outline" className="text-[10px] text-amber-600">Unsaved</Badge>}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {flow.stages.length} stages, {flow.transitions.length} transitions
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleDelete}>
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={saving || !dirty}>
                        {saving ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        ) : saved ? (
                            <Check className="h-3.5 w-3.5 mr-1" />
                        ) : (
                            <Save className="h-3.5 w-3.5 mr-1" />
                        )}
                        {saved ? 'Saved!' : 'Save Flow'}
                    </Button>
                </div>
            </div>

            {/* Flow name */}
            <div className="flex gap-3">
                <Input
                    value={flow.name}
                    onChange={e => { setFlow({ ...flow, name: e.target.value }); setDirty(true); }}
                    placeholder="Flow name"
                    className="max-w-xs"
                />
                <Select
                    value={flow.status}
                    onValueChange={v => { setFlow({ ...flow, status: v as 'draft' | 'active' | 'archived' }); setDirty(true); }}
                >
                    <SelectTrigger className="w-32">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Visual flow */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Flow Visualization</CardTitle>
                </CardHeader>
                <CardContent>
                    <FlowVisualization stages={flow.stages} transitions={flow.transitions} />
                </CardContent>
            </Card>

            {/* Stages */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">Stages</h3>
                    <Button variant="outline" size="sm" onClick={addStage}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Stage
                    </Button>
                </div>
                <div className="space-y-2">
                    {flow.stages.map((stage, i) => (
                        <FlowStageCard
                            key={stage.id}
                            stage={stage}
                            onUpdate={updated => updateStage(i, updated)}
                            onDelete={() => deleteStage(i)}
                        />
                    ))}
                </div>
            </div>

            {/* Transitions */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Transitions</CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={addTransition}
                            disabled={flow.stages.length < 2}
                        >
                            <Plus className="h-3.5 w-3.5 mr-1" /> Add
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {flow.transitions.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">
                            No transitions yet. Add transitions to connect stages.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {flow.transitions.map((t, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm">
                                    <Select
                                        value={t.fromStageId}
                                        onValueChange={v => updateTransition(i, { ...t, fromStageId: v })}
                                    >
                                        <SelectTrigger className="h-8 text-xs flex-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {flow.stages.map(s => (
                                                <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <span className="text-muted-foreground text-xs shrink-0">→</span>
                                    <Select
                                        value={t.toStageId}
                                        onValueChange={v => updateTransition(i, { ...t, toStageId: v })}
                                    >
                                        <SelectTrigger className="h-8 text-xs flex-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {flow.stages.map(s => (
                                                <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select
                                        value={t.condition}
                                        onValueChange={v => updateTransition(i, { ...t, condition: v as IntentSignal | 'auto' | 'fallback' })}
                                    >
                                        <SelectTrigger className="h-8 text-xs w-28">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {['browsing', 'comparing', 'pricing', 'booking', 'inquiry', 'complaint',
                                              'returning', 'urgent', 'location', 'contact', 'promo', 'schedule',
                                              'auto', 'fallback'].map(c => (
                                                <SelectItem key={c} value={c}>{c}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        type="number"
                                        value={t.priority}
                                        onChange={e => updateTransition(i, { ...t, priority: parseInt(e.target.value) || 0 })}
                                        className="h-8 w-16 text-xs"
                                        placeholder="Pri"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-red-500"
                                        onClick={() => deleteTransition(i)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Settings */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Flow Settings</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">Handoff Threshold</label>
                            <Input
                                type="number"
                                value={flow.settings.handoffThreshold}
                                onChange={e => updateSettings({ handoffThreshold: parseInt(e.target.value) || 10 })}
                                className="h-8 text-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">Max Turns Before Handoff</label>
                            <Input
                                type="number"
                                value={flow.settings.maxTurnsBeforeHandoff}
                                onChange={e => updateSettings({ maxTurnsBeforeHandoff: parseInt(e.target.value) || 15 })}
                                className="h-8 text-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">Fallback Behavior</label>
                            <Select
                                value={flow.settings.fallbackBehavior}
                                onValueChange={v => updateSettings({ fallbackBehavior: v as 'text' | 'quick_actions' | 'handoff' })}
                            >
                                <SelectTrigger className="h-8 text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="text">Text</SelectItem>
                                    <SelectItem value="quick_actions">Quick Actions</SelectItem>
                                    <SelectItem value="handoff">Handoff</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                <input
                                    type="checkbox"
                                    checked={flow.settings.enableLeadCapture}
                                    onChange={e => updateSettings({ enableLeadCapture: e.target.checked })}
                                    className="rounded"
                                />
                                Enable Lead Capture
                            </label>
                        </div>
                        <div className="space-y-1">
                            <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                <input
                                    type="checkbox"
                                    checked={flow.settings.enablePromos}
                                    onChange={e => updateSettings({ enablePromos: e.target.checked })}
                                    className="rounded"
                                />
                                Enable Promos
                            </label>
                        </div>
                        <div className="space-y-1">
                            <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                <input
                                    type="checkbox"
                                    checked={flow.settings.enableTestimonials}
                                    onChange={e => updateSettings({ enableTestimonials: e.target.checked })}
                                    className="rounded"
                                />
                                Enable Testimonials
                            </label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Reset to template */}
            <div className="flex items-center gap-2 pt-2">
                <p className="text-xs text-muted-foreground">Reset to a system template:</p>
                <div className="flex gap-2 flex-wrap">
                    {templates.slice(0, 4).map(t => (
                        <Button
                            key={t.id}
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => applyTemplate(t)}
                        >
                            <RotateCcw className="h-3 w-3 mr-1" /> {t.functionName}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
}
