'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { ModuleSchema, ModuleFieldDefinition, ModuleCategoryDefinition, ModuleGenerationResult } from '@/lib/modules/types';
import { generateFieldId, generateCategoryId } from '@/lib/modules/utils';
import { FieldEditor } from './FieldEditor';
import { CategoryManager } from './CategoryManager';
import { RegenerationDialog } from './RegenerationDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { GripVertical, Edit, Trash2, Plus, Wand2, Info } from 'lucide-react';
import { FIELD_TYPE_LABELS } from '@/lib/modules/constants';
import { toast } from 'sonner';

interface SchemaBuilderProps {
    initialSchema: ModuleSchema;
    onSave: (schema: ModuleSchema) => void;
    isSaving?: boolean;
    moduleSlug?: string;
}

export function SchemaBuilder({ initialSchema, onSave, isSaving, moduleSlug }: SchemaBuilderProps) {
    const [schema, setSchema] = useState<ModuleSchema>(initialSchema);
    const [editingField, setEditingField] = useState<ModuleFieldDefinition | undefined>(undefined);
    const [isFieldEditorOpen, setIsFieldEditorOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('fields');
    const [searchQuery, setSearchQuery] = useState('');

    const handleFieldSave = (field: ModuleFieldDefinition) => {
        const newFields = editingField
            ? schema.fields.map(f => f.id === field.id ? field : f)
            : [...schema.fields, { ...field, order: schema.fields.length + 1 }];

        setSchema({ ...schema, fields: newFields });
        toast.success(editingField ? 'Field updated' : 'Field added');
    };

    const deleteField = (id: string) => {
        setSchema({
            ...schema,
            fields: schema.fields.filter(f => f.id !== id)
        });
        toast.success('Field deleted');
    };

    const handleDragEnd = (result: any) => {
        if (!result.destination) return;

        const items = Array.from(schema.fields);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Update order property
        const updatedItems = items.map((item, index) => ({
            ...item,
            order: index + 1
        }));

        setSchema({ ...schema, fields: updatedItems });
    };

    const handleCategoriesChange = (categories: ModuleCategoryDefinition[]) => {
        setSchema({ ...schema, categories });
    };

    const handleRegenerationApply = (result: ModuleGenerationResult) => {
        if (result.schema) {
            setSchema(result.schema);
            toast.success('AI Schema applied successfully');
        }
    };

    const filteredFields = schema.fields.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Schema Builder</h2>
                    <p className="text-muted-foreground">Define the structure of data for this module</p>
                </div>
                <div className="flex items-center gap-2">
                    <RegenerationDialog
                        currentSchema={schema}
                        onApply={handleRegenerationApply}
                        moduleSlug={moduleSlug}
                    />
                    <Button onClick={() => onSave(schema)} disabled={isSaving}>
                        {isSaving && <Wand2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Schema
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="fields">Fields ({schema.fields.length})</TabsTrigger>
                    <TabsTrigger value="categories">Categories ({schema.categories.length})</TabsTrigger>
                    <TabsTrigger value="preview">Preview JSON</TabsTrigger>
                </TabsList>

                <TabsContent value="fields" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Input
                            placeholder="Filter fields..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="max-w-xs"
                        />
                        <Button onClick={() => { setEditingField(undefined); setIsFieldEditorOpen(true); }}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Field
                        </Button>
                    </div>

                    <Card>
                        <CardHeader className="bg-muted/40 py-3">
                            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
                                <div className="col-span-1"></div>
                                <div className="col-span-3">Name / ID</div>
                                <div className="col-span-2">Type</div>
                                <div className="col-span-4">Settings</div>
                                <div className="col-span-2 text-right">Actions</div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DragDropContext onDragEnd={handleDragEnd}>
                                <Droppable droppableId="fields">
                                    {(provided) => (
                                        <div {...provided.droppableProps} ref={provided.innerRef} className="divide-y">
                                            {filteredFields.length === 0 ? (
                                                <div className="py-8 text-center text-muted-foreground">
                                                    No fields found. Create one or use AI generation.
                                                </div>
                                            ) : (
                                                filteredFields.map((field, index) => (
                                                    <Draggable key={field.id} draggableId={field.id} index={index}>
                                                        {(provided) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                className="grid grid-cols-12 gap-4 p-4 items-center bg-white hover:bg-muted/10 transition-colors"
                                                            >
                                                                <div className="col-span-1 flex justify-center">
                                                                    <div {...provided.dragHandleProps} className="cursor-grab text-muted-foreground hover:text-foreground">
                                                                        <GripVertical className="h-5 w-5" />
                                                                    </div>
                                                                </div>
                                                                <div className="col-span-3">
                                                                    <div className="font-medium">{field.name}</div>
                                                                    <div className="text-xs text-muted-foreground font-mono">{field.id}</div>
                                                                </div>
                                                                <div className="col-span-2">
                                                                    <Badge variant="outline">{FIELD_TYPE_LABELS[field.type]}</Badge>
                                                                </div>
                                                                <div className="col-span-4 flex gap-2 flex-wrap">
                                                                    {field.isRequired && <Badge variant="secondary" className="text-xs">Required</Badge>}
                                                                    {field.isSearchable && <Badge variant="secondary" className="text-xs">Searchable</Badge>}
                                                                    {field.showInList && <Badge variant="secondary" className="text-xs">In List</Badge>}
                                                                </div>
                                                                <div className="col-span-2 flex justify-end gap-1">
                                                                    <Button variant="ghost" size="icon" onClick={() => { setEditingField(field); setIsFieldEditorOpen(true); }}>
                                                                        <Edit className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => deleteField(field.id)}>
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))
                                            )}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="categories" className="space-y-4">
                    <CategoryManager categories={schema.categories} onChange={handleCategoriesChange} />
                </TabsContent>

                <TabsContent value="preview">
                    <Card>
                        <CardHeader>
                            <CardTitle>Schema JSON</CardTitle>
                            <CardDescription>ReadOnly view of the underlying schema data structure</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-auto max-h-[600px] text-xs">
                                {JSON.stringify(schema, null, 2)}
                            </pre>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <FieldEditor
                open={isFieldEditorOpen}
                onOpenChange={setIsFieldEditorOpen}
                field={editingField}
                onSave={handleFieldSave}
            />
        </div>
    );
}
