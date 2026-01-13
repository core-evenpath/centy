'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
    Package, Plus, Edit3, Trash2, Check, X, Search, Filter,
    ChevronDown, ChevronRight, Grid3X3, List, Sparkles, Loader2,
    MoreHorizontal, Copy, Eye, EyeOff, GripVertical, Save,
    AlertCircle, CheckCircle, Image as ImageIcon, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    InventoryConfig,
    InventoryItem,
    InventoryFieldDefinition,
    InventoryCategoryDefinition,
    createInventoryItem,
    generateItemId
} from '@/lib/inventory-types';

interface InventoryManagerProps {
    config: InventoryConfig;
    onConfigChange: (config: InventoryConfig) => void;
    onGenerateMore?: () => Promise<void>;
    isGenerating?: boolean;
}

// ===== FIELD INPUT COMPONENT =====
function FieldInput({
    field,
    value,
    onChange,
}: {
    field: InventoryFieldDefinition;
    value: any;
    onChange: (value: any) => void;
}) {
    switch (field.type) {
        case 'text':
            return (
                <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
            );
        case 'number':
            return (
                <input
                    type="number"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
                    placeholder={field.placeholder}
                    min={field.validation?.min}
                    max={field.validation?.max}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
            );
        case 'textarea':
            return (
                <textarea
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
            );
        case 'select':
            return (
                <select
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                >
                    <option value="">Select...</option>
                    {field.options?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            );
        case 'toggle':
            return (
                <button
                    type="button"
                    onClick={() => onChange(!value)}
                    className={cn(
                        "relative w-12 h-6 rounded-full transition-colors",
                        value ? "bg-indigo-600" : "bg-slate-200"
                    )}
                >
                    <span className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow",
                        value ? "left-7" : "left-1"
                    )} />
                </button>
            );
        case 'tags':
            const tags = Array.isArray(value) ? value : [];
            const [newTag, setNewTag] = useState('');
            return (
                <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                        {tags.map((tag, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs">
                                {tag}
                                <button onClick={() => onChange(tags.filter((_, j) => j !== i))} className="hover:text-indigo-900">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                    <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && newTag.trim()) {
                                e.preventDefault();
                                onChange([...tags, newTag.trim()]);
                                setNewTag('');
                            }
                        }}
                        placeholder="Type and press Enter..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            );
        default:
            return (
                <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
            );
    }
}

// ===== ITEM FORM MODAL =====
function ItemFormModal({
    item,
    fields,
    categories,
    itemLabel,
    priceLabel,
    onSave,
    onClose,
}: {
    item: Partial<InventoryItem> | null;
    fields: InventoryFieldDefinition[];
    categories: InventoryCategoryDefinition[];
    itemLabel: string;
    priceLabel: string;
    onSave: (item: InventoryItem) => void;
    onClose: () => void;
}) {
    const isNew = !item?.id;
    const [formData, setFormData] = useState<Partial<InventoryItem>>({
        name: '',
        description: '',
        category: categories[0]?.id || '',
        price: 0,
        isActive: true,
        fields: {},
        ...item,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate
        const newErrors: Record<string, string> = {};
        if (!formData.name?.trim()) newErrors.name = 'Name is required';
        if (formData.price === undefined || formData.price < 0) newErrors.price = `${priceLabel} is required`;

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const now = new Date().toISOString();
        const savedItem: InventoryItem = {
            id: formData.id || generateItemId(),
            name: formData.name!,
            description: formData.description,
            category: formData.category || categories[0]?.id || '',
            price: formData.price || 0,
            currency: 'INR',
            fields: formData.fields || {},
            isActive: formData.isActive !== false,
            sortOrder: formData.sortOrder || 0,
            createdAt: formData.createdAt || now,
            updatedAt: now,
            source: formData.source || 'manual',
        };

        onSave(savedItem);
    };

    const updateField = (key: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            fields: { ...prev.fields, [key]: value }
        }));
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">
                        {isNew ? `Add ${itemLabel}` : `Edit ${itemLabel}`}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Name */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className={cn(
                                    "w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500",
                                    errors.name ? "border-red-300" : "border-slate-200"
                                )}
                                placeholder={`Enter ${itemLabel.toLowerCase()} name`}
                            />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                            <select
                                value={formData.category || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            >
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Price */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                {priceLabel} (₹) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                value={formData.price || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                                className={cn(
                                    "w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500",
                                    errors.price ? "border-red-300" : "border-slate-200"
                                )}
                                placeholder="0"
                                min={0}
                            />
                            {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                        </div>

                        {/* Description */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea
                                value={formData.description || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                rows={2}
                                placeholder="Optional description..."
                            />
                        </div>

                        {/* Dynamic Fields */}
                        {fields.filter(f => !['name', 'description', 'price'].includes(f.id)).map(field => (
                            <div key={field.id} className={field.type === 'textarea' || field.type === 'tags' ? 'md:col-span-2' : ''}>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {field.name}
                                    {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                <FieldInput
                                    field={field}
                                    value={formData.fields?.[field.id]}
                                    onChange={(value) => updateField(field.id, value)}
                                />
                            </div>
                        ))}

                        {/* Active Toggle */}
                        <div className="md:col-span-2 flex items-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                                className={cn(
                                    "relative w-12 h-6 rounded-full transition-colors",
                                    formData.isActive ? "bg-green-500" : "bg-slate-200"
                                )}
                            >
                                <span className={cn(
                                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow",
                                    formData.isActive ? "left-7" : "left-1"
                                )} />
                            </button>
                            <span className="text-sm text-slate-600">
                                {formData.isActive ? 'Active' : 'Inactive'} (visible to customers)
                            </span>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="p-5 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {isNew ? `Add ${itemLabel}` : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ===== ITEM CARD =====
function ItemCard({
    item,
    priceLabel,
    onEdit,
    onDelete,
    onToggleActive,
}: {
    item: InventoryItem;
    priceLabel: string;
    onEdit: () => void;
    onDelete: () => void;
    onToggleActive: () => void;
}) {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div className={cn(
            "group relative bg-white rounded-xl border p-4 hover:shadow-md transition-all",
            item.isActive ? "border-slate-200" : "border-slate-100 opacity-60"
        )}>
            <div className="flex items-start gap-3">
                {/* Image placeholder */}
                <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                        <Package className="w-6 h-6 text-slate-300" />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                        <div>
                            <h4 className="font-semibold text-slate-900 truncate">{item.name}</h4>
                            <p className="text-xs text-slate-500">{item.category}</p>
                        </div>
                        <div className="text-right">
                            <div className="font-bold text-emerald-600">₹{item.price?.toLocaleString()}</div>
                            {!item.isActive && (
                                <span className="text-xs text-slate-400">Inactive</span>
                            )}
                        </div>
                    </div>
                    {item.description && (
                        <p className="text-sm text-slate-500 mt-1 line-clamp-1">{item.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                        <span className={cn(
                            "text-xs px-2 py-0.5 rounded",
                            item.source === 'autofill' ? "bg-blue-100 text-blue-700" :
                                item.source === 'ai_generated' ? "bg-purple-100 text-purple-700" :
                                    "bg-slate-100 text-slate-600"
                        )}>
                            {item.source === 'autofill' ? 'Imported' :
                                item.source === 'ai_generated' ? 'AI Generated' : 'Manual'}
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 hover:bg-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <MoreHorizontal className="w-4 h-4 text-slate-500" />
                    </button>
                    {showMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                            <div className="absolute right-0 top-10 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 min-w-[140px]">
                                <button
                                    onClick={() => { onEdit(); setShowMenu(false); }}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                                >
                                    <Edit3 className="w-4 h-4" /> Edit
                                </button>
                                <button
                                    onClick={() => { onToggleActive(); setShowMenu(false); }}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                                >
                                    {item.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    {item.isActive ? 'Hide' : 'Show'}
                                </button>
                                <button
                                    onClick={() => { onDelete(); setShowMenu(false); }}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" /> Delete
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// ===== MAIN COMPONENT =====
export default function InventoryManager({
    config,
    onConfigChange,
    onGenerateMore,
    isGenerating,
}: InventoryManagerProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [showInactive, setShowInactive] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // Filter items
    const filteredItems = useMemo(() => {
        return config.items.filter(item => {
            if (!showInactive && !item.isActive) return false;
            if (selectedCategory && item.category !== selectedCategory) return false;
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return item.name.toLowerCase().includes(query) ||
                    item.description?.toLowerCase().includes(query);
            }
            return true;
        });
    }, [config.items, searchQuery, selectedCategory, showInactive]);

    // Group by category for display
    const groupedItems = useMemo(() => {
        const groups: Record<string, InventoryItem[]> = {};
        filteredItems.forEach(item => {
            const cat = item.category || 'uncategorized';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(item);
        });
        return groups;
    }, [filteredItems]);

    // Category counts
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = { all: config.items.filter(i => showInactive || i.isActive).length };
        config.categories.forEach(cat => {
            counts[cat.id] = config.items.filter(i => i.category === cat.id && (showInactive || i.isActive)).length;
        });
        return counts;
    }, [config.items, config.categories, showInactive]);

    // Handlers
    const handleSaveItem = useCallback((item: InventoryItem) => {
        const existingIndex = config.items.findIndex(i => i.id === item.id);
        let newItems: InventoryItem[];

        if (existingIndex >= 0) {
            // Update existing
            newItems = [...config.items];
            newItems[existingIndex] = item;
        } else {
            // Add new
            newItems = [...config.items, item];
        }

        onConfigChange({
            ...config,
            items: newItems,
            lastModifiedAt: new Date().toISOString(),
        });
        setEditingItem(null);
        setIsAddingNew(false);
    }, [config, onConfigChange]);

    const handleDeleteItem = useCallback((itemId: string) => {
        onConfigChange({
            ...config,
            items: config.items.filter(i => i.id !== itemId),
            lastModifiedAt: new Date().toISOString(),
        });
        setDeleteConfirm(null);
    }, [config, onConfigChange]);

    const handleToggleActive = useCallback((itemId: string) => {
        const newItems = config.items.map(item =>
            item.id === itemId ? { ...item, isActive: !item.isActive, updatedAt: new Date().toISOString() } : item
        );
        onConfigChange({ ...config, items: newItems });
    }, [config, onConfigChange]);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">{config.itemLabelPlural}</h2>
                        <p className="text-sm text-slate-500">
                            {categoryCounts.all} {config.itemLabelPlural.toLowerCase()} •
                            {config.source === 'autofill' ? ' Imported from Google' :
                                config.source === 'ai_generated' ? ' AI Generated' : ' Manual entry'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {onGenerateMore && (
                            <button
                                onClick={onGenerateMore}
                                disabled={isGenerating}
                                className="px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-2 disabled:opacity-50"
                            >
                                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-purple-500" />}
                                Generate More
                            </button>
                        )}
                        <button
                            onClick={() => setIsAddingNew(true)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Add {config.itemLabel}
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 mt-4">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={`Search ${config.itemLabelPlural.toLowerCase()}...`}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Category Filter */}
                    <select
                        value={selectedCategory || ''}
                        onChange={(e) => setSelectedCategory(e.target.value || null)}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">All Categories ({categoryCounts.all})</option>
                        {config.categories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name} ({categoryCounts[cat.id] || 0})
                            </option>
                        ))}
                    </select>

                    {/* Show Inactive Toggle */}
                    <button
                        onClick={() => setShowInactive(!showInactive)}
                        className={cn(
                            "px-3 py-2 border rounded-lg text-sm flex items-center gap-2",
                            showInactive ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600"
                        )}
                    >
                        {showInactive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        {showInactive ? 'Showing All' : 'Active Only'}
                    </button>

                    {/* View Mode */}
                    <div className="flex border border-slate-200 rounded-lg overflow-hidden">
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn("p-2", viewMode === 'list' ? "bg-slate-100" : "hover:bg-slate-50")}
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn("p-2", viewMode === 'grid' ? "bg-slate-100" : "hover:bg-slate-50")}
                        >
                            <Grid3X3 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Items List */}
            {filteredItems.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Package className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        {searchQuery || selectedCategory ? 'No matching items' : `No ${config.itemLabelPlural.toLowerCase()} yet`}
                    </h3>
                    <p className="text-slate-500 text-sm mb-4">
                        {searchQuery || selectedCategory
                            ? 'Try adjusting your filters'
                            : `Add your first ${config.itemLabel.toLowerCase()} to get started`
                        }
                    </p>
                    {!searchQuery && !selectedCategory && (
                        <button
                            onClick={() => setIsAddingNew(true)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 inline-flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Add {config.itemLabel}
                        </button>
                    )}
                </div>
            ) : (
                <div className={cn(
                    viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"
                )}>
                    {filteredItems.map(item => (
                        <ItemCard
                            key={item.id}
                            item={item}
                            priceLabel={config.priceLabel}
                            onEdit={() => setEditingItem(item)}
                            onDelete={() => setDeleteConfirm(item.id)}
                            onToggleActive={() => handleToggleActive(item.id)}
                        />
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {(isAddingNew || editingItem) && (
                <ItemFormModal
                    item={editingItem}
                    fields={config.fields}
                    categories={config.categories}
                    itemLabel={config.itemLabel}
                    priceLabel={config.priceLabel}
                    onSave={handleSaveItem}
                    onClose={() => { setEditingItem(null); setIsAddingNew(false); }}
                />
            )}

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900">Delete {config.itemLabel}?</h3>
                        </div>
                        <p className="text-slate-600 text-sm mb-6">
                            This action cannot be undone. The {config.itemLabel.toLowerCase()} will be permanently removed.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteItem(deleteConfirm)}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
