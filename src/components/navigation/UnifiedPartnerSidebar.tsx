"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Settings,
  LogOut,
  Users,
  Inbox,
  PanelLeftClose,
  PanelLeftOpen,
  Database,
  Bot,
  Megaphone,
  Package,
  Link as LinkIcon,
  Zap,
  Map,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { useMultiWorkspaceAuth } from '../../hooks/use-multi-workspace-auth';
import { useToast } from '../../hooks/use-toast';
import { getAuth, signOut } from 'firebase/auth';
import { app } from '../../lib/firebase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export default function UnifiedPartnerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const auth = getAuth(app);
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Auto-collapse logic based on initial load or responsive (optional)
  // For now we persist specific state manually

  const {
    user,
    currentWorkspace,
    switchWorkspace
  } = useMultiWorkspaceAuth();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/auth/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const isActiveRoute = (href: string) => {
    if (href === '/partner/core') {
      return pathname === '/partner/core' ||
        pathname.startsWith('/partner/documents');
    }
    if (href === '/partner/broadcast') {
      return pathname === '/partner/broadcast' || pathname.startsWith('/partner/broadcast/') || pathname.startsWith('/partner/campaigns');
    }
    // Relay has a sibling "Content Studio" entry at /partner/relay/datamap —
    // exact-match so the two sidebar items never highlight simultaneously.
    if (href === '/partner/relay') {
      return pathname === '/partner/relay';
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  const menuItems = [
    {
      icon: Inbox,
      label: 'Inbox',
      href: '/partner/inbox',
      isInbox: true
    },
    {
      icon: Database,
      label: 'Core Memory',
      href: '/partner/core'
    },
    {
      icon: Bot,
      label: 'Agents',
      href: '/partner/agents'
    },
    {
      icon: Users,
      label: 'Contacts',
      href: '/partner/contacts'
    },
    {
      icon: Package,
      label: 'Modules',
      href: '/partner/relay/modules'
    },
    {
      icon: Megaphone,
      label: 'Broadcast',
      href: '/partner/broadcast'
    },
    {
      icon: LinkIcon,
      label: 'Apps',
      href: '/partner/apps'
    },
    {
      icon: Zap,
      label: 'Relay',
      href: '/partner/relay'
    },
    {
      icon: Map,
      label: 'Content Studio',
      href: '/partner/relay/datamap'
    },
    {
      icon: ShoppingBag,
      label: 'Orders',
      href: '/partner/orders'
    },
    {
      icon: Settings,
      label: 'Settings',
      href: '/partner/settings'
    },
  ];

  return (
    <div className={cn(
      "hidden md:flex flex-col bg-[#F3F4F6] border-r border-gray-200 transition-all duration-300 ease-in-out h-full overflow-hidden",
      isCollapsed ? "w-20" : "w-64"
    )}>
      {/* Header / Logo */}
      <div className="p-4 flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
          <Database className="w-5 h-5 text-white" />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col overflow-hidden transition-all duration-300">
            <h1 className="font-bold text-gray-900 text-lg leading-none">Centy</h1>
            <span className="text-xs text-indigo-600 font-medium tracking-wide">PartnerHub</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav role="navigation" aria-label="Main navigation" className="flex-1 px-3 space-y-1 overflow-hidden">
        {menuItems.map((item) => {
          const isActive = isActiveRoute(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                isActive
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:bg-white/50 hover:text-gray-900",
                isCollapsed && "justify-center px-0"
              )}
            >
              <item.icon className={cn(
                "w-6 h-6 flex-shrink-0 transition-colors",
                isActive ? "text-indigo-600" : "text-gray-500 group-hover:text-gray-900"
              )} />

              {!isCollapsed && (
                <span className="font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                  {item.label}
                </span>
              )}

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap pointer-events-none">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-4 mt-auto border-t border-gray-200/50">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2 text-gray-500 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100",
            isCollapsed && "justify-center"
          )}
        >
          {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          {!isCollapsed && <span className="text-sm font-medium">Collapse</span>}
        </button>

        {/* User Profile (Optional Mini) */}
        {!isCollapsed && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="mt-4 flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-xs font-medium text-gray-900 truncate">{user?.displayName || 'User'}</p>
                  <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}