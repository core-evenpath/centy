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
import { Trash2, Search, Filter, Loader2, CheckCircle, ArrowUpCircle } from 'lucide-react';
import { SystemTemplate } from '@/lib/types';
import { deleteSystemTemplatesBatchAction, updateSystemTemplateAction } from '@/actions/template-actions';
import { toast } from 'sonner';

interface TemplateListProps {
    initialTemplates: SystemTemplate[];
}

const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    published: 'bg-green-100 text-green-800 border-green-300',
    verified: 'bg-blue-100 text-blue-800 border-blue-300',
    archived: 'bg-gray-100 text-gray-600 border-gray-300',
};

const CAMPAIGN_TYPE_COLORS: Record<string, string> = {
    promotion: 'bg-orange-100 text-orange-800',
    seasonal: 'bg-purple-100 text-purple-800',
    retention: 'bg-green-100 text-green-800',
    transactional: 'bg-blue-100 text-blue-800',
    'lead-gen': 'bg-red-100 text-red-800',
    announcement: 'bg-indigo-100 text-indigo-800',
    daily: 'bg-slate-100 text-slate-800',
};

export function TemplateList({ initialTemplates }: TemplateListProps) {
    const [templates, setTemplates] = useState<SystemTemplate[]>(initialTemplates);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [campaignTypeFilter, setCampaignTypeFilter] = useState<string>('all');
    const [tagFilter, setTagFilter] = useState('');

    // Derived state for filtering
    const filteredTemplates = templates.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.feedMeta?.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.language.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
        const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
        const matchesCampaignType = campaignTypeFilter === 'all' || t.feedMeta?.campaignType === campaignTypeFilter;
        const matchesTags = tagFilter === '' || (t.tags && t.tags.some(tag => tag.toLowerCase().includes(tagFilter.toLowerCase())));

        return matchesSearch && matchesCategory && matchesStatus && matchesCampaignType && matchesTags;
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

    const handlePublishSelected = async () => {
        if (!confirm(`Publish ${selectedIds.size} templates?`)) return;

        setIsPublishing(true);
        try {
            const ids = Array.from(selectedIds);
            const results = await Promise.all(
                ids.map(id => updateSystemTemplateAction(id, { status: 'published' }))
            );

            const successCount = results.filter(r => r.success).length;
            if (successCount > 0) {
                toast.success(`Published ${successCount} templates`);
                setTemplates(prev => prev.map(t => selectedIds.has(t.id) ? { ...t, status: 'published' as const } : t));
                setSelectedIds(new Set());
            }
            if (successCount < ids.length) {
                toast.error(`Failed to publish ${ids.length - successCount} templates`);
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setIsPublishing(false);
        }
    };

    // Count variables by source
    const getVariableSummary = (template: SystemTemplate) => {
        if (!template.variableMap || template.variableMap.length === 0) {
            return template.variableCount > 0 ? `${template.variableCount} vars` : '—';
        }
        const auto = template.variableMap.filter(v => v.source === 'contact' || v.source === 'business').length;
        const manual = template.variableMap.filter(v => v.source === 'static' || v.source === 'module').length;
        const parts = [];
        if (auto > 0) parts.push(`${auto} auto`);
        if (manual > 0) parts.push(`${manual} manual`);
        return parts.join(', ') || '—';
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
                <div className="flex flex-1 gap-2 w-full md:w-auto flex-wrap">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search name or feed title..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <select
                        className="h-10 w-[140px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="all">All Categories</option>
                        <option value="MARKETING">Marketing</option>
                        <option value="UTILITY">Utility</option>
                        <option value="AUTHENTICATION">Authentication</option>
                    </select>

                    <select
                        className="h-10 w-[130px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="verified">Verified</option>
                        <option value="archived">Archived</option>
                    </select>

                    <select
                        className="h-10 w-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={campaignTypeFilter}
                        onChange={(e) => setCampaignTypeFilter(e.target.value)}
                    >
                        <option value="all">All Types</option>
                        <option value="promotion">Promotion</option>
                        <option value="seasonal">Seasonal</option>
                        <option value="retention">Retention</option>
                        <option value="transactional">Transactional</option>
                        <option value="lead-gen">Lead Gen</option>
                        <option value="announcement">Announcement</option>
                        <option value="daily">Daily</option>
                    </select>

                    <div className="relative max-w-[130px]">
                        <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tags..."
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
                            variant="default"
                            size="sm"
                            onClick={handlePublishSelected}
                            disabled={isPublishing}
                        >
                            {isPublishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowUpCircle className="w-4 h-4 mr-2" />}
                            Publish
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDeleteSelected}
                            disabled={isDeleting}
                        >
                            {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            Delete
                        </Button>
                    </div>
                )}
            </div>

            {/* Coverage Summary */}
            {(() => {
                const COVERAGE_TYPES = [
                    { type: 'promotion', label: 'Promotions' },
                    { type: 'seasonal', label: 'Seasonal' },
                    { type: 'retention', label: 'Retention' },
                    { type: 'transactional', label: 'Reminders' },
                    { type: 'lead-gen', label: 'Lead Gen' },
                    { type: 'announcement', label: 'Announcements' },
                ];
                return (
                    <div className="flex flex-wrap gap-2 mb-1">
                        {COVERAGE_TYPES.map(({ type, label }) => {
                            const count = templates.filter(t => t.feedMeta?.campaignType === type).length;
                            const sufficient = count >= 3;
                            return (
                                <Badge
                                    key={type}
                                    className={sufficient ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                                >
                                    {label}: {count} {sufficient ? '✓' : '⚠️'}
                                </Badge>
                            );
                        })}
                    </div>
                );
            })()}

            {/* Summary */}
            <div className="flex gap-3 text-xs text-muted-foreground">
                <span>{filteredTemplates.length} of {templates.length} templates</span>
                <span>•</span>
                <span>{templates.filter(t => t.status === 'draft').length} drafts</span>
                <span>{templates.filter(t => t.status === 'published').length} published</span>
                <span>{templates.filter(t => t.feedMeta).length} with feed meta</span>
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
                            <TableHead>Feed Title</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Variables</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTemplates.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                                        <div className="flex flex-col max-w-[200px]">
                                            <span className="font-semibold text-sm">{template.name}</span>
                                            <span className="text-[11px] text-muted-foreground truncate">{template.category}</span>
                                            {template.tags && template.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {template.tags.slice(0, 2).map(tag => (
                                                        <Badge key={tag} variant="secondary" className="text-[10px] px-1 py-0 h-4">
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                    {template.tags.length > 2 && (
                                                        <span className="text-[10px] text-muted-foreground">+{template.tags.length - 2}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="max-w-[180px]">
                                            {template.feedMeta ? (
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium truncate">{template.feedMeta.title}</span>
                                                    {template.feedMeta.signal && (
                                                        <span className="text-[11px]" style={{ color: template.feedMeta.signal.color }}>
                                                            {template.feedMeta.signal.icon} {template.feedMeta.signal.label}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">Not set</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {template.feedMeta?.campaignType ? (
                                            <Badge className={`text-[10px] ${CAMPAIGN_TYPE_COLORS[template.feedMeta.campaignType] || ''}`}>
                                                {template.feedMeta.campaignType}
                                            </Badge>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-xs">{getVariableSummary(template)}</span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`text-[10px] ${STATUS_COLORS[template.status] || ''}`}>
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
