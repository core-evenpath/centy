import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ChevronDown, Check, AlertCircle, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface Assistant {
    id: string;
    name: string;
    avatar: string; // emoji or url
    color?: string;
    type?: string;
}

interface AssistantSelectorProps {
    availableAssistants: Assistant[];
    selectedAssistantIds: string[];
    onSelectionChange: (ids: string[]) => void;
    isLoading?: boolean;
}

export function AssistantSelector({
    availableAssistants,
    selectedAssistantIds,
    onSelectionChange,
    isLoading
}: AssistantSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [menuPosition, setMenuPosition] = useState<'top' | 'bottom'>('bottom');

    // Only show active assistants
    const filteredAssistants = availableAssistants.filter(a =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleToggle = (assistantId: string) => {
        if (selectedAssistantIds.includes(assistantId)) {
            // Remove
            onSelectionChange(selectedAssistantIds.filter(id => id !== assistantId));
        } else {
            // Add (append to end)
            onSelectionChange([...selectedAssistantIds, assistantId]);
        }
    };

    const handleRemove = (assistantId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onSelectionChange(selectedAssistantIds.filter(id => id !== assistantId));
    };

    // Reorder: Move Primary to First
    const handleSetPrimary = (assistantId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const otherIds = selectedAssistantIds.filter(id => id !== assistantId);
        onSelectionChange([assistantId, ...otherIds]);
    };

    return (
        <div className="relative w-full z-20">
            {/* Trigger Button */}
            <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full justify-between h-auto min-h-[36px] py-1.5 px-3 bg-white/50 hover:bg-white/80 border-slate-200 transition-all font-normal text-slate-700"
                disabled={isLoading}
            >
                <div className="flex flex-wrap gap-1 items-center max-w-[calc(100%-20px)]">
                    {selectedAssistantIds.length === 0 ? (
                        <span className="text-slate-500 text-xs flex items-center gap-1.5">
                            <Bot className="w-3.5 h-3.5" />
                            Assign AI Assistants...
                        </span>
                    ) : (
                        selectedAssistantIds.map((id, index) => {
                            const assistant = availableAssistants.find(a => a.id === id);
                            if (!assistant) return null;
                            const isPrimary = index === 0;

                            return (
                                <Badge
                                    key={id}
                                    variant="secondary"
                                    className={`
                                        h-6 pl-1.5 pr-1 gap-1 flex items-center
                                        ${isPrimary
                                            ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                            : 'bg-slate-100 text-slate-600 border-slate-200'
                                        }
                                    `}
                                >
                                    <span className="text-[10px]">{assistant.avatar}</span>
                                    <span className="text-[10px] truncate max-w-[80px] font-medium">
                                        {assistant.name}
                                    </span>
                                    {isPrimary && (
                                        <span className="text-[9px] bg-indigo-100 px-1 rounded-sm text-indigo-700 font-bold ml-0.5">
                                            1
                                        </span>
                                    )}
                                    <div
                                        role="button"
                                        className="hover:bg-black/5 rounded-full p-0.5 cursor-pointer ml-0.5"
                                        onClick={(e) => handleRemove(id, e)}
                                    >
                                        <X className="w-2.5 h-2.5 opacity-60 hover:opacity-100" />
                                    </div>
                                </Badge>
                            );
                        })
                    )}
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-10 bg-transparent"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 4, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                            className="absolute z-30 w-[280px] bg-white rounded-lg shadow-xl border border-slate-200 p-2 top-full mt-1 right-0"
                            style={{ maxHeight: '320px', display: 'flex', flexDirection: 'column' }}
                        >
                            <div className="mb-2 relative px-1">
                                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                                <Input
                                    placeholder="Search assistants..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-8 pl-8 text-xs bg-slate-50 border-slate-200 focus-visible:ring-1 focus-visible:ring-indigo-500"
                                    autoFocus
                                />
                            </div>

                            <div className="overflow-y-auto flex-1 space-y-0.5 px-1 pr-1 custom-scrollbar">
                                {availableAssistants.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-md border border-dashed border-slate-200">
                                        No active assistants found.<br />
                                        Please create some in Core Memory.
                                    </div>
                                ) : filteredAssistants.length === 0 ? (
                                    <div className="p-3 text-center text-xs text-slate-500">
                                        No assistants match "{searchQuery}"
                                    </div>
                                ) : (
                                    filteredAssistants.map(assistant => {
                                        const isSelected = selectedAssistantIds.includes(assistant.id);
                                        const selectionIndex = selectedAssistantIds.indexOf(assistant.id);
                                        const isPrimary = selectionIndex === 0;

                                        return (
                                            <div
                                                key={assistant.id}
                                                className={`
                                                    group flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors
                                                    ${isSelected ? 'bg-indigo-50/60' : 'hover:bg-slate-50'}
                                                `}
                                                onClick={() => handleToggle(assistant.id)}
                                            >
                                                <div className="flex items-center gap-2.5 overflow-hidden">
                                                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-sm border border-slate-200 shrink-0">
                                                        {assistant.avatar}
                                                    </div>
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className={`text-xs font-medium truncate ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                                                            {assistant.name}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500 truncate capitalize">
                                                            {assistant.type?.replace('_', ' ') || 'Custom'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    {isSelected && (
                                                        <>
                                                            {selectionIndex > 0 && (
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-6 w-6 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                onClick={(e) => handleSetPrimary(assistant.id, e)}
                                                                            >
                                                                                <span className="text-[10px] font-bold">1st</span>
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent side="top" className="text-[10px]">Make Primary</TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            )}

                                                            {isPrimary ? (
                                                                <Badge className="h-5 px-1.5 bg-indigo-600 hover:bg-indigo-700 text-[9px]">Primary</Badge>
                                                            ) : (
                                                                <span className="h-5 px-1.5 flex items-center justify-center bg-slate-200/80 rounded-sm text-[9px] font-medium text-slate-600">
                                                                    Fallback #{selectionIndex}
                                                                </span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {selectedAssistantIds.length > 0 && (
                                <div className="pt-2 mt-2 border-t border-slate-100 px-1">
                                    <div className="flex items-start gap-1.5 p-2 bg-slate-50 rounded text-[10px] text-slate-500 leading-tight">
                                        <AlertCircle className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                                        <span>
                                            Use <strong>{availableAssistants.find(a => a.id === selectedAssistantIds[0])?.name}</strong> first.
                                            If no answer found, try fallbacks in order.
                                        </span>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
