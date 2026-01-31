'use client';

import { useState } from 'react';
import { ModuleAssignment, SystemModule } from '@/lib/modules/types';
import { updateModuleAssignmentAction } from '@/actions/modules-actions';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Plus, X, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'sonner';

interface AssignmentManagerProps {
    assignment: ModuleAssignment;
    availableModules: SystemModule[];
    userId: string;
}

export function AssignmentManager({ assignment, availableModules, userId }: AssignmentManagerProps) {
    const [currentAssignment, setCurrentAssignment] = useState(assignment);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedModuleSlug, setSelectedModuleSlug] = useState<string>('');

    const handleAddModule = () => {
        if (!selectedModuleSlug) return;

        if (currentAssignment.modules.some(m => m.moduleSlug === selectedModuleSlug)) {
            toast.error('Module already assigned');
            return;
        }

        const newModules = [
            ...currentAssignment.modules,
            {
                moduleSlug: selectedModuleSlug,
                isRequired: false,
                isDefault: false,
                order: currentAssignment.modules.length + 1,
            }
        ];

        setCurrentAssignment({ ...currentAssignment, modules: newModules });
        setSelectedModuleSlug('');
    };

    const removeModule = (slug: string) => {
        setCurrentAssignment({
            ...currentAssignment,
            modules: currentAssignment.modules.filter(m => m.moduleSlug !== slug)
        });
    };

    const toggleAttribute = (slug: string, attribute: 'isRequired' | 'isDefault') => {
        setCurrentAssignment({
            ...currentAssignment,
            modules: currentAssignment.modules.map(m =>
                m.moduleSlug === slug ? { ...m, [attribute]: !m[attribute] } : m
            )
        });
    };

    const handleDragEnd = (result: any) => {
        if (!result.destination) return;

        const items = Array.from(currentAssignment.modules);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        const updatedItems = items.map((item, index) => ({
            ...item,
            order: index + 1
        }));

        setCurrentAssignment({ ...currentAssignment, modules: updatedItems });
    };

    const handleSave = async () => {
        setIsSaving(true);
        const result = await updateModuleAssignmentAction(
            currentAssignment.industryId,
            currentAssignment.functionId,
            currentAssignment.modules,
            currentAssignment.industryName,
            currentAssignment.functionName,
            userId
        );

        if (result.success) {
            toast.success('Assignment updated successfully');
        } else {
            toast.error(result.error || 'Failed to update assignment');
        }
        setIsSaving(false);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{assignment.industryName} - {assignment.functionName}</CardTitle>
                <CardDescription>Manage which modules are available for this business type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex gap-4 items-end">
                    <div className="flex-1 space-y-2">
                        <Label>Add Module</Label>
                        <Select value={selectedModuleSlug} onValueChange={setSelectedModuleSlug}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a module to add..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availableModules.map(module => (
                                    <SelectItem key={module.id} value={module.slug}>
                                        {module.icon} {module.name} ({module.slug})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleAddModule} disabled={!selectedModuleSlug}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add
                    </Button>
                </div>

                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="assignments">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="rounded-md border divide-y">
                                {currentAssignment.modules.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground">
                                        No modules assigned yet.
                                    </div>
                                ) : (
                                    currentAssignment.modules.map((item, index) => {
                                        const moduleInfo = availableModules.find(m => m.slug === item.moduleSlug);
                                        return (
                                            <Draggable key={item.moduleSlug} draggableId={item.moduleSlug} index={index}>
                                                {(provided) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        className="bg-white"
                                                    >
                                                        <div className="flex items-center gap-4 p-4">
                                                            <div {...provided.dragHandleProps} className="text-muted-foreground cursor-grab">
                                                                <GripVertical className="h-5 w-5" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xl">{moduleInfo?.icon || '📦'}</span>
                                                                    <span className="font-medium">{moduleInfo?.name || item.moduleSlug}</span>
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">{item.moduleSlug}</div>
                                                            </div>

                                                            <div className="flex items-center gap-6">
                                                                <div className="flex items-center space-x-2">
                                                                    <Checkbox
                                                                        id={`required-${item.moduleSlug}`}
                                                                        checked={item.isRequired}
                                                                        onCheckedChange={() => toggleAttribute(item.moduleSlug, 'isRequired')}
                                                                    />
                                                                    <label htmlFor={`required-${item.moduleSlug}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                                        Required
                                                                    </label>
                                                                </div>

                                                                <div className="flex items-center space-x-2">
                                                                    <Checkbox
                                                                        id={`default-${item.moduleSlug}`}
                                                                        checked={item.isDefault}
                                                                        onCheckedChange={() => toggleAttribute(item.moduleSlug, 'isDefault')}
                                                                    />
                                                                    <label htmlFor={`default-${item.moduleSlug}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                                        Default Enabled
                                                                    </label>
                                                                </div>
                                                            </div>

                                                            <Button variant="ghost" size="icon" onClick={() => removeModule(item.moduleSlug)} className="text-destructive hover:bg-destructive/10">
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        );
                                    })
                                )}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </CardContent>
            <CardFooter className="justify-between border-t p-4 bg-muted/20">
                <div className="text-sm text-muted-foreground">
                    {currentAssignment.modules.length} modules assigned
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Assignments'}
                </Button>
            </CardFooter>
        </Card>
    );
}
