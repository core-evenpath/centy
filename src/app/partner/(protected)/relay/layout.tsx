'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, Map, Layers, GitBranch, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const RELAY_SUB_NAV: Array<{
    href: string;
    label: string;
    icon: LucideIcon;
    exact?: boolean;
}> = [
    { href: '/partner/relay', label: 'Overview', icon: Zap, exact: true },
    { href: '/partner/relay/datamap', label: 'Content Studio', icon: Map },
    { href: '/partner/relay/blocks', label: 'Cards', icon: Layers },
    { href: '/partner/relay/flows', label: 'Conversations', icon: GitBranch },
];

export default function RelayLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const isActive = (href: string, exact?: boolean) => {
        if (exact) return pathname === href;
        return pathname === href || pathname.startsWith(href + '/');
    };

    return (
        <div className="h-full overflow-y-auto">
            <div className="border-b bg-background sticky top-0 z-10">
                <div className="container mx-auto px-6">
                    <nav className="flex gap-1 overflow-x-auto py-2">
                        {RELAY_SUB_NAV.map(item => {
                            const active = isActive(item.href, item.exact);
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors',
                                        active
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>
            {children}
        </div>
    );
}
