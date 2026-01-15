'use client';

import React, { useState, useEffect } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
    FileText,
    Search,
    MessageSquare,
    GitBranch,
    ChevronDown,
    ChevronRight,
    Copy,
    Check,
    Code,
    Sparkles,
    Edit3,
    Save,
    X,
    RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    PROMPT_REGISTRY,
    getPromptCategories,
    type PromptDefinition
} from '@/lib/prompt-registry';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    'business-research': <Search className="w-4 h-4" />,
    'rag': <FileText className="w-4 h-4" />,
    'chat': <MessageSquare className="w-4 h-4" />,
    'workflow': <GitBranch className="w-4 h-4" />,
    'other': <Code className="w-4 h-4" />,
};

const CATEGORY_COLORS: Record<string, string> = {
    'business-research': 'bg-indigo-500',
    'rag': 'bg-emerald-500',
    'chat': 'bg-blue-500',
    'workflow': 'bg-purple-500',
    'other': 'bg-slate-500',
};

const STORAGE_KEY = 'centy-prompt-overrides';

// Get saved prompt overrides from localStorage
function getPromptOverrides(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch {
        return {};
    }
}

// Save prompt override to localStorage
function savePromptOverride(id: string, template: string) {
    const overrides = getPromptOverrides();
    overrides[id] = template;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

// Remove prompt override (restore to default)
function removePromptOverride(id: string) {
    const overrides = getPromptOverrides();
    delete overrides[id];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

// Safe clipboard copy
async function copyToClipboard(text: string): Promise<boolean> {
    try {
        if (navigator?.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        return true;
    } catch {
        return false;
    }
}

interface PromptCardProps {
    prompt: PromptDefinition;
    overrideTemplate?: string;
    onSave: (id: string, template: string) => void;
    onReset: (id: string) => void;
}

function PromptCard({ prompt, overrideTemplate, onSave, onReset }: PromptCardProps) {
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editedTemplate, setEditedTemplate] = useState('');

    const currentTemplate = overrideTemplate || prompt.template;
    const hasOverride = !!overrideTemplate;

    const handleCopy = async () => {
        const success = await copyToClipboard(currentTemplate);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } else {
            toast.error('Failed to copy to clipboard');
        }
    };

    const handleEdit = () => {
        setEditedTemplate(currentTemplate);
        setEditing(true);
    };

    const handleSave = () => {
        onSave(prompt.id, editedTemplate);
        setEditing(false);
        toast.success(`Saved "${prompt.name}"`);
    };

    const handleCancel = () => {
        setEditing(false);
        setEditedTemplate('');
    };

    const handleReset = () => {
        onReset(prompt.id);
        setEditing(false);
        toast.success(`Reset "${prompt.name}" to default`);
    };

    return (
        <Card className="overflow-hidden">
            <CardHeader
                className="cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => !editing && setExpanded(!expanded)}
            >
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                        <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center text-white",
                            CATEGORY_COLORS[prompt.category]
                        )}>
                            {CATEGORY_ICONS[prompt.category]}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-base font-semibold text-slate-900">
                                    {prompt.name}
                                </CardTitle>
                                {hasOverride && (
                                    <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
                                        Modified
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                                {prompt.description}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                            {prompt.category}
                        </Badge>
                        {expanded ? (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                        ) : (
                            <ChevronRight className="w-5 h-5 text-slate-400" />
                        )}
                    </div>
                </div>
            </CardHeader>

            {expanded && (
                <CardContent className="pt-0 space-y-4">
                    {/* Metadata */}
                    <div className="flex flex-wrap gap-4 text-sm text-slate-600 border-b border-slate-100 pb-4">
                        <div>
                            <span className="font-medium text-slate-700">Source:</span>{' '}
                            <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                                {prompt.sourceFile}
                            </code>
                        </div>
                        <div>
                            <span className="font-medium text-slate-700">Last Updated:</span>{' '}
                            {prompt.lastUpdated}
                        </div>
                        {prompt.variables && prompt.variables.length > 0 && (
                            <div>
                                <span className="font-medium text-slate-700">Variables:</span>{' '}
                                {prompt.variables.map((v, i) => (
                                    <code key={i} className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded mr-1">
                                        {'{' + v + '}'}
                                    </code>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Prompt Template */}
                    <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-700">
                                Prompt Template
                                {hasOverride && (
                                    <span className="text-amber-600 ml-2">(customized)</span>
                                )}
                            </span>
                            <div className="flex items-center gap-2">
                                {editing ? (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleCancel}
                                            className="h-8 text-xs"
                                        >
                                            <X className="w-3 h-3 mr-1" />
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="default"
                                            size="sm"
                                            onClick={handleSave}
                                            className="h-8 text-xs bg-green-600 hover:bg-green-700"
                                        >
                                            <Save className="w-3 h-3 mr-1" />
                                            Save
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        {hasOverride && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleReset}
                                                className="h-8 text-xs text-amber-600 hover:text-amber-700"
                                            >
                                                <RotateCcw className="w-3 h-3 mr-1" />
                                                Reset
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleEdit}
                                            className="h-8 text-xs"
                                        >
                                            <Edit3 className="w-3 h-3 mr-1" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleCopy}
                                            className="h-8 text-xs"
                                        >
                                            {copied ? (
                                                <>
                                                    <Check className="w-3 h-3 mr-1 text-green-600" />
                                                    Copied!
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-3 h-3 mr-1" />
                                                    Copy
                                                </>
                                            )}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        {editing ? (
                            <textarea
                                value={editedTemplate}
                                onChange={(e) => setEditedTemplate(e.target.value)}
                                className="w-full h-96 bg-slate-900 text-slate-100 p-4 rounded-lg text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                spellCheck={false}
                            />
                        ) : (
                            <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto max-h-96 overflow-y-auto">
                                <code className="whitespace-pre-wrap break-words">
                                    {currentTemplate}
                                </code>
                            </pre>
                        )}
                    </div>
                </CardContent>
            )}
        </Card>
    );
}

export default function AdminPromptsPage() {
    const categories = getPromptCategories();
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [overrides, setOverrides] = useState<Record<string, string>>({});

    // Load overrides on mount
    useEffect(() => {
        setOverrides(getPromptOverrides());
    }, []);

    const handleSave = (id: string, template: string) => {
        savePromptOverride(id, template);
        setOverrides(prev => ({ ...prev, [id]: template }));
    };

    const handleReset = (id: string) => {
        removePromptOverride(id);
        setOverrides(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    };

    const filteredPrompts = selectedCategory
        ? PROMPT_REGISTRY.filter(p => p.category === selectedCategory)
        : PROMPT_REGISTRY;

    const modifiedCount = Object.keys(overrides).length;

    return (
        <>
            <AdminHeader
                title="Prompt Manager"
                subtitle="View, edit, and manage AI prompts used across the application."
                actions={
                    <div className="flex items-center gap-2">
                        {modifiedCount > 0 && (
                            <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-700">
                                <Edit3 className="w-3 h-3" />
                                {modifiedCount} Modified
                            </Badge>
                        )}
                        <Badge variant="secondary" className="gap-1">
                            <Sparkles className="w-3 h-3" />
                            {PROMPT_REGISTRY.length} Prompts
                        </Badge>
                    </div>
                }
            />

            <main className="flex-1 overflow-auto p-6 space-y-6">
                {/* Category Filters */}
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant={selectedCategory === null ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(null)}
                    >
                        All ({PROMPT_REGISTRY.length})
                    </Button>
                    {categories.map(({ category, count, label }) => (
                        <Button
                            key={category}
                            variant={selectedCategory === category ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedCategory(category)}
                            className="gap-2"
                        >
                            {CATEGORY_ICONS[category]}
                            {label} ({count})
                        </Button>
                    ))}
                </div>

                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                    <strong>Note:</strong> Changes are saved to your browser's local storage.
                    To use modified prompts in the app, you'll need to update the source files.
                </div>

                {/* Prompt Cards */}
                <div className="space-y-4">
                    {filteredPrompts.map(prompt => (
                        <PromptCard
                            key={prompt.id}
                            prompt={prompt}
                            overrideTemplate={overrides[prompt.id]}
                            onSave={handleSave}
                            onReset={handleReset}
                        />
                    ))}
                </div>

                {filteredPrompts.length === 0 && (
                    <Card className="p-12 text-center">
                        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">No prompts found in this category.</p>
                    </Card>
                )}
            </main>
        </>
    );
}
