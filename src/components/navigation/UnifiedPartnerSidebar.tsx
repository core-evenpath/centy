// src/components/navigation/UnifiedPartnerSidebar.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckSquare, Settings, LogOut, ChevronLeft, ChevronRight, MessageSquare, Target, Users, FileText, BarChart3 } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar
} from '../ui/sidebar';
import { useAuth } from '../../hooks/use-auth';

const navigation = [
  {
    name: 'Dashboard',
    href: '/partner/dashboard',
    icon: BarChart3,
  },
  {
    name: 'Tasks',
    href: '/partner/tasks',
    icon: CheckSquare,
  },
  {
    name: 'Campaigns',
    href: '/partner/messaging?tab=campaigns',
    icon: Target,
  },
  {
    name: 'Contacts',
    href: '/partner/messaging?tab=contacts',
    icon: Users,
  },
  {
    name: 'Templates',
    href: '/partner/messaging?tab=templates',
    icon: FileText,
  },
  {
    name: 'Settings',
    href: '/partner/settings',
    icon: Settings,
  },
];

export default function UnifiedPartnerSidebar() {
  const pathname = usePathname();
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const { user } = useAuth();
  const { state, setOpen } = useSidebar();
  const isExpanded = state === 'expanded';

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-3 p-1">
           <div className={`flex items-center justify-center ${isExpanded ? 'w-10 h-10' : 'w-full'}`}>
              <div className={`flex items-center justify-center bg-blue-600 rounded-lg ${isExpanded ? 'w-10 h-10' : 'w-8 h-8'}`}>
                  <div className={`bg-white rounded-sm ${isExpanded ? 'w-5 h-5' : 'w-4 h-4'}`}></div>
              </div>
          </div>
          {isExpanded && (
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Partner</h1>
              <p className="text-sm text-gray-500">Workspace</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent className="flex-1">
        <SidebarMenu>
          {navigation.map((item) => {
            const isActive = item.href.includes('?') 
              ? pathname === item.href.split('?')[0] && searchParams.get('tab') === item.href.split('=')[1]
              : pathname === item.href || (item.href !== '/partner' && pathname.startsWith(item.href + '/'));
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.name}>
                <Link href={item.href} passHref>
                  <SidebarMenuButton tooltip={item.name} isActive={isActive}>
                    <Icon />
                    {isExpanded && <span>{item.name}</span>}
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
           <SidebarMenuItem>
             <SidebarMenuButton onClick={() => setOpen(!isExpanded)} tooltip={isExpanded ? 'Collapse' : 'Expand'}>
              {isExpanded ? <ChevronLeft /> : <ChevronRight />}
              {isExpanded && <span>Collapse</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => {/* Add logout logic */}} tooltip="Logout">
              <LogOut />
              {isExpanded && <span>Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
