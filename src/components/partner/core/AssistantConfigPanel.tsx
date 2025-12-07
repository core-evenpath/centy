"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import {
    Assistant,
    AssistantTone,
    AssistantStyle,
    AssistantResponseLength,
    ASSISTANT_AVATARS,
    ASSISTANT_COLORS,
    TONE_LABELS,
    STYLE_LABELS,
    LENGTH_LABELS,
    getAssistantColorClasses,
    generateSystemPrompt,
} from '@/lib/types-assistant';
import { DocumentMetadata } from '@/lib/partnerhub-types';
import {
    X,
    Save,
    MessageSquare,
    Check,
    RefreshCw,
    Wand2,
    Plus,
    MoreVertical,
    FileText,
    AlertCircle,
    ExternalLink,
    Unplug
} from 'lucide-react';
import { toast } from 'sonner';

interface AssistantConfigPanelProps {
    assistant: Assistant;
    documents: DocumentMetadata[];
    onSave: (updates: Partial<Assistant>) => Promise<void>;
    onClose: () => void;
    onTest?: (assistant: Assistant) => void;
}

export default function AssistantConfigPanel({
    assistant,
    documents,
    onSave,
    onClose,
    onTest
}: AssistantConfigPanelProps) {
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Identity
    const [name, setName] = useState(assistant.name);
    const [description, setDescription] = useState(assistant.description);
    const [avatar, setAvatar] = useState(assistant.avatar);
    const [color, setColor] = useState(assistant.color);

    // Personality
    const [tone, setTone] = useState<AssistantTone>(assistant.personality.tone);
    const [style, setStyle] = useState<AssistantStyle>(assistant.personality.style);
    const [responseLength, setResponseLength] = useState<AssistantResponseLength>(assistant.personality.responseLength);

    // Knowledge
    const [useAllDocuments, setUseAllDocuments] = useState(assistant.documentConfig.useAllDocuments);
    const [selectedDocIds, setSelectedDocIds] = useState<string[]>(
        assistant.documentConfig.attachedDocumentIds || []
    );
    const [externalDocIds, setExternalDocIds] = useState<string[]>(
        assistant.documentConfig.externalDocumentIds || []
    );
    const [allowExternalUse, setAllowExternalUse] = useState(assistant.allowExternalUse);

    // Rules
    const [responseRules, setResponseRules] = useState<string[]>(assistant.behaviorRules.responseRules || []);
    const [neverSay, setNeverSay] = useState<string[]>(assistant.behaviorRules.neverSay || []);
    const [escalationTriggers, setEscalationTriggers] = useState<string[]>(assistant.behaviorRules.escalationTriggers || []);
    const [openingMessage, setOpeningMessage] = useState(assistant.behaviorRules.openingMessage || '');

    // Advanced
    const [systemPrompt, setSystemPrompt] = useState(assistant.systemPrompt);
    const [systemPromptManualOverride, setSystemPromptManualOverride] = useState(!!assistant.systemPromptManualOverride);
    const [temperature, setTemperature] = useState(assistant.temperature || 0.7);

    // Input states for new rules
    const [newRule, setNewRule] = useState('');
    const [newNever, setNewNever] = useState('');
    const [newEscalation, setNewEscalation] = useState('');

    const hasChanges = () => {
        return name !== assistant.name ||
            description !== assistant.description ||
            avatar !== assistant.avatar ||
            color !== assistant.color ||
            tone !== assistant.personality.tone ||
            style !== assistant.personality.style ||
            responseLength !== assistant.personality.responseLength ||
            useAllDocuments !== assistant.documentConfig.useAllDocuments ||
            JSON.stringify(selectedDocIds.sort()) !== JSON.stringify((assistant.documentConfig.attachedDocumentIds || []).sort()) ||
            JSON.stringify(externalDocIds.sort()) !== JSON.stringify((assistant.documentConfig.externalDocumentIds || []).sort()) ||
            JSON.stringify(responseRules) !== JSON.stringify(assistant.behaviorRules.responseRules || []) ||
            JSON.stringify(neverSay) !== JSON.stringify(assistant.behaviorRules.neverSay || []) ||
            JSON.stringify(escalationTriggers) !== JSON.stringify(assistant.behaviorRules.escalationTriggers || []) ||
            openingMessage !== (assistant.behaviorRules.openingMessage || '') ||
            systemPrompt !== assistant.systemPrompt ||
            allowExternalUse !== assistant.allowExternalUse ||
            temperature !== (assistant.temperature || 0.7);
    };

    useEffect(() => {
        setIsDirty(hasChanges());
    }, [
        name, description, avatar, color,
        tone, style, responseLength,
        useAllDocuments, selectedDocIds, externalDocIds,
        responseRules, neverSay, escalationTriggers, openingMessage,
        systemPrompt, allowExternalUse, temperature
    ]);

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error('Name is required');
            return;
        }

        setIsSaving(true);
        try {
            await onSave({
                name,
                description,
                avatar,
                color,
                personality: { tone, style, responseLength },
                documentConfig: {
                    useAllDocuments,
                    attachedDocumentIds: useAllDocuments ? [] : selectedDocIds,
                    externalDocumentIds: useAllDocuments ? [] : externalDocIds,
                },
                behaviorRules: {
                    responseRules,
                    neverSay,
                    escalationTriggers,
                    openingMessage,
                },
                systemPrompt,
                systemPromptAutoGenerated: !systemPromptManualOverride,
                systemPromptManualOverride: systemPromptManualOverride ? systemPrompt : undefined,
                allowExternalUse,
                temperature,
            });
            setIsDirty(false);
            toast.success('Assistant updated successfully');
        } catch (error) {
            toast.error('Failed to update assistant');
        } finally {
            setIsSaving(false);
        }
    };

    const regeneratePrompt = () => {
        const generated = generateSystemPrompt({
            name,
            description,
            personality: { tone, style, responseLength },
            behaviorRules: { responseRules, neverSay, escalationTriggers, openingMessage },
        });
        setSystemPrompt(generated);
        setSystemPromptManualOverride(false);
        setIsDirty(true);
    };

    const addRule = (type: 'rule' | 'never' | 'escalation') => {
        if (type === 'rule' && newRule.trim()) {
            setResponseRules([...responseRules, newRule.trim()]);
            setNewRule('');
        } else if (type === 'never' && newNever.trim()) {
            setNeverSay([...neverSay, newNever.trim()]);
            setNewNever('');
        } else if (type === 'escalation' && newEscalation.trim()) {
            setEscalationTriggers([...escalationTriggers, newEscalation.trim()]);
            setNewEscalation('');
        }
    };

    const removeRule = (type: 'rule' | 'never' | 'escalation', index: number) => {
        if (type === 'rule') {
            setResponseRules(responseRules.filter((_, i) => i !== index));
        } else if (type === 'never') {
            setNeverSay(neverSay.filter((_, i) => i !== index));
        } else if (type === 'escalation') {
            setEscalationTriggers(escalationTriggers.filter((_, i) => i !== index));
        }
    };

    const toggleDocSelection = (docId: string) => {
        if (selectedDocIds.includes(docId)) {
            setSelectedDocIds(selectedDocIds.filter(id => id !== docId));
            setExternalDocIds(externalDocIds.filter(id => id !== docId));
        } else {
            setSelectedDocIds([...selectedDocIds, docId]);
        }
    };

    const toggleExternalDoc = (docId: string) => {
        if (externalDocIds.includes(docId)) {
            setExternalDocIds(externalDocIds.filter(id => id !== docId));
        } else {
            setExternalDocIds([...externalDocIds, docId]);
        }
    };

    const completedDocs = documents.filter(d => d.status === 'COMPLETED');
    const colors = getAssistantColorClasses(color);

    return (
        <div className="flex flex-col h-full bg-white border-l shadow-xl w-[600px] max-w-full">
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-gradient-to-br",
                        colors.gradient
                    )}>
                        {avatar}
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">{name}</h2>
                        <p className="text-xs text-gray-500">
                            {assistant.type === 'essential' ? 'Essential Assistant' : 'Custom Assistant'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onTest && onTest(assistant)}
                        className="hidden sm:flex"
                    >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Test
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={!isDirty || isSaving}
                        className={isDirty ? "bg-indigo-600 hover:bg-indigo-700" : ""}
                    >
                        {isSaving ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : isDirty ? (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4 mr-2" />
                                Saved
                            </>
                        )}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="identity" className="flex-1 flex flex-col min-h-0">
                <div className="border-b px-4">
                    <TabsList className="bg-transparent w-full justify-start h-12 p-0 space-x-6">
                        {['Identity', 'Personality', 'Knowledge', 'Rules', 'Advanced'].map((tab) => (
                            <TabsTrigger
                                key={tab}
                                value={tab.toLowerCase()}
                                className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent px-0"
                            >
                                {tab}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-6">
                        <TabsContent value="identity" className="space-y-6 mt-0">
                            <div className="grid grid-cols-4 gap-6">
                                <div className="space-y-2">
                                    <Label>Avatar</Label>
                                    <Select value={avatar} onValueChange={setAvatar}>
                                        <SelectTrigger className="h-10 text-xl">
                                            <SelectValue>{avatar}</SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <div className="grid grid-cols-5 gap-1 p-2">
                                                {ASSISTANT_AVATARS.map((a) => (
                                                    <button
                                                        key={a.emoji}
                                                        onClick={() => setAvatar(a.emoji)}
                                                        className={cn(
                                                            "w-8 h-8 rounded hover:bg-gray-100 transition-colors flex items-center justify-center text-lg",
                                                            avatar === a.emoji && "bg-indigo-100 ring-1 ring-indigo-500"
                                                        )}
                                                    >
                                                        {a.emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-3 space-y-2">
                                    <Label>Name</Label>
                                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Theme Color</Label>
                                <div className="flex gap-2 p-1">
                                    {ASSISTANT_COLORS.map((c) => (
                                        <button
                                            key={c.value}
                                            onClick={() => setColor(c.value)}
                                            className={cn(
                                                "w-8 h-8 rounded-full bg-gradient-to-br ring-offset-2 transition-all",
                                                getAssistantColorClasses(c.value).gradient,
                                                color === c.value ? "ring-2 ring-gray-400 scale-110" : "hover:scale-105"
                                            )}
                                            title={c.label}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Opening Message</Label>
                                <Input
                                    value={openingMessage}
                                    onChange={(e) => setOpeningMessage(e.target.value)}
                                    placeholder="Optional greeting message..."
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="personality" className="space-y-6 mt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Tone</Label>
                                    <Select value={tone} onValueChange={(v) => setTone(v as AssistantTone)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(TONE_LABELS).map(([k, v]) => (
                                                <SelectItem key={k} value={k}>{v}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Style</Label>
                                    <Select value={style} onValueChange={(v) => setStyle(v as AssistantStyle)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(STYLE_LABELS).map(([k, v]) => (
                                                <SelectItem key={k} value={k}>{v}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Response Length</Label>
                                <Select value={responseLength} onValueChange={(v) => setResponseLength(v as AssistantResponseLength)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(LENGTH_LABELS).map(([k, v]) => (
                                            <SelectItem key={k} value={k}>{v}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <h4 className="font-medium text-sm text-gray-900 mb-2">Personality Summary</h4>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    This assistant behaves in a <span className="font-semibold text-indigo-600">{tone}</span> tone with a <span className="font-semibold text-indigo-600">{style}</span> communication style.
                                    Responses are typically <span className="font-semibold text-indigo-600">{responseLength}</span>.
                                </p>
                            </div>
                        </TabsContent>

                        <TabsContent value="knowledge" className="space-y-6 mt-0">
                            <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-900">Knowledge Base Access</h4>
                                        <p className="text-xs text-gray-500">Determine which documents this assistant can reference</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={useAllDocuments}
                                            onCheckedChange={setUseAllDocuments}
                                        />
                                        <span className="text-sm font-medium">{useAllDocuments ? 'All Documents' : 'Selected Only'}</span>
                                    </div>
                                </div>

                                {!useAllDocuments && (
                                    <div className="bg-white rounded-lg border border-gray-200 max-h-[300px] overflow-y-auto">
                                        {completedDocs.length === 0 ? (
                                            <div className="p-8 text-center text-gray-500">
                                                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                                <p className="text-sm">No documents available</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-gray-100">
                                                {completedDocs.map((doc) => (
                                                    <div
                                                        key={doc.id}
                                                        className={cn(
                                                            "flex items-center justify-between p-3 hover:bg-gray-50 transition-colors",
                                                            selectedDocIds.includes(doc.id) && "bg-indigo-50/30"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedDocIds.includes(doc.id)}
                                                                onChange={() => toggleDocSelection(doc.id)}
                                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                            />
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900 line-clamp-1">{doc.name}</p>
                                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                    <Badge variant="outline" className="text-[10px] h-4 py-0 px-1 font-normal">
                                                                        {doc.category}
                                                                    </Badge>
                                                                    <span>{(doc.size / 1024).toFixed(0)} KB</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {selectedDocIds.includes(doc.id) && (
                                                            <div className="flex items-center gap-2 ml-4">
                                                                <span className="text-[10px] uppercase font-semibold text-gray-400">External</span>
                                                                <Switch
                                                                    className="scale-75 origin-right"
                                                                    checked={externalDocIds.includes(doc.id)}
                                                                    onCheckedChange={() => toggleExternalDoc(doc.id)}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-900">External Availability</h4>
                                    <p className="text-xs text-gray-500">Allow this assistant to be used in customer-facing chat?</p>
                                </div>
                                <Switch
                                    checked={allowExternalUse}
                                    onCheckedChange={setAllowExternalUse}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="rules" className="space-y-8 mt-0">
                            {/* Response Rules */}
                            <div className="space-y-3">
                                <Label>Response Rules (Must Follow)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={newRule}
                                        onChange={(e) => setNewRule(e.target.value)}
                                        placeholder="Add a new rule..."
                                        onKeyDown={(e) => e.key === 'Enter' && addRule('rule')}
                                    />
                                    <Button size="icon" onClick={() => addRule('rule')} disabled={!newRule.trim()}>
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-gray-50 rounded-lg border border-gray-100">
                                    {responseRules.length === 0 && <span className="text-xs text-gray-400 italic p-1">No rules defined</span>}
                                    {responseRules.map((rule, i) => (
                                        <Badge key={i} variant="secondary" className="pl-2 pr-1 py-1 gap-1 bg-white hover:bg-gray-100 border-gray-200">
                                            {rule}
                                            <button onClick={() => removeRule('rule', i)} className="text-gray-400 hover:text-red-500">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* Never Say */}
                            <div className="space-y-3">
                                <Label>Never Say (Strict Prohibitions)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={newNever}
                                        onChange={(e) => setNewNever(e.target.value)}
                                        placeholder="Add prohibited phrase..."
                                        onKeyDown={(e) => e.key === 'Enter' && addRule('never')}
                                    />
                                    <Button size="icon" onClick={() => addRule('never')} disabled={!newNever.trim()}>
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-rose-50/50 rounded-lg border border-rose-100">
                                    {neverSay.length === 0 && <span className="text-xs text-gray-400 italic p-1">No prohibitions defined</span>}
                                    {neverSay.map((phrase, i) => (
                                        <Badge key={i} variant="outline" className="pl-2 pr-1 py-1 gap-1 border-rose-200 text-rose-700 bg-white">
                                            "{phrase}"
                                            <button onClick={() => removeRule('never', i)} className="text-rose-400 hover:text-rose-600">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* Escalation Triggers */}
                            <div className="space-y-3">
                                <Label>Escalation Triggers (Human Handoff)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={newEscalation}
                                        onChange={(e) => setNewEscalation(e.target.value)}
                                        placeholder="Add trigger condition..."
                                        onKeyDown={(e) => e.key === 'Enter' && addRule('escalation')}
                                    />
                                    <Button size="icon" onClick={() => addRule('escalation')} disabled={!newEscalation.trim()}>
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-amber-50/50 rounded-lg border border-amber-100">
                                    {escalationTriggers.length === 0 && <span className="text-xs text-gray-400 italic p-1">No triggers defined</span>}
                                    {escalationTriggers.map((trigger, i) => (
                                        <Badge key={i} variant="outline" className="pl-2 pr-1 py-1 gap-1 border-amber-200 text-amber-700 bg-white">
                                            {trigger}
                                            <button onClick={() => removeRule('escalation', i)} className="text-amber-400 hover:text-amber-600">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="advanced" className="space-y-6 mt-0">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>System Prompt</Label>
                                        <p className="text-xs text-gray-500">The core instructions for the AI model</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {systemPromptManualOverride && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSystemPromptManualOverride(false);
                                                    regeneratePrompt();
                                                }}
                                                className="h-8 text-xs"
                                            >
                                                <Unplug className="w-3 h-3 mr-1" />
                                                Reset to Auto
                                            </Button>
                                        )}
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={regeneratePrompt}
                                            className="h-8 text-xs"
                                        >
                                            <Wand2 className="w-3 h-3 mr-1" />
                                            Regenerate
                                        </Button>
                                    </div>
                                </div>

                                <div className="relative">
                                    <Textarea
                                        value={systemPrompt}
                                        onChange={(e) => {
                                            setSystemPrompt(e.target.value);
                                            setSystemPromptManualOverride(true);
                                        }}
                                        rows={12}
                                        className={cn(
                                            "font-mono text-xs leading-relaxed resize-none",
                                            systemPromptManualOverride ? "border-amber-300 ring-1 ring-amber-100" : ""
                                        )}
                                    />
                                    {systemPromptManualOverride && (
                                        <div className="absolute bottom-2 right-2 px-2 py-1 bg-amber-100 text-amber-700 text-[10px] rounded font-medium border border-amber-200">
                                            Manual Override Active
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label>Temperature (Creativity): {temperature}</Label>
                                    </div>
                                    <Slider
                                        value={[temperature]}
                                        onValueChange={(val) => setTemperature(val[0])}
                                        min={0}
                                        max={1}
                                        step={0.1}
                                        className="py-4"
                                    />
                                    <div className="flex justify-between text-xs text-gray-400">
                                        <span>Precise (0.0)</span>
                                        <span>Balanced (0.7)</span>
                                        <span>Creative (1.0)</span>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </div>
                </ScrollArea>

                <div className="p-4 border-t bg-gray-50 text-xs text-center text-gray-400">
                    ID: {assistant.id}
                </div>
            </Tabs>
        </div>
    );
}
