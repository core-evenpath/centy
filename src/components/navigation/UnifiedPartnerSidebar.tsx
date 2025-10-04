// src/components/navigation/UnifiedPartnerSidebar.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  ListTodo, 
  Users, 
  Workflow, 
  BarChart3, 
  Settings, 
  ChevronDown,
  LogOut,
  Building2,
  MessageSquare,
  Bell,
  HelpCircle,
  Zap
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
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from '../ui/sidebar';
import { useAuth } from '../../hooks/use-auth';
import { useMultiWorkspaceAuth } from '../../hooks/use-multi-workspace-auth';
import { useToast } from '../../hooks/use-toast';
import { getAuth, signOut } from 'firebase/auth';
import { app } from '../../lib/firebase';
import type { WorkspaceAccess } from '../../lib/types';

interface MenuItem {
  icon: any;
  label: string;
  href: string;
  badge: number | null;
  description?: string;
}

interface SidebarStats {
  pendingTasks?: number;
  activeWorkflows?: number;
  teamMembers?: number;
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

  // Menu items with messaging added
  const menuItems: MenuItem[] = [
    { 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      href: '/partner/dashboard',
      badge: null 
    },
    { 
      icon: ListTodo, 
      label: 'Tasks', 
      href: '/partner/tasks',
      badge: stats?.pendingTasks || null
    },
    { 
      icon: Users, 
      label: 'Team', 
      href: '/partner/team',
      badge: stats?.teamMembers || null
    },
    { 
      icon: Workflow, 
      label: 'Workflows', 
      href: '/partner/workflows',
      badge: stats?.activeWorkflows || null
    },
    { 
      icon: MessageSquare, 
      label: 'Messaging', 
      href: '/partner/messaging',
      badge: stats?.unreadMessages || null,
      description: 'WhatsApp Messages'
    },
    { 
      icon: BarChart3, 
      label: 'Analytics', 
      href: '/partner/analytics',
      badge: null 
    },
    { 
      icon: Settings, 
      label: 'Settings', 
      href: '/partner/settings',
      badge: null 
    },
  ];

  // Load sidebar stats (you can implement this based on your needs)
  useEffect(() => {
    // TODO: Fetch real stats from Firestore
    // For now, using placeholder values
    setStats({
      pendingTasks: 0,
      activeWorkflows: 0,
      teamMembers: 0,
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
      // Reload to refresh all data
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
    <Sidebar className="border-r">
      {/* Header */}
      <SidebarHeader className="border-b p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-between h-auto p-3 hover:bg-accent"
              disabled={isWorkspaceSwitching}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <WorkspaceAvatar workspace={currentWorkspace} size="md" />
                <div className="flex-1 text-left min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {currentWorkspace?.partnerName || 'Select Workspace'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {currentWorkspace?.role === 'partner_admin' ? 'Admin' : 'Member'}
                  </p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 flex-shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <div className="px-2 py-1.5">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Switch Workspace
              </p>
            </div>
            <DropdownMenuSeparator />
            {availableWorkspaces.map((workspace) => (
              <DropdownMenuItem
                key={workspace.partnerId}
                onClick={() => handleWorkspaceSwitch(workspace)}
                className="flex items-center gap-3 p-3 cursor-pointer"
                disabled={isWorkspaceSwitching}
              >
                <WorkspaceAvatar workspace={workspace} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {workspace.partnerName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {workspace.role === 'partner_admin' ? 'Admin' : 'Member'}
                  </p>
                </div>
                {workspace.partnerId === currentWorkspace?.partnerId && (
                  <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>

      {/* Navigation Menu */}
      <SidebarContent>
        <ScrollArea className="flex-1">
          <SidebarMenu className="p-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              
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

          <Separator className="my-4" />

          {/* Additional Quick Actions */}
          <div className="px-4 py-2">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Quick Actions
            </p>
            <div className="space-y-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start gap-2"
                onClick={() => router.push('/partner/workflows/builder')}
              >
                <Zap className="w-4 h-4" />
                <span className="text-sm">Create Workflow</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start gap-2"
                onClick={() => router.push('/partner/tasks')}
              >
                <ListTodo className="w-4 h-4" />
                <span className="text-sm">Assign Task</span>
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SidebarContent>

      {/* Footer */}
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
            <DropdownMenuItem onClick={() => router.push('/partner/settings/profile')}>
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