// src/app/partner/(protected)/settings/layout.tsx
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  Shield,
  Settings,
  Menu,
  Building2,
  ChevronRight
} from 'lucide-react';

interface NavItem {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const sidebarNavItems: NavItem[] = [
  {
    title: "Overview",
    description: "General workspace settings",
    href: "/partner/settings",
    icon: <Settings className="w-5 h-5" />,
  },
  {
    title: "Organization",
    description: "Business profile & details",
    href: "/partner/settings/dashboard",
    icon: <Building2 className="w-5 h-5" />,
  },
  {
    title: "Team Members",
    description: "Manage employees",
    href: "/partner/settings/employees",
    icon: <Users className="w-5 h-5" />,
  },
  {
    title: "Administrators",
    description: "Admin access control",
    href: "/partner/settings/admins",
    icon: <Shield className="w-5 h-5" />,
  },
];

function SidebarNav({ className, onItemClick }: { className?: string; onItemClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col space-y-1", className)}>
      {sidebarNavItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-all hover:bg-accent",
              isActive
                ? "bg-primary/10 text-primary border-l-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className={cn(
              "flex-shrink-0",
              isActive ? "text-primary" : "text-muted-foreground"
            )}>
              {item.icon}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{item.title}</div>
              <div className="text-xs text-muted-foreground truncate hidden lg:block">
                {item.description}
              </div>
            </div>
            {isActive && (
              <ChevronRight className="w-4 h-4 text-primary flex-shrink-0" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const currentItem = sidebarNavItems.find(item => item.href === pathname);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="md:hidden mb-4 w-full justify-between">
          <div className="flex items-center gap-2">
            <Menu className="h-4 w-4" />
            <span>{currentItem?.title || 'Settings'}</span>
          </div>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Settings</h2>
          <p className="text-sm text-muted-foreground">Manage your workspace</p>
        </div>
        <ScrollArea className="h-[calc(100vh-100px)]">
          <div className="p-4">
            <SidebarNav onItemClick={() => setOpen(false)} />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full bg-background overflow-y-auto">
      <div className="container max-w-7xl mx-auto px-4 py-6 lg:py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Settings</h1>
              <p className="text-muted-foreground text-sm lg:text-base">
                Manage your workspace, team, and preferences
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <MobileNav />

        {/* Main Content */}
        <div className="flex flex-col md:flex-row gap-8 pb-8">
          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-6">
              <div className="rounded-xl border bg-card p-4">
                <SidebarNav />
              </div>
            </div>
          </aside>

          {/* Content Area */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
