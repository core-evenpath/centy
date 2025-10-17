
// src/components/navigation/UnifiedPartnerSidebar.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  ListTodo, 
  Settings, 
  ChevronDown,
  LogOut,
  Building2,
  MessageSquare,
  Bell,
  HelpCircle,
  Layers,
  Send,
  Users,
  FileText,
  Radio,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from '../ui/sidebar';
import { useMultiWorkspaceAuth } from '../../hooks/use-multi-workspace-auth';
import { useToast } from '../../hooks/use-toast';
import { getAuth, signOut } from 'firebase/auth';
import { app } from '../../lib/firebase';
import type { WorkspaceAccess, Partner } from '../../lib/types';
import { getPartnerProfileAction } from '@/actions/get-partner-profile';

interface MenuItem {
  icon: any;
  label: string;
  href: string;
  badge: number | null;
  description?: string;
}

interface SidebarStats {
  pendingTasks?: number;
  unreadMessages?: number;
}

export default function UnifiedPartnerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const auth = getAuth(app);
  
  const { 
    user, 
    currentWorkspace, 
    availableWorkspaces,
    switchWorkspace 
  } = useMultiWorkspaceAuth();

  const [stats, setStats] = useState<SidebarStats>({});
  const [isWorkspaceSwitching, setIsWorkspaceSwitching] = useState(false);
  const [partner, setPartner] = useState<Partner | null>(null);

  useEffect(() => {
    async function fetchPartnerProfile() {
        if (!currentWorkspace?.partnerId) return;

        try {
            const result = await getPartnerProfileAction(currentWorkspace.partnerId);
            
            if (result.success && result.partner) {
                setPartner(result.partner);
            } else {
                console.error("Could not fetch partner profile for sidebar:", result.message)
            }
        } catch (err: any) {
            console.error('Error fetching partner profile for sidebar:', err);
        }
    }

    fetchPartnerProfile();
  }, [currentWorkspace?.partnerId]);

  const allMenuItems: MenuItem[] = [
    { 
      icon: FileText, 
      label: 'Ideabox', 
      href: '/partner/ideabox',
      badge: null,
      description: 'Create and manage ideas'
    },
    { 
      icon: MessageSquare, 
      label: 'Conversations', 
      href: '/partner/messaging',
      badge: stats?.unreadMessages || null,
      description: 'Direct & Group Chat'
    },
    { 
      icon: Radio, 
      label: 'Broadcast', 
      href: '/partner/broadcast',
      badge: null,
      description: 'Send out ideas'
    },
    { 
      icon: Users, 
      label: 'Contacts', 
      href: '/partner/contacts',
      badge: null,
      description: 'Contact Management'
    },
    { 
      icon: ListTodo, 
      label: 'Tasks', 
      href: '/partner/tasks',
      badge: stats?.pendingTasks || null
    },
    { 
      icon: Settings, 
      label: 'Settings', 
      href: '/partner/settings',
      badge: null 
    },
  ];
  
  const menuItems = partner?.isActivePlanUser === false
    ? allMenuItems.filter(item => item.label === 'Tasks' || item.label === 'Settings')
    : allMenuItems;


  // Load sidebar stats
  useEffect(() => {
    // Placeholder for fetching real stats
    setStats({
      pendingTasks: 0,
      unreadMessages: 0,
    });
  }, [currentWorkspace?.partnerId]);

  const handleWorkspaceSwitch = async (workspace: WorkspaceAccess) => {
    if (workspace.partnerId === currentWorkspace?.partnerId) return;

    setIsWorkspaceSwitching(true);
    toast({
      title: "Switching Workspace",
      description: `Switching to ${workspace.partnerName}...`
    });

    const success = await switchWorkspace(workspace.partnerId);
    
    if (success) {
      window.location.reload();
    } else {
      toast({
        variant: "destructive",
        title: "Switch Failed",
        description: "Unable to switch workspace. Please try again."
      });
      setIsWorkspaceSwitching(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out."
      });
      router.push('/partner/login');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sign Out Failed",
        description: "Unable to sign out. Please try again."
      });
    }
  };

  const WorkspaceAvatar = ({ workspace, size = 'md' }: { workspace: WorkspaceAccess | null, size?: 'sm' | 'md' | 'lg' }) => {
    const sizeClasses = {
      sm: 'w-8 h-8 text-xs',
      md: 'w-10 h-10 text-sm',
      lg: 'w-12 h-12 text-base'
    };

    const workspaceName = workspace?.partnerName || 'Workspace';

    return (
      <div className={`${sizeClasses[size]} bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-bold`}>
        {workspaceName?.charAt(0)?.toUpperCase() || '?'}
      </div>
    );
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-3 p-1">
          <div className="flex items-center justify-center w-10 h-10">
            <div className="flex items-center justify-center bg-gradient-to-br from-[#3081D0] to-[#6044A6] rounded-lg w-10 h-10">
              <Layers className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h1 className="font-bold text-lg">Partner Hub</h1>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <ScrollArea className="flex-1">
          <SidebarMenu className="p-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.description || item.label}
                  >
                    <Link 
                      href={item.href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="flex-1 font-medium">{item.label}</span>
                      {item.badge !== null && item.badge > 0 && (
                        <Badge variant="secondary" className="ml-auto">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 h-auto p-3 hover:bg-accent"
            >
              <Avatar className="w-9 h-9">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="font-medium text-sm truncate">
                  {user?.displayName || user?.email || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email || 'No email'}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 flex-shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => router.push('/partner/settings')}>
              <Settings className="w-4 h-4 mr-2" />
              Account Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/partner/settings/notifications')}>
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/partner/settings/billing')}>
              <Building2 className="w-4 h-4 mr-2" />
              Billing & Plan
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <HelpCircle className="w-4 h-4 mr-2" />
              Help & Support
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
