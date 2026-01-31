"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MessageSquare,
  FolderOpen,
  Users,
  LayoutGrid,
  Settings,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigationItems = [
  {
    name: 'Inbox',
    href: '/partner/inbox',
    icon: MessageSquare
  },
  {
    name: 'Files',
    href: '/partner/core',
    icon: FolderOpen
  },
  {
    name: 'Contacts',
    href: '/partner/contacts',
    icon: Users
  },
  {
    name: 'Apps',
    href: '/partner/apps',
    icon: LayoutGrid
  },
  {
    name: 'Modules',
    href: '/partner/modules',
    icon: Package
  },
  {
    name: 'Settings',
    href: '/partner/settings',
    icon: Settings
  },
];

export default function PartnerBottomNavigation() {
  const pathname = usePathname();

  const isActiveRoute = (href: string) => {
    if (href === '/partner/core') {
      return pathname === '/partner/core' ||
        pathname.startsWith('/partner/documents') ||
        pathname.startsWith('/partner/agents');
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
      <nav className="grid grid-cols-5 h-16 safe-area-bottom">
        {navigationItems.map((item) => {
          const isActive = isActiveRoute(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-2 transition-colors relative",
                isActive
                  ? "text-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 mb-1",
                  isActive ? "text-indigo-600" : "text-gray-500"
                )}
              />
              <span
                className={cn(
                  "text-xs font-medium",
                  isActive ? "text-indigo-600" : "text-gray-500"
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
