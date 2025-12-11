"use client";

import { createContext, useContext } from 'react';
import { AuthProvider } from '../../../hooks/use-auth';
import { useMultiWorkspaceAuth } from '../../../hooks/use-multi-workspace-auth';
import type { MultiWorkspaceAuthState } from '../../../lib/types';
import PartnerAuthWrapper from '../../../components/partner/PartnerAuthWrapper';
import { PartnerHubProvider } from '../../../hooks/use-partnerhub';

import { SidebarProvider } from '../../../components/ui/sidebar';
import UnifiedPartnerSidebar from '../../../components/navigation/UnifiedPartnerSidebar';
import PartnerBottomNavigation from '../../../components/navigation/PartnerBottomNavigation';

const MultiWorkspaceContext = createContext<MultiWorkspaceAuthState | null>(null);

export function useMultiWorkspaceContext() {
  const context = useContext(MultiWorkspaceContext);
  if (!context) {
    throw new Error('useMultiWorkspaceContext must be used within a MultiWorkspaceProvider');
  }
  return context;
}

function MultiWorkspaceProvider({ children }: { children: React.ReactNode }) {
  const multiWorkspaceAuth = useMultiWorkspaceAuth();

  return (
    <MultiWorkspaceContext.Provider value={multiWorkspaceAuth}>
      {children}
    </MultiWorkspaceContext.Provider>
  );
}

export default function ProtectedPartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <MultiWorkspaceProvider>
        <PartnerHubProvider>
          <SidebarProvider defaultOpen={false}>
            <PartnerAuthWrapper>
              <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
                <UnifiedPartnerSidebar />
                <main className="flex-1 flex flex-col overflow-hidden relative min-w-0 pb-16 md:pb-0">
                  {children}
                </main>
                <PartnerBottomNavigation />
              </div>
            </PartnerAuthWrapper>
          </SidebarProvider>
        </PartnerHubProvider>
      </MultiWorkspaceProvider>
    </AuthProvider>
  );
}