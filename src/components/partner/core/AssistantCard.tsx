"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
    Settings,
    MoreVertical,
    Copy,
    Trash2,
    MessageSquare,
    FileText,
    ExternalLink,
    Sparkles,
} from 'lucide-react';
import { Assistant, getAssistantColorClasses, TONE_LABELS } from '@/lib/types-assistant';

interface AssistantCardProps {
    assistant: Assistant;
    documentCount: number;
    onConfigure: () => void;
    onToggleActive: (isActive: boolean) => void;
    onDuplicate: () => void;
    onDelete: () => void;
    onTest: () => void;
    isLoading?: boolean;
}

export default function AssistantCard({
    assistant,
    documentCount,
    onConfigure,
    onToggleActive,
    onDuplicate,
    onDelete,
    onTest,
    isLoading,
}: AssistantCardProps) {
    const colors = getAssistantColorClasses(assistant.color);
    const isEssential = assistant.type === 'essential';

    return (
        <div className={cn(
            "bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-lg group",
            assistant.isActive ? colors.border : "border-gray-200 opacity-75"
        )}>
            <div className="p-5">
                <div className="flex items-start gap-4">
                    <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl bg-gradient-to-br shadow-lg",
                        colors.gradient
                    )}>
                        {assistant.avatar}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <h3 className="font-semibold text-gray-900 text-lg">{assistant.name}</h3>
                                    {isEssential && (
                                        <Badge variant="outline" className="text-[10px] border-indigo-200 text-indigo-600">
                                            Essential
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{assistant.description}</p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <Switch
                                    checked={assistant.isActive}
                                    onCheckedChange={onToggleActive}
                                    disabled={isLoading}
                                    className="scale-90"
                                />

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={onConfigure}>
                                            <Settings className="w-4 h-4 mr-2" />
                                            Configure
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={onTest}>
                                            <MessageSquare className="w-4 h-4 mr-2" />
                                            Test Chat
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={onDuplicate}>
                                            <Copy className="w-4 h-4 mr-2" />
                                            Duplicate
                                        </DropdownMenuItem>
                                        {!isEssential && (
                                            <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={onDelete} className="text-red-600">
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mt-4">
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>{TONE_LABELS[assistant.personality.tone]}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <FileText className="w-3.5 h-3.5" />
                                <span>
                                    {assistant.documentConfig.useAllDocuments
                                        ? `All docs (${documentCount})`
                                        : `${assistant.documentConfig.attachedDocumentIds.length} docs`
                                    }
                                </span>
                            </div>
                            {assistant.allowExternalUse && (
                                <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span>External</span>
                                </div>
                            )}
                            {assistant.usageCount > 0 && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span>{assistant.usageCount} uses</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-2">
                    {assistant.behaviorRules.responseRules.slice(0, 2).map((rule, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px] bg-white">
                            {rule.length > 30 ? rule.slice(0, 30) + '...' : rule}
                        </Badge>
                    ))}
                </div>
                <Button size="sm" variant="ghost" onClick={onConfigure} className="text-xs">
                    Configure
                    <Settings className="w-3 h-3 ml-1" />
                </Button>
            </div>
        </div>
    );
}
