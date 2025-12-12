// src/components/employee/EmployeeWorkspaceSwitcher.tsx
"use client";

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ChevronDown, Building2, Check, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../ui/dropdown-menu';
import { useToast } from '../../hooks/use-toast';
import JoinWorkspaceDialog from './JoinWorkspaceDialog';

interface WorkspaceAccess {
  partnerId: string;
  tenantId: string;
  role: 'partner_admin' | 'employee';
  permissions: string[];
  status: 'active' | 'invited' | 'suspended';
  partnerName: string;
  partnerAvatar?: string | null;
}

interface EmployeeWorkspaceSwitcherProps {
  workspaces: WorkspaceAccess[];
  currentWorkspace: WorkspaceAccess | null;
  onWorkspaceSwitch: (partnerId: string) => Promise<boolean>;
}

export default function EmployeeWorkspaceSwitcher({
  workspaces,
  currentWorkspace,
  onWorkspaceSwitch
}: EmployeeWorkspaceSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'partner_admin':
        return 'bg-purple-100 text-purple-800';
      case 'employee':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getWorkspaceInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleWorkspaceSwitch = async (workspace: WorkspaceAccess) => {
    if (workspace.partnerId === currentWorkspace?.partnerId) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      toast({
        title: "Switching Workspace",
        description: `Switching to ${workspace.partnerName}...`
      });

      const success = await onWorkspaceSwitch(workspace.partnerId);
      
      if (success) {
        toast({
          title: "Workspace Switched",
          description: `Successfully switched to ${workspace.partnerName}`
        });
        setIsOpen(false);
        // The page will reload due to workspace switch
      } else {
        toast({
          variant: "destructive",
          title: "Switch Failed",
          description: "Unable to switch workspace. Please try again."
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Switch Failed",
        description: "An error occurred while switching workspace."
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentWorkspace) {
    return (
      <div className="p-4 border-b bg-card">
        <div className="text-center">
          <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-muted-foreground">No workspace selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-b bg-card">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between h-auto p-3 hover:bg-gray-50"
            disabled={isLoading}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {getWorkspaceInitials(currentWorkspace.partnerName)}
                </span>
              </div>
              <div className="text-left">
                <div className="font-medium text-foreground">
                  {currentWorkspace.partnerName}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="secondary"
                    className={`text-xs ${getRoleBadgeColor(currentWorkspace.role)}`}
                  >
                    {currentWorkspace.role.replace('_', ' ')}
                  </Badge>
                  <div className={`w-2 h-2 rounded-full ${
                    currentWorkspace.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                </div>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-80" align="start">
          <div className="p-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Your Workspaces
            </div>
            
            {workspaces.map((workspace) => (
              <DropdownMenuItem
                key={workspace.partnerId}
                className="p-3 cursor-pointer"
                onClick={() => handleWorkspaceSwitch(workspace)}
                disabled={isLoading}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {getWorkspaceInitials(workspace.partnerName)}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {workspace.partnerName}
                      </span>
                      {workspace.partnerId === currentWorkspace.partnerId && (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="secondary"
                        className={`text-xs ${getRoleBadgeColor(workspace.role)}`}
                      >
                        {workspace.role.replace('_', ' ')}
                      </Badge>
                      
                      <div className={`w-2 h-2 rounded-full ${
                        workspace.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                      
                      <span className="text-xs text-muted-foreground capitalize">
                        {workspace.status}
                      </span>
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
            
            <DropdownMenuSeparator />

            <JoinWorkspaceDialog
              trigger={
                <DropdownMenuItem
                  className="p-3 cursor-pointer text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  disabled={isLoading}
                  onSelect={(e) => e.preventDefault()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Join Another Workspace
                </DropdownMenuItem>
              }
              onSuccess={() => {
                setIsOpen(false);
                window.location.reload();
              }}
            />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}