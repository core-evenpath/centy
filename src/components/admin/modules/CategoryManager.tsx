'use client';

import { useState } from 'react';
import { ModuleCategoryDefinition } from '@/lib/modules/types';
import { generateCategoryId } from '@/lib/modules/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Edit } from 'lucide-react';

interface CategoryManagerProps {
    categories: ModuleCategoryDefinition[];
    onChange: (categories: ModuleCategoryDefinition[]) => void;
}

const COLORS = ['slate', 'red', 'orange', 'amber', 'green', 'emerald', 'teal', 'cyan', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'];

export function CategoryManager({ categories, onChange }: CategoryManagerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ModuleCategoryDefinition | null>(null);

    const [formData, setFormData] = useState<Partial<ModuleCategoryDefinition>>({
        name: '',
        icon: '',
        description: '',
        color: 'slate',
    });

    const handleOpen = (category?: ModuleCategoryDefinition) => {
        if (category) {
            setEditingCategory(category);
            setFormData(category);
        } else {
            setEditingCategory(null);
            setFormData({ name: '', icon: '', description: '', color: 'slate' });
        }
        setIsOpen(true);
    };

    const handleSave = () => {
        if (!formData.name) return;

        if (editingCategory) {
            onChange(categories.map(c => c.id === editingCategory.id ? { ...c, ...formData } as ModuleCategoryDefinition : c));
        } else {
            onChange([
                ...categories,
                {
                    id: generateCategoryId(),
                    order: categories.length + 1,
                    ...formData,
                } as ModuleCategoryDefinition
            ]);
        }
        setIsOpen(false);
    };

    const handleDelete = (id: string) => {
        onChange(categories.filter(c => c.id !== id));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Categories</h3>
                <Button onClick={() => handleOpen()} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Category
                </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                    <Card key={category.id} className="relative group overflow-hidden">
                        <div className={`absolute top-0 left-0 w-1 h-full bg-${category.color}-500`} />
                        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                            <div className="flex items-center space-x-2">
                                <span className="text-xl">{category.icon || '📁'}</span>
                                <span className="font-semibold">{category.name}</span>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpen(category)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(category.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
                            {category.description || 'No description'}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? 'Edit Category' : 'New Category'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input id="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="icon" className="text-right">Icon</Label>
                            <Input id="icon" value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })} className="col-span-3 w-20" placeholder="📁" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">Description</Label>
                            <Input id="description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="color" className="text-right">Color</Label>
                            <Select value={formData.color} onValueChange={color => setFormData({ ...formData, color })}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {COLORS.map(color => (
                                        <SelectItem key={color} value={color}>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full bg-${color}-500`} />
                                                <span className="capitalize">{color}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
