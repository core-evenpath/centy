"use client";

import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    LayoutGrid,
    List as ListIcon,
    Sparkles,
    Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

import AssistantCard from './AssistantCard';
import AssistantConfigPanel from './AssistantConfigPanel';
import CreateAssistantModal from './CreateAssistantModal';

import { Assistant } from '@/lib/types-assistant';
import { DocumentMetadata } from '@/lib/partnerhub-types';

import {
    getAssistantsAction,
    createAssistantAction,
    createAssistantFromTemplateAction,
    updateAssistantAction,
    deleteAssistantAction,
    toggleAssistantActiveAction,
    duplicateAssistantAction,
} from '@/actions/assistant-actions';

interface AgentsViewProps {
    partnerId: string;
    documents: DocumentMetadata[];
}

export default function AgentsView({ partnerId, documents }: AgentsViewProps) {
    const [assistants, setAssistants] = useState<Assistant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'essential' | 'custom'>('all');

    // UI State
    const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        loadAssistants();
    }, [partnerId]);

    const loadAssistants = async () => {
        setIsLoading(true);
        try {
            const result = await getAssistantsAction(partnerId);
            if (result.success && result.assistants) {
                setAssistants(result.assistants);
            } else {
                toast.error('Failed to load assistants');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error loading assistants');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateCustom = async (data: Partial<Assistant>) => {
        setIsCreating(true);
        try {
            const result = await createAssistantAction(partnerId, data as any, 'user'); // TODO: get real user ID
            if (result.success) {
                toast.success('Assistant created successfully');
                setIsCreateModalOpen(false);
                loadAssistants();
            } else {
                toast.error(result.error || 'Failed to create assistant');
            }
        } catch (error) {
            toast.error('Error creating assistant');
        } finally {
            setIsCreating(false);
        }
    };

    const handleCreateFromTemplate = async (templateId: string) => {
        setIsCreating(true);
        try {
            const result = await createAssistantFromTemplateAction(partnerId, templateId, 'user');
            if (result.success) {
                toast.success('Assistant created from template');
                setIsCreateModalOpen(false);
                loadAssistants();
            } else {
                toast.error(result.error || 'Failed to create assistant');
            }
        } catch (error) {
            toast.error('Error creating assistant');
        } finally {
            setIsCreating(false);
        }
    };

    const handleUpdate = async (updates: Partial<Assistant>) => {
        if (!selectedAssistant) return;

        try {
            const result = await updateAssistantAction(partnerId, selectedAssistant.id, updates);
            if (result.success) {
                // Update local state immediately for responsiveness
                setAssistants(prev => prev.map(a =>
                    a.id === selectedAssistant.id ? { ...a, ...updates } : a
                ));
                setSelectedAssistant(prev => prev ? { ...prev, ...updates } : null);
            } else {
                toast.error(result.error || 'Failed to update assistant');
            }
        } catch (error) {
            toast.error('Error updating assistant');
        }
    };

    const handleDelete = async (assistantId: string) => {
        try {
            const result = await deleteAssistantAction(partnerId, assistantId);
            if (result.success) {
                toast.success('Assistant deleted');
                setAssistants(prev => prev.filter(a => a.id !== assistantId));
                if (selectedAssistant?.id === assistantId) {
                    setSelectedAssistant(null);
                }
            } else {
                toast.error(result.error || 'Failed to delete assistant');
            }
        } catch (error) {
            toast.error('Error deleting assistant');
        }
    };

    const handleDuplicate = async (assistantId: string) => {
        try {
            const result = await duplicateAssistantAction(partnerId, assistantId, 'user');
            if (result.success) {
                toast.success('Assistant duplicated');
                loadAssistants();
            } else {
                toast.error(result.error || 'Failed to duplicate');
            }
        } catch (error) {
            toast.error('Error duplicating assistant');
        }
    };

    const handleToggleActive = async (assistant: Assistant, isActive: boolean) => {
        try {
            // Optimistic update
            setAssistants(prev => prev.map(a =>
                a.id === assistant.id ? { ...a, isActive } : a
            ));

            const result = await toggleAssistantActiveAction(partnerId, assistant.id, isActive);
            if (!result.success) {
                // Revert on failure
                toast.error('Failed to update status');
                setAssistants(prev => prev.map(a =>
                    a.id === assistant.id ? { ...a, isActive: !isActive } : a
                ));
            }
        } catch (error) {
            toast.error('Error updating status');
            loadAssistants(); // Reload to ensure sync
        }
    };

    const filteredAssistants = assistants.filter(a => {
        const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterType === 'all' || a.type === filterType;
        return matchesSearch && matchesFilter;
    });

    const essentialAssistants = filteredAssistants.filter(a => a.type === 'essential');
    const customAssistants = filteredAssistants.filter(a => a.type === 'custom');

    return (
        <div className="h-full flex flex-col bg-gray-50/50">
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-2">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">AI Assistants</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage and configure your custom AI workforce</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 shadow-sm bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4" />
                    New Assistant
                </Button>
            </div>

            {/* Toolbar */}
            <div className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search assistants..."
                        className="pl-9 bg-white"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2 bg-white">
                                <Filter className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-700">Filter: {filterType === 'all' ? 'All' : filterType === 'essential' ? 'Essential' : 'Custom'}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setFilterType('all')}>
                                All Assistants
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem checked={filterType === 'essential'} onCheckedChange={() => setFilterType('essential')}>
                                Essential
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={filterType === 'custom'} onCheckedChange={() => setFilterType('custom')}>
                                Custom
                            </DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 flex">
                <ScrollArea className="flex-1">
                    <div className="p-6 pt-2 space-y-8 pb-20">
                        {essentialAssistants.length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles className="w-4 h-4 text-indigo-600" />
                                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Essential Assistants</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {essentialAssistants.map(assistant => (
                                        <AssistantCard
                                            key={assistant.id}
                                            assistant={assistant}
                                            documentCount={documents.length}
                                            onConfigure={() => setSelectedAssistant(assistant)}
                                            onToggleActive={(isActive) => handleToggleActive(assistant, isActive)}
                                            onDuplicate={() => handleDuplicate(assistant.id)}
                                            onDelete={() => handleDelete(assistant.id)}
                                            onTest={() => {
                                                // TODO: Implement test logic, maybe open a right panel or modal
                                                toast.info("Opening test chat...");
                                                setSelectedAssistant(assistant); // Open config panel as well for context
                                            }}
                                            isLoading={isLoading}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {customAssistants.length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Custom Assistants</h2>
                                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{customAssistants.length}</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {customAssistants.map(assistant => (
                                        <AssistantCard
                                            key={assistant.id}
                                            assistant={assistant}
                                            documentCount={documents.length}
                                            onConfigure={() => setSelectedAssistant(assistant)}
                                            onToggleActive={(isActive) => handleToggleActive(assistant, isActive)}
                                            onDuplicate={() => handleDuplicate(assistant.id)}
                                            onDelete={() => handleDelete(assistant.id)}
                                            onTest={() => {
                                                // TODO: Implement test logic
                                                toast.info("Opening test chat...");
                                                setSelectedAssistant(assistant);
                                            }}
                                            isLoading={isLoading}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {filteredAssistants.length === 0 && !isLoading && (
                            <div className="text-center py-20">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">No assistants found</h3>
                                <p className="text-gray-500 mt-2">Try adjusting your search or create a new assistant.</p>
                                <Button onClick={() => setIsCreateModalOpen(true)} variant="outline" className="mt-4">
                                    Create New Assistant
                                </Button>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Config Panel (Right Sidebar) */}
                {selectedAssistant && (
                    <div className="border-l border-gray-200 h-full relative z-20">
                        <AssistantConfigPanel
                            assistant={selectedAssistant}
                            documents={documents}
                            onSave={handleUpdate}
                            onClose={() => setSelectedAssistant(null)}
                            onTest={(assistant) => {
                                // This could launch a separate test modal or mode
                                console.log("Testing:", assistant);
                                toast.info(`Starting test chat with ${assistant.name}`);
                            }}
                        />
                    </div>
                )}
            </div>

            <CreateAssistantModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
                documents={documents}
                onCreateFromTemplate={handleCreateFromTemplate}
                onCreateCustom={handleCreateCustom}
                isCreating={isCreating}
            />
        </div>
    );
}