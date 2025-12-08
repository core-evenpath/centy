import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ChevronDown, Check, AlertCircle, Bot, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface Assistant {
    id: string;
    name: string;
    avatar: string;
    color?: string;
    type?: string;
    description?: string;
}

interface AssistantSelectorProps {
    availableAssistants: Assistant[];
    selectedAssistantIds: string[];
    onSelectionChange: (ids: string[]) => void;
    isLoading?: boolean;
}

const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    amber: 'bg-amber-100 text-amber-700 border-amber-200',
    violet: 'bg-violet-100 text-violet-700 border-violet-200',
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-100 text-rose-700 border-rose-200',
    cyan: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
};

export function AssistantSelector({
    availableAssistants,
    selectedAssistantIds,
    onSelectionChange,
    isLoading
}: AssistantSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredAssistants = availableAssistants.filter(a =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleToggle = (assistantId: string) => {
        if (selectedAssistantIds.includes(assistantId)) {
            onSelectionChange(selectedAssistantIds.filter(id => id !== assistantId));
        } else {
            onSelectionChange([...selectedAssistantIds, assistantId]);
        }
    };

    const handleRemove = (assistantId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onSelectionChange(selectedAssistantIds.filter(id => id !== assistantId));
    };

    const handleSetPrimary = (assistantId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const otherIds = selectedAssistantIds.filter(id => id !== assistantId);
        onSelectionChange([assistantId, ...otherIds]);
    };

    const selectedAssistants = selectedAssistantIds
        .map(id => availableAssistants.find(a => a.id === id))
        .filter(Boolean) as Assistant[];

    const updateDropdownPosition = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width,
            });
        }
    };

    useEffect(() => {
        if (isOpen) {
            updateDropdownPosition();
            window.addEventListener('scroll', updateDropdownPosition, true);
            window.addEventListener('resize', updateDropdownPosition);
        }

        return () => {
            window.removeEventListener('scroll', updateDropdownPosition, true);
            window.removeEventListener('resize', updateDropdownPosition);
        };
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (
                buttonRef.current &&
                !buttonRef.current.contains(target) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(target)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const dropdownContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden"
                    style={{
                        position: 'fixed',
                        top: dropdownPosition.top,
                        left: dropdownPosition.left,
                        width: dropdownPosition.width,
                        maxHeight: '340px',
                        zIndex: 99999,
                    }}
                >
                    <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" />
                            <Input
                                placeholder="Search assistants..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-9 pl-8 text-sm bg-gray-50 border-gray-200 focus-visible:ring-1 focus-visible:ring-indigo-500"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="overflow-y-auto" style={{ maxHeight: '260px' }}>
                        {availableAssistants.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">
                                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                <p className="font-medium">No assistants available</p>
                                <p className="text-xs mt-1">Create assistants in Core Memory first</p>
                            </div>
                        ) : filteredAssistants.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">
                                <Search className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                                <p>No matches for "{searchQuery}"</p>
                            </div>
                        ) : (
                            <div className="p-1">
                                {filteredAssistants.map((assistant) => {
                                    const isSelected = selectedAssistantIds.includes(assistant.id);
                                    const isPrimary = selectedAssistantIds[0] === assistant.id;
                                    const isGeneralMode = assistant.id === 'essential-general_mode';

                                    return (
                                        <div
                                            key={assistant.id}
                                            onClick={() => handleToggle(assistant.id)}
                                            className={cn(
                                                "flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all",
                                                isSelected
                                                    ? "bg-indigo-50 border border-indigo-200"
                                                    : "hover:bg-gray-50 border border-transparent"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0",
                                                isGeneralMode ? "bg-slate-100" : "bg-gradient-to-br from-indigo-100 to-violet-100"
                                            )}>
                                                {assistant.avatar}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-sm text-gray-900 truncate">
                                                        {assistant.name}
                                                    </span>
                                                    {assistant.type === 'essential' && (
                                                        <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-indigo-200 text-indigo-600">
                                                            Essential
                                                        </Badge>
                                                    )}
                                                    {isPrimary && isSelected && (
                                                        <Badge className="text-[9px] h-4 px-1.5 bg-indigo-600">
                                                            Primary
                                                        </Badge>
                                                    )}
                                                </div>
                                                {assistant.description && (
                                                    <p className="text-xs text-gray-500 truncate mt-0.5">
                                                        {assistant.description}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1 shrink-0">
                                                {isSelected && !isPrimary && (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <button
                                                                    onClick={(e) => handleSetPrimary(assistant.id, e)}
                                                                    className="p-1 hover:bg-indigo-100 rounded transition-colors"
                                                                >
                                                                    <GripVertical className="w-4 h-4 text-gray-400" />
                                                                </button>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="left">
                                                                <p className="text-xs">Set as Primary</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                                <div className={cn(
                                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                                    isSelected
                                                        ? "bg-indigo-600 border-indigo-600"
                                                        : "border-gray-300"
                                                )}>
                                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {selectedAssistantIds.length > 0 && (
                        <div className="p-2 border-t border-gray-100 bg-gray-50">
                            <p className="text-[10px] text-gray-500 text-center">
                                {selectedAssistantIds.length} selected • First is Primary (used for document context)
                            </p>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <div className="relative w-full">
            <Button
                ref={buttonRef}
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full justify-between h-auto min-h-[40px] py-2 px-3 bg-white hover:bg-gray-50 border-gray-200 transition-all font-normal text-gray-700"
                disabled={isLoading}
            >
                <div className="flex flex-wrap gap-1.5 items-center max-w-[calc(100%-24px)]">
                    {selectedAssistantIds.length === 0 ? (
                        <span className="text-gray-400 text-sm flex items-center gap-2">
                            <Bot className="w-4 h-4" />
                            Assign AI Assistants...
                        </span>
                    ) : (
                        selectedAssistants.map((assistant, index) => (
                            <Badge
                                key={assistant.id}
                                variant="secondary"
                                className={cn(
                                    "text-xs py-0.5 px-2 flex items-center gap-1.5 border",
                                    colorClasses[assistant.color || 'blue'] || colorClasses.blue
                                )}
                            >
                                <span className="text-sm">{assistant.avatar}</span>
                                <span className="font-medium">{assistant.name}</span>
                                {index === 0 && selectedAssistantIds.length > 1 && (
                                    <span className="text-[9px] opacity-60 ml-0.5">(Primary)</span>
                                )}
                                <span
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => handleRemove(assistant.id, e)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleRemove(assistant.id, e as any)}
                                    className="ml-0.5 hover:bg-black/10 rounded-full p-0.5 transition-colors cursor-pointer"
                                >
                                    <X className="w-3 h-3" />
                                </span>
                            </Badge>
                        ))
                    )}
                </div>
                <ChevronDown className={cn(
                    "w-4 h-4 text-gray-400 transition-transform shrink-0",
                    isOpen && "rotate-180"
                )} />
            </Button>

            {typeof window !== 'undefined' && createPortal(dropdownContent, document.body)}
        </div>
    );
}