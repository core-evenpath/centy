"use client";

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    Sparkles,
    FileText,
    Settings,
    Plus,
    X,
    RefreshCw,
    ChevronRight,
    Wand2,
    AlertCircle,
} from 'lucide-react';
import {
    Assistant,
    AssistantTemplate,
    ASSISTANT_TEMPLATES,
    ASSISTANT_AVATARS,
    ASSISTANT_COLORS,
    TONE_LABELS,
    STYLE_LABELS,
    LENGTH_LABELS,
    DEFAULT_ASSISTANT_PERSONALITY,
    DEFAULT_ASSISTANT_DOCUMENT_CONFIG,
    DEFAULT_ASSISTANT_BEHAVIOR_RULES,
    generateSystemPrompt,
    getAssistantColorClasses,
    AssistantTone,
    AssistantStyle,
    AssistantResponseLength,
} from '@/lib/types-assistant';
import { DocumentMetadata } from '@/lib/partnerhub-types';
import { toast } from 'sonner';

interface CreateAssistantModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    documents: DocumentMetadata[];
    onCreateFromTemplate: (templateId: string) => Promise<void>;
    onCreateCustom: (assistant: Partial<Assistant>) => Promise<void>;
    isCreating: boolean;
}

type Step = 'template' | 'configure';

export default function CreateAssistantModal({
    open,
    onOpenChange,
    documents,
    onCreateFromTemplate,
    onCreateCustom,
    isCreating,
}: CreateAssistantModalProps) {
    const [step, setStep] = useState<Step>('template');
    const [selectedTemplate, setSelectedTemplate] = useState<AssistantTemplate | null>(null);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [avatar, setAvatar] = useState('🤖');
    const [color, setColor] = useState('blue');

    const [tone, setTone] = useState<AssistantTone>('professional');
    const [style, setStyle] = useState<AssistantStyle>('conversational');
    const [responseLength, setResponseLength] = useState<AssistantResponseLength>('moderate');

    const [useAllDocuments, setUseAllDocuments] = useState(true);
    const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
    const [externalDocIds, setExternalDocIds] = useState<string[]>([]);

    const [responseRules, setResponseRules] = useState<string[]>([]);
    const [neverSay, setNeverSay] = useState<string[]>([]);
    const [escalationTriggers, setEscalationTriggers] = useState<string[]>([]);
    const [openingMessage, setOpeningMessage] = useState('');

    const [newRule, setNewRule] = useState('');
    const [newNever, setNewNever] = useState('');
    const [newEscalation, setNewEscalation] = useState('');

    const [systemPrompt, setSystemPrompt] = useState('');
    const [systemPromptManualOverride, setSystemPromptManualOverride] = useState(false);
    const [allowExternalUse, setAllowExternalUse] = useState(true);

    const [activeTab, setActiveTab] = useState('identity');

    const resetForm = () => {
        setStep('template');
        setSelectedTemplate(null);
        setName('');
        setDescription('');
        setAvatar('🤖');
        setColor('blue');
        setTone('professional');
        setStyle('conversational');
        setResponseLength('moderate');
        setUseAllDocuments(true);
        setSelectedDocIds([]);
        setExternalDocIds([]);
        setResponseRules([]);
        setNeverSay([]);
        setEscalationTriggers([]);
        setOpeningMessage('');
        setSystemPrompt('');
        setSystemPromptManualOverride(false);
        setAllowExternalUse(true);
        setActiveTab('identity');
    };

    const handleSelectTemplate = (template: AssistantTemplate) => {
        setSelectedTemplate(template);
        setName(template.name);
        setDescription(template.description);
        setAvatar(template.avatar);
        setColor(template.color);
        setTone(template.personality.tone);
        setStyle(template.personality.style);
        setResponseLength(template.personality.responseLength);
        setResponseRules(template.behaviorRules.responseRules || []);
        setNeverSay(template.behaviorRules.neverSay || []);
        setEscalationTriggers(template.behaviorRules.escalationTriggers || []);
        setSystemPrompt(template.systemPromptTemplate);
        setStep('configure');
    };

    const handleStartBlank = () => {
        resetForm();
        setStep('configure');
    };

    const handleBack = () => {
        setStep('template');
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
    };

    const handleCreate = async () => {
        if (!name.trim()) {
            toast.error('Please enter a name for the assistant');
            return;
        }

        const assistant: Partial<Assistant> = {
            name: name.trim(),
            description: description.trim(),
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
            systemPrompt: systemPrompt || generateSystemPrompt({
                name,
                description,
                personality: { tone, style, responseLength },
                behaviorRules: { responseRules, neverSay, escalationTriggers, openingMessage },
            }),
            systemPromptAutoGenerated: !systemPromptManualOverride,
            systemPromptManualOverride: systemPromptManualOverride ? systemPrompt : undefined,
            allowExternalUse,
            isActive: true,
            temperature: 0.7,
            maxTokens: 1024,
        };

        await onCreateCustom(assistant);
        resetForm();
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

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
            <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-4 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        {step === 'template' ? (
                            <>
                                <Sparkles className="w-5 h-5 text-indigo-600" />
                                Create New Assistant
                            </>
                        ) : (
                            <>
                                <span
                                    className="text-2xl cursor-pointer hover:scale-110 transition-transform"
                                    onClick={() => setStep('template')}
                                >
                                    {avatar}
                                </span>
                                {name || 'Configure Assistant'}
                            </>
                        )}
                    </DialogTitle>
                </DialogHeader>

                {step === 'template' ? (
                    <ScrollArea className="max-h-[60vh]">
                        <div className="p-6 space-y-6">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Start from a template</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {ASSISTANT_TEMPLATES.map((template) => {
                                        const colors = getAssistantColorClasses(template.color);
                                        return (
                                            <button
                                                key={template.id}
                                                onClick={() => handleSelectTemplate(template)}
                                                className={cn(
                                                    "flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all hover:shadow-md",
                                                    "border-gray-200 hover:border-gray-300 bg-white"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-gradient-to-br",
                                                    colors.gradient
                                                )}>
                                                    {template.avatar}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-gray-900 text-sm">{template.name}</h4>
                                                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{template.description}</p>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 mt-1" />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-gray-200" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-2 text-gray-500">or</span>
                                </div>
                            </div>

                            <button
                                onClick={handleStartBlank}
                                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-300 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                <span className="font-medium">Start from scratch</span>
                            </button>
                        </div>
                    </ScrollArea>
                ) : (
                    <>
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                            <div className="border-b px-6">
                                <TabsList className="h-12 bg-transparent gap-4">
                                    <TabsTrigger value="identity" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-1">
                                        Identity
                                    </TabsTrigger>
                                    <TabsTrigger value="personality" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-1">
                                        Personality
                                    </TabsTrigger>
                                    <TabsTrigger value="knowledge" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-1">
                                        Knowledge
                                    </TabsTrigger>
                                    <TabsTrigger value="rules" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-1">
                                        Rules
                                    </TabsTrigger>
                                    <TabsTrigger value="advanced" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-1">
                                        Advanced
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <ScrollArea className="h-[400px]">
                                <TabsContent value="identity" className="p-6 space-y-4 mt-0">
                                    <div className="flex gap-4">
                                        <div className="space-y-2">
                                            <Label>Avatar</Label>
                                            <Select value={avatar} onValueChange={setAvatar}>
                                                <SelectTrigger className="w-20 h-12 text-2xl">
                                                    <SelectValue>{avatar}</SelectValue>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <div className="grid grid-cols-5 gap-1 p-2">
                                                        {ASSISTANT_AVATARS.map((a) => (
                                                            <button
                                                                key={a.emoji}
                                                                onClick={() => setAvatar(a.emoji)}
                                                                className={cn(
                                                                    "w-10 h-10 rounded-lg text-xl hover:bg-gray-100 transition-colors",
                                                                    avatar === a.emoji && "bg-indigo-100"
                                                                )}
                                                            >
                                                                {a.emoji}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex-1 space-y-2">
                                            <Label htmlFor="name">Name *</Label>
                                            <Input
                                                id="name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="e.g., Technical Support"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Color</Label>
                                            <Select value={color} onValueChange={setColor}>
                                                <SelectTrigger className="w-28">
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn(
                                                            "w-4 h-4 rounded-full bg-gradient-to-br",
                                                            getAssistantColorClasses(color).gradient
                                                        )} />
                                                        <SelectValue />
                                                    </div>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {ASSISTANT_COLORS.map((c) => (
                                                        <SelectItem key={c.value} value={c.value}>
                                                            <div className="flex items-center gap-2">
                                                                <div className={cn(
                                                                    "w-4 h-4 rounded-full bg-gradient-to-br",
                                                                    getAssistantColorClasses(c.value).gradient
                                                                )} />
                                                                {c.label}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Briefly describe what this assistant does..."
                                            rows={3}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="opening">Opening Message (Optional)</Label>
                                        <Input
                                            id="opening"
                                            value={openingMessage}
                                            onChange={(e) => setOpeningMessage(e.target.value)}
                                            placeholder="e.g., Hello! How can I help you today?"
                                        />
                                        <p className="text-xs text-gray-500">This message is shown when starting a new conversation</p>
                                    </div>
                                </TabsContent>

                                <TabsContent value="personality" className="p-6 space-y-4 mt-0">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>Tone</Label>
                                            <Select value={tone} onValueChange={(v) => setTone(v as AssistantTone)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(TONE_LABELS).map(([key, label]) => (
                                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Style</Label>
                                            <Select value={style} onValueChange={(v) => setStyle(v as AssistantStyle)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(STYLE_LABELS).map(([key, label]) => (
                                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Response Length</Label>
                                            <Select value={responseLength} onValueChange={(v) => setResponseLength(v as AssistantResponseLength)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(LENGTH_LABELS).map(([key, label]) => (
                                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="text-sm font-medium text-gray-900 mb-2">Preview</h4>
                                        <p className="text-sm text-gray-600">
                                            This assistant will communicate in a <strong>{tone}</strong> tone,
                                            using a <strong>{style}</strong> style,
                                            with <strong>{responseLength}</strong> responses.
                                        </p>
                                    </div>
                                </TabsContent>

                                <TabsContent value="knowledge" className="p-6 space-y-4 mt-0">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label>Document Access</Label>
                                            <p className="text-xs text-gray-500 mt-0.5">Choose which documents this assistant can use</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={useAllDocuments}
                                                onCheckedChange={setUseAllDocuments}
                                            />
                                            <span className="text-sm text-gray-600">Use all documents</span>
                                        </div>
                                    </div>

                                    {!useAllDocuments && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                                                <AlertCircle className="w-4 h-4" />
                                                <span>Select documents and mark which can be used in customer conversations</span>
                                            </div>

                                            {completedDocs.length === 0 ? (
                                                <div className="text-center py-8 text-gray-500">
                                                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                    <p className="text-sm">No documents available</p>
                                                    <p className="text-xs">Upload documents in the Documents tab</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                                    {completedDocs.map((doc) => (
                                                        <div
                                                            key={doc.id}
                                                            className={cn(
                                                                "flex items-center justify-between p-3 rounded-lg border transition-colors",
                                                                selectedDocIds.includes(doc.id)
                                                                    ? "border-indigo-200 bg-indigo-50/50"
                                                                    : "border-gray-200 hover:border-gray-300"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedDocIds.includes(doc.id)}
                                                                    onChange={() => toggleDocSelection(doc.id)}
                                                                    className="rounded border-gray-300"
                                                                />
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                                                                    <p className="text-xs text-gray-500">{doc.category}</p>
                                                                </div>
                                                            </div>

                                                            {selectedDocIds.includes(doc.id) && (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs text-gray-500">External:</span>
                                                                    <Switch
                                                                        checked={externalDocIds.includes(doc.id)}
                                                                        onCheckedChange={() => toggleExternalDoc(doc.id)}
                                                                        className="scale-75"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="flex gap-4 text-xs text-gray-500 pt-2">
                                                <span>Selected: {selectedDocIds.length}</span>
                                                <span>•</span>
                                                <span>External: {externalDocIds.length}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-4 border-t">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label>Allow in Customer Conversations</Label>
                                                <p className="text-xs text-gray-500 mt-0.5">Can this assistant be used in Inbox?</p>
                                            </div>
                                            <Switch
                                                checked={allowExternalUse}
                                                onCheckedChange={setAllowExternalUse}
                                            />
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="rules" className="p-6 space-y-6 mt-0">
                                    <div className="space-y-3">
                                        <Label>Response Rules</Label>
                                        <p className="text-xs text-gray-500">Instructions the assistant should always follow</p>

                                        <div className="flex gap-2">
                                            <Input
                                                value={newRule}
                                                onChange={(e) => setNewRule(e.target.value)}
                                                placeholder="e.g., Always greet by name"
                                                onKeyDown={(e) => e.key === 'Enter' && addRule('rule')}
                                            />
                                            <Button size="sm" onClick={() => addRule('rule')} disabled={!newRule.trim()}>
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        {responseRules.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {responseRules.map((rule, i) => (
                                                    <Badge key={i} variant="secondary" className="pl-2 pr-1 py-1 gap-1">
                                                        {rule}
                                                        <button onClick={() => removeRule('rule', i)} className="hover:bg-gray-300 rounded p-0.5">
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <Label>Never Say</Label>
                                        <p className="text-xs text-gray-500">Phrases the assistant should avoid</p>

                                        <div className="flex gap-2">
                                            <Input
                                                value={newNever}
                                                onChange={(e) => setNewNever(e.target.value)}
                                                placeholder="e.g., I don't know"
                                                onKeyDown={(e) => e.key === 'Enter' && addRule('never')}
                                            />
                                            <Button size="sm" onClick={() => addRule('never')} disabled={!newNever.trim()}>
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        {neverSay.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {neverSay.map((phrase, i) => (
                                                    <Badge key={i} variant="outline" className="pl-2 pr-1 py-1 gap-1 border-rose-200 text-rose-700">
                                                        "{phrase}"
                                                        <button onClick={() => removeRule('never', i)} className="hover:bg-rose-100 rounded p-0.5">
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <Label>Escalation Triggers</Label>
                                        <p className="text-xs text-gray-500">When to hand off to a human</p>

                                        <div className="flex gap-2">
                                            <Input
                                                value={newEscalation}
                                                onChange={(e) => setNewEscalation(e.target.value)}
                                                placeholder="e.g., Customer requests manager"
                                                onKeyDown={(e) => e.key === 'Enter' && addRule('escalation')}
                                            />
                                            <Button size="sm" onClick={() => addRule('escalation')} disabled={!newEscalation.trim()}>
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        {escalationTriggers.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {escalationTriggers.map((trigger, i) => (
                                                    <Badge key={i} variant="outline" className="pl-2 pr-1 py-1 gap-1 border-amber-200 text-amber-700">
                                                        {trigger}
                                                        <button onClick={() => removeRule('escalation', i)} className="hover:bg-amber-100 rounded p-0.5">
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="advanced" className="p-6 space-y-4 mt-0">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label>System Prompt</Label>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={regeneratePrompt}
                                                className="text-xs gap-1"
                                            >
                                                <Wand2 className="w-3 h-3" />
                                                Auto-generate
                                            </Button>
                                        </div>
                                        <Textarea
                                            value={systemPrompt}
                                            onChange={(e) => {
                                                setSystemPrompt(e.target.value);
                                                setSystemPromptManualOverride(true);
                                            }}
                                            placeholder="Enter custom system prompt or click auto-generate..."
                                            rows={8}
                                            className="font-mono text-xs"
                                        />
                                        <p className="text-xs text-gray-500">
                                            {systemPromptManualOverride
                                                ? "Using manual override - changes to personality/rules won't auto-update this"
                                                : "Auto-generated from personality and rules settings"
                                            }
                                        </p>
                                    </div>
                                </TabsContent>
                            </ScrollArea>
                        </Tabs>

                        <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
                            <Button variant="ghost" onClick={handleBack}>
                                Back to templates
                            </Button>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => onOpenChange(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleCreate} disabled={isCreating || !name.trim()}>
                                    {isCreating ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        'Create Assistant'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
