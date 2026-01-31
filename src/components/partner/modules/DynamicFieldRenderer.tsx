'use client';

import { ModuleFieldDefinition } from '@/lib/modules/types';
import { Badge } from '@/components/ui/badge';
import { Check, X, ExternalLink, Calendar, Clock, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/modules/utils';
import Image from 'next/image';

interface DynamicFieldRendererProps {
    field: ModuleFieldDefinition;
    value: any;
    compact?: boolean;
}

export function DynamicFieldRenderer({ field, value, compact = false }: DynamicFieldRendererProps) {
    if (value === null || value === undefined || value === '') {
        return <span className="text-muted-foreground italic text-sm">Empty</span>;
    }

    switch (field.type) {
        case 'text':
        case 'textarea':
        case 'phone':
        case 'email':
            return <span className="text-sm">{String(value)}</span>;

        case 'number':
            return <span className="text-sm font-mono">{Number(value).toLocaleString()}</span>;

        case 'currency':
            return (
                <span className="text-sm font-medium flex items-center gap-1">
                    {formatCurrency(Number(value))}
                </span>
            );

        case 'toggle':
            return value ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Check className="w-3 h-3 mr-1" /> Yes
                </Badge>
            ) : (
                <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200">
                    <X className="w-3 h-3 mr-1" /> No
                </Badge>
            );

        case 'tags':
        case 'multi_select':
            if (!Array.isArray(value) || value.length === 0) return <span className="text-muted-foreground text-sm">-</span>;

            if (compact) {
                return (
                    <div className="flex flex-wrap gap-1">
                        {value.slice(0, 2).map((tag: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs px-1.5 py-0">{tag}</Badge>
                        ))}
                        {value.length > 2 && <span className="text-xs text-muted-foreground">+{value.length - 2}</span>}
                    </div>
                );
            }

            return (
                <div className="flex flex-wrap gap-1">
                    {value.map((tag: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                </div>
            );

        case 'select':
            return <Badge variant="outline">{String(value)}</Badge>;

        case 'url':
            return (
                <a
                    href={String(value)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1 text-sm"
                    onClick={(e) => e.stopPropagation()}
                >
                    {compact ? 'Link' : String(value)} <ExternalLink className="h-3 w-3" />
                </a>
            );

        case 'date':
            const date = new Date(String(value));
            return (
                <span className="text-sm flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    {date.toLocaleDateString()}
                </span>
            );

        case 'time':
            return (
                <span className="text-sm flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {String(value)}
                </span>
            );

        case 'image':
            if (compact) {
                return (
                    <div className="h-8 w-8 relative rounded overflow-hidden border bg-muted">
                        <Image
                            src={String(value)}
                            alt={field.name}
                            fill
                            className="object-cover"
                            sizes="32px"
                        />
                    </div>
                );
            }
            return (
                <div className="h-32 w-full relative rounded-md overflow-hidden border bg-muted">
                    <Image
                        src={String(value)}
                        alt={field.name}
                        fill
                        className="object-cover"
                        sizes="300px"
                    />
                </div>
            );

        default:
            return <span className="text-sm">{String(value)}</span>;
    }
}
