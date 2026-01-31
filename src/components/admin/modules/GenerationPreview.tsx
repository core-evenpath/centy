
'use client';

import { ModuleSchema, ModuleItem } from "@/lib/modules/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, ArrowRight, RotateCw, Edit, Sparkles, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface GenerationPreviewProps {
    schema: ModuleSchema;
    items: ModuleItem[];
    moduleName: string;
    onRegenerate: (type: 'all' | 'fields' | 'categories' | 'items', refinement?: string) => void;
    onSave: () => void;
    onCancel: () => void;
    isSaving?: boolean;
}

export function GenerationPreview({
    schema,
    items,
    moduleName,
    onRegenerate,
    onSave,
    onCancel,
    isSaving = false
}: GenerationPreviewProps) {
    const [showRefinementInput, setShowRefinementInput] = useState(false);
    const [refinementPrompt, setRefinementPrompt] = useState("");

    const handleRegenerateRequest = (type: 'all' | 'fields' | 'categories' | 'items') => {
        if (showRefinementInput) {
            onRegenerate(type, refinementPrompt);
            setShowRefinementInput(false);
            setRefinementPrompt("");
        } else {
            setShowRefinementInput(true);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                            <Check className="h-5 w-5" />
                        </span>
                        Module Generated Successfully
                    </h2>
                    <p className="text-muted-foreground mt-1">Review the AI-generated schema and sample items.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onCancel} disabled={isSaving}>
                        Back to Edit
                    </Button>
                    <Button onClick={onSave} disabled={isSaving} className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md">
                        {isSaving ? (
                            <>
                                <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Check className="mr-2 h-4 w-4" />
                                Publish Module
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Schema Preview */}
                <Card className="border-indigo-100 bg-gradient-to-br from-white to-indigo-50/20">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between">
                            <span>Generated Schema</span>
                            <div className="flex gap-2 text-sm font-normal">
                                <Badge variant="outline" className="bg-white">{schema.fields.length} Fields</Badge>
                                <Badge variant="outline" className="bg-white">{schema.categories.length} Categories</Badge>
                            </div>
                        </CardTitle>
                        <CardDescription>Structured data definition for this module</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h4 className="text-sm font-medium mb-3 flex items-center gap-2 text-indigo-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                Key Fields
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                                {schema.fields.slice(0, 8).map(field => (
                                    <div key={field.id} className="flex items-center gap-2 text-sm p-2 rounded-md bg-white border border-indigo-100/50 shadow-sm">
                                        {field.isRequired ? (
                                            <span className="text-red-500 text-xs" title="Required">*</span>
                                        ) : (
                                            <span className="text-slate-300 text-xs">○</span>
                                        )}
                                        <span className="font-medium text-slate-700 truncate">{field.name}</span>
                                        <span className="ml-auto text-[10px] text-slate-400 uppercase tracking-wider">{field.type}</span>
                                    </div>
                                ))}
                                {schema.fields.length > 8 && (
                                    <div className="col-span-2 text-center text-xs text-muted-foreground italic py-1">
                                        + {schema.fields.length - 8} more fields...
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-medium mb-3 flex items-center gap-2 text-pink-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-pink-500" />
                                Categories
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {schema.categories.slice(0, 8).map(cat => (
                                    <Badge key={cat.id} variant="secondary" className="bg-white border hover:bg-slate-50">
                                        {cat.icon && <span className="mr-1">{cat.icon}</span>}
                                        {cat.name}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Sample Items Preview */}
                <Card className="border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-lg">Sample Items</CardTitle>
                        <CardDescription>AI-generated example data for partners</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px] pr-4">
                            <div className="space-y-3">
                                {items.map((item: any, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                        <div className="h-10 w-10 rounded-lg bg-white border shadow-sm flex items-center justify-center text-xl shrink-0">
                                            {schema.categories.find(c => c.id === item.category)?.icon || '📦'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <h4 className="font-medium text-sm truncate">{item.name}</h4>
                                                <span className="text-xs font-semibold text-slate-900">
                                                    ₹{item.price?.toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                                            <div className="flex gap-2 mt-2">
                                                {Object.entries(item.fields || {}).slice(0, 2).map(([key, val]: [string, any]) => (
                                                    <Badge key={key} variant="outline" className="text-[10px] h-5 bg-white">
                                                        {String(val)}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            {/* AI Controls */}
            <Card className="bg-slate-50 border-slate-200">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <Sparkles className="h-5 w-5 text-purple-500 mt-1" />
                            <div>
                                <h4 className="font-medium text-sm text-slate-900">Refine with AI</h4>
                                <p className="text-xs text-muted-foreground">Not happy with the results? You can regenerate specific parts.</p>
                            </div>
                        </div>

                        <div className="flex gap-2 w-full md:w-auto">
                            <Button variant="outline" size="sm" onClick={() => handleRegenerateRequest('fields')}>
                                <RotateCw className="mr-2 h-3.5 w-3.5" />
                                Fields
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleRegenerateRequest('categories')}>
                                <RotateCw className="mr-2 h-3.5 w-3.5" />
                                Categories
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleRegenerateRequest('all')}>
                                <RotateCw className="mr-2 h-3.5 w-3.5" />
                                Regenerate All
                            </Button>
                        </div>
                    </div>

                    {showRefinementInput && (
                        <div className="mt-4 pt-4 border-t border-slate-200 animate-in slide-in-from-top-2">
                            <label className="text-sm font-medium mb-1.5 block">
                                Refinement Instructions (Optional)
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="flex-1 h-9 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                    placeholder="E.g., 'Add more fields for technical specs', 'Use more formal category names'..."
                                    value={refinementPrompt}
                                    onChange={(e) => setRefinementPrompt(e.target.value)}
                                    autoFocus
                                />
                                <Button size="sm" onClick={() => handleRegenerateRequest('all')}>
                                    apply
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
