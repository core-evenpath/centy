
// src/app/partner/(protected)/content-studio/page.tsx
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '../../../../components/ui/card';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import PartnerHeader from '../../../../components/partner/PartnerHeader';
import { 
  Send, 
  Users, 
  FileText, 
  AlertCircle
} from 'lucide-react';
import { CreateCampaignModal } from '@/components/partner/messaging/CreateCampaignModal';
import RecommendedCampaigns from '@/components/partner/messaging/RecommendedCampaigns';

function ContentStudioDashboard() {
  const { currentWorkspace } = useMultiWorkspaceAuth();
  const router = useRouter();
  const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false);
  const [initialModalContent, setInitialModalContent] = useState<string | undefined>(undefined);

  const partnerId = currentWorkspace?.partnerId;

  const handleCreateCampaign = (idea?: string) => {
    setInitialModalContent(idea);
    setShowCreateCampaignModal(true);
  };

  const handleModalClose = () => {
    setShowCreateCampaignModal(false);
    setInitialModalContent(undefined); // Reset content when modal closes
  };
  
  if (!partnerId) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
            <h3 className="text-xl font-semibold mb-2">Workspace Not Found</h3>
            <p className="text-muted-foreground">Please select a workspace to manage content.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-full bg-gray-50 p-4 sm:p-6 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          
          <RecommendedCampaigns partnerId={partnerId} />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
             <button
              onClick={() => handleCreateCampaign()}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all group text-left"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <Send className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">Create Campaign</h2>
                    <p className="text-blue-100 text-sm">Design and send a new campaign from scratch</p>
                  </div>
                </div>
              </div>
            </button>

            <Card
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all border-2 border-transparent hover:border-purple-300 group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <FileText className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
                Message Templates
              </h3>
              <p className="text-gray-600 text-sm">
                Browse pre-written messages you can customize
              </p>
            </Card>

            <button onClick={() => router.push('/partner/contacts')} className="text-left h-full">
              <Card
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all border-2 border-transparent hover:border-green-300 group cursor-pointer h-full"
              >
                <div className="flex items-start justify-between mb-3">
                  <Users className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-green-600 transition-colors">
                  Contact Groups
                </h3>
                <p className="text-gray-600 text-sm">View and manage your contact lists</p>
              </Card>
            </button>
          </div>
        </div>
      </div>
      {showCreateCampaignModal && partnerId && (
        <CreateCampaignModal 
          isOpen={showCreateCampaignModal}
          onClose={handleModalClose}
          partnerId={partnerId}
          initialContent={{ message: initialModalContent }}
        />
      )}
    </div>
  );
}

export default function ContentStudioPage() {
  return (
    <>
      <PartnerHeader
        title="Content Studio"
        subtitle="Design, manage and send your content."
      />
      <main className="flex-1 overflow-y-auto">
        <ContentStudioDashboard />
      </main>
    </>
  );
}
