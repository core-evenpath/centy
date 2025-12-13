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
  ChevronRight,
  Database,
  UserCircle,
} from 'lucide-react';

interface NavItem {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  section?: 'business' | 'account';
}

const sidebarNavItems: NavItem[] = [
  {
    title: "Business Data",
    description: "Powers your AI agents",
    href: "/partner/settings/dashboard",
    icon: <Database className="w-5 h-5" />,
    section: 'business',
  },
  {
    title: "Account",
    description: "Your profile & workspace",
    href: "/partner/settings",
    icon: <UserCircle className="w-5 h-5" />,
    section: 'account',
  },
  {
    title: "Team Members",
    description: "Manage employees",
    href: "/partner/settings/employees",
    icon: <Users className="w-5 h-5" />,
    section: 'account',
  },
  {
    title: "Administrators",
    description: "Admin access control",
    href: "/partner/settings/admins",
    icon: <Shield className="w-5 h-5" />,
    section: 'account',
  },
];

function SidebarNav({ className, onItemClick }: { className?: string; onItemClick?: () => void }) {
  const pathname = usePathname();

  const businessItems = sidebarNavItems.filter(item => item.section === 'business');
  const accountItems = sidebarNavItems.filter(item => item.section === 'account');

  const renderNavItem = (item: NavItem) => {
    const isActive = pathname === item.href;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onItemClick}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
          isActive
            ? "bg-slate-900 text-white"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        )}
      >
        <span className="flex-shrink-0">
          {item.icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-medium">{item.title}</div>
        </div>
        {isActive && (
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
        )}
      </Link>
    );
  };

  return (
    <nav className={cn("flex flex-col", className)}>
      {/* Business Data Section - Priority */}
      <div className="mb-4">
        <p className="px-3 mb-2 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
          Business
        </p>
        <div className="space-y-1">
          {businessItems.map(renderNavItem)}
        </div>
      </div>

      {/* Account Section */}
      <div>
        <p className="px-3 mb-2 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
          Account
        </p>
        <div className="space-y-1">
          {accountItems.map(renderNavItem)}
        </div>
      </div>
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
        <Button variant="outline" size="sm" className="md:hidden mb-4 w-full justify-between border-slate-200">
          <div className="flex items-center gap-2">
            <Menu className="h-4 w-4" />
            <span>{currentItem?.title || 'Settings'}</span>
          </div>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Settings</h2>
          <p className="text-sm text-slate-500">Manage your workspace</p>
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
    <div className="h-full bg-slate-50 overflow-y-auto">
      <div className="container max-w-6xl mx-auto px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
              <p className="text-slate-500 text-sm">
                Manage your business data and workspace
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <MobileNav />

        {/* Main Content */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-56 flex-shrink-0">
            <div className="sticky top-6">
              <div className="bg-white rounded-lg border border-slate-200 p-3">
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
