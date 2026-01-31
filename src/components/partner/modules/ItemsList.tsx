'use client';

import { useState } from 'react';
import { ModuleItem, PartnerModule, ModuleSchema } from '@/lib/modules/types';
import { ItemCard } from './ItemCard';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface ItemsListProps {
    items: ModuleItem[];
    module: PartnerModule;
    schema: ModuleSchema;
    onEdit: (item: ModuleItem) => void;
    onToggleStatus: (item: ModuleItem) => void;
    onReorder: (items: ModuleItem[]) => void;
}

export function ItemsList({ items, module, schema, onEdit, onToggleStatus, onReorder }: ItemsListProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [sortBy, setSortBy] = useState<'order' | 'name' | 'price' | 'newest'>('order');

    // Filter and Sort
    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && item.isActive) ||
            (statusFilter === 'inactive' && !item.isActive);
        return matchesSearch && matchesStatus;
    });

    const sortedItems = [...filteredItems].sort((a, b) => {
        switch (sortBy) {
            case 'name': return a.name.localeCompare(b.name);
            case 'price': return (a.price || 0) - (b.price || 0);
            case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            case 'order': default: return a.sortOrder - b.sortOrder;
        }
    });

    const handleDragEnd = (result: any) => {
        if (!result.destination || sortBy !== 'order' || searchQuery || statusFilter !== 'all') return;

        // Only allow reordering when viewing all items in default order
        const newItems = Array.from(items);
        const [reorderedItem] = newItems.splice(result.source.index, 1);
        newItems.splice(result.destination.index, 0, reorderedItem);

        // Optimistic update order
        const updatedItems = newItems.map((item, index) => ({
            ...item,
            sortOrder: index
        }));

        onReorder(updatedItems);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg border shadow-sm">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2 w-full sm:w-auto">
                                <SlidersHorizontal className="h-4 w-4" />
                                Filter
                                {statusFilter !== 'all' && <Badge variant="secondary" className="ml-1 px-1 h-5">{statusFilter}</Badge>}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem checked={statusFilter === 'all'} onCheckedChange={() => setStatusFilter('all')}>
                                All Items
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={statusFilter === 'active'} onCheckedChange={() => setStatusFilter('active')}>
                                Active only
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={statusFilter === 'inactive'} onCheckedChange={() => setStatusFilter('inactive')}>
                                Inactive only
                            </DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2 w-full sm:w-auto">
                                <ArrowUpDown className="h-4 w-4" />
                                Sort
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => setSortBy('order')}>
                                Custom Order {sortBy === 'order' && <Badge variant="secondary" className="ml-auto">Default</Badge>}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortBy('name')}>
                                Name (A-Z) {sortBy === 'name' && <Badge variant="secondary" className="ml-auto">Active</Badge>}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortBy('price')}>
                                Price (Low-High) {sortBy === 'price' && <Badge variant="secondary" className="ml-auto">Active</Badge>}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortBy('newest')}>
                                Newest First {sortBy === 'newest' && <Badge variant="secondary" className="ml-auto">Active</Badge>}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="items" isDropDisabled={sortBy !== 'order' || !!searchQuery || statusFilter !== 'all'}>
                    {(provided) => (
                        <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="space-y-3"
                        >
                            {sortedItems.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                                    No items found matching your filters.
                                </div>
                            ) : (
                                sortedItems.map((item, index) => (
                                    <ItemCard
                                        key={item.id}
                                        item={item}
                                        module={module}
                                        onEdit={onEdit}
                                        onToggleStatus={onToggleStatus}
                                        index={index}
                                        isDragEnabled={sortBy === 'order' && !searchQuery && statusFilter === 'all'}
                                    />
                                ))
                            )}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </div>
    );
}
