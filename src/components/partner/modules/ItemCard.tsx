'use client';

import { ModuleItem, PartnerModule } from '@/lib/modules/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, EyeOff, Eye, GripVertical } from 'lucide-react';
import { DynamicFieldRenderer } from './DynamicFieldRenderer';
import { formatCurrency } from '@/lib/modules/utils';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Draggable } from '@hello-pangea/dnd';

interface ItemCardProps {
    item: ModuleItem;
    module: PartnerModule;
    onEdit: (item: ModuleItem) => void;
    onToggleStatus: (item: ModuleItem) => void;
    index: number; // for drag and drop
    isDragEnabled?: boolean;
}

export function ItemCard({ item, module, onEdit, onToggleStatus, index, isDragEnabled = false }: ItemCardProps) {
    // Find fields that are marked to show in card
    const schemaFields = [...module.customFields]; // In a real scenario, we'd merge system schema fields too if we had access to full schema here.
    // For now, assuming PartnerModule contains the *full* effective schema in customFields or we pass schema separately.
    // Actually PartnerModule has customFields. The prompt implies we might need the SystemModule schema too.
    // Let's assume for this component we want to display key info.

    // If we don't have the full schema passed, we can't key off `showInCard`.
    // Let's assume we render the first 3 fields from item.fields as a fallback or if passed schema allows.

    return (
        <Draggable draggableId={item.id} index={index} isDragDisabled={!isDragEnabled}>
            {(provided, snapshot) => (
                <Card
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={cn(
                        "overflow-hidden transition-all hover:shadow-md bg-white",
                        !item.isActive && "opacity-75 bg-slate-50",
                        snapshot.isDragging && "shadow-lg rotate-1 z-50"
                    )}
                >
                    <div className="flex flex-col sm:flex-row h-full">
                        {/* Image Section */}
                        <div className="relative w-full sm:w-32 h-32 sm:h-auto bg-muted shrink-0">
                            {item.images && item.images.length > 0 ? (
                                <Image
                                    src={item.images[0]}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 640px) 100vw, 128px"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full w-full text-muted-foreground">
                                    No Image
                                </div>
                            )}
                            {item.isFeatured && (
                                <Badge className="absolute top-2 left-2 bg-yellow-500 hover:bg-yellow-600 text-white border-none shadow-sm">
                                    Featured
                                </Badge>
                            )}
                        </div>

                        {/* Content Section */}
                        <div className="flex-1 flex flex-col p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-lg line-clamp-1">{item.name}</h3>
                                        {!item.isActive && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                                </div>

                                {isDragEnabled && (
                                    <div {...provided.dragHandleProps} className="cursor-grab text-muted-foreground p-1 hover:bg-slate-100 rounded">
                                        <GripVertical className="h-4 w-4" />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-auto text-sm">
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground">Price</span>
                                    <span className="font-medium">
                                        {item.price ? formatCurrency(item.price, item.currency) : 'Free / Custom'}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground">Category</span>
                                    <span className="font-medium truncate">{item.category}</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions Section */}
                        <div className="flex sm:flex-col border-t sm:border-t-0 sm:border-l divide-x sm:divide-x-0 sm:divide-y bg-muted/10">
                            <Button
                                variant="ghost"
                                className="flex-1 sm:flex-none h-12 sm:h-auto sm:py-6 rounded-none hover:bg-primary/5 text-primary"
                                onClick={() => onEdit(item)}
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "flex-1 sm:flex-none h-12 sm:h-auto sm:py-6 rounded-none",
                                    item.isActive ? "text-muted-foreground hover:text-destructive hover:bg-destructive/10" : "text-green-600 hover:bg-green-50"
                                )}
                                onClick={() => onToggleStatus(item)}
                            >
                                {item.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </Card>
            )}
        </Draggable>
    );
}
