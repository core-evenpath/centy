'use client';

import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import Link from 'next/link';
import { Trash2, Search, Filter, Loader2 } from 'lucide-react';
import { SystemTemplate } from '@/lib/types';
import { deleteSystemTemplatesBatchAction } from '@/actions/template-actions';
import { toast } from 'sonner';

interface TemplateListProps {
    initialTemplates: SystemTemplate[];
}

export function TemplateList({ initialTemplates }: TemplateListProps) {
    const [templates, setTemplates] = useState<SystemTemplate[]>(initialTemplates);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [tagFilter, setTagFilter] = useState('');

    // Derived state for filtering
    const filteredTemplates = templates.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.language.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
        const matchesTags = tagFilter === '' || (t.tags && t.tags.some(tag => tag.toLowerCase().includes(tagFilter.toLowerCase())));

        return matchesSearch && matchesCategory && matchesTags;
    });

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(filteredTemplates.map(t => t.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        const next = new Set(selectedIds);
        if (checked) {
            next.add(id);
        } else {
            next.delete(id);
        }
        setSelectedIds(next);
    };

    const handleDeleteSelected = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedIds.size} templates?`)) return;

        setIsDeleting(true);
        try {
            const idsToDelete = Array.from(selectedIds);
            const result = await deleteSystemTemplatesBatchAction(idsToDelete);

            if (result.success) {
                toast.success('Templates deleted successfully');
                // Optimistic update
                setTemplates(prev => prev.filter(t => !selectedIds.has(t.id)));
                setSelectedIds(new Set());
            } else {
                toast.error(result.error || 'Failed to delete templates');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
                <div className="flex flex-1 gap-2 w-full md:w-auto">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search name..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <select
                        className="h-10 w-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="all">All Categories</option>
                        <option value="MARKETING">Marketing</option>
                        <option value="UTILITY">Utility</option>
                        <option value="AUTHENTICATION">Authentication</option>
                    </select>

                    <div className="relative flex-1 max-w-[150px]">
                        <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Filter tags..."
                            className="pl-8"
                            value={tagFilter}
                            onChange={(e) => setTagFilter(e.target.value)}
                        />
                    </div>
                </div>

                {selectedIds.size > 0 && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                        <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDeleteSelected}
                            disabled={isDeleting}
                        >
                            {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            Delete Selected
                        </Button>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={selectedIds.size === filteredTemplates.length && filteredTemplates.length > 0}
                                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                />
                            </TableHead>
                            <TableHead>Template</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Tags</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTemplates.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No templates found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTemplates.map((template) => (
                                <TableRow key={template.id} className={selectedIds.has(template.id) ? "bg-muted/50" : ""}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedIds.has(template.id)}
                                            onCheckedChange={(checked) => handleSelectOne(template.id, !!checked)}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col max-w-[300px]">
                                            <span className="font-semibold">{template.name}</span>
                                            {template.description && (
                                                <span className="text-xs text-muted-foreground truncate" title={template.description}>
                                                    {template.description}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{template.category}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                                            {template.tags && template.tags.length > 0 ? (
                                                template.tags.slice(0, 3).map(tag => (
                                                    <Badge key={tag} variant="secondary" className="text-[10px] px-1 py-0 h-5">
                                                        {tag}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <span className="text-xs text-muted-foreground">-</span>
                                            )}
                                            {template.tags && template.tags.length > 3 && (
                                                <span className="text-[10px] text-muted-foreground">+{template.tags.length - 3}</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={template.status === 'published' ? 'default' : template.status === 'verified' ? 'secondary' : 'outline'}>
                                            {template.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/admin/templates/${template.id}`}>
                                                Edit
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
