// ============================================================================
// File: src/app/partner/(protected)/messaging/page.tsx
// ============================================================================
"use client";

import React, { useState } from 'react';
import PartnerHeader from '../../../../components/partner/PartnerHeader';
import MessagingDashboard from '../../../../components/partner/messaging/MessagingDashboard';
import CampaignsView from '../../../../components/partner/messaging/CampaignsView';
import ContactsView from '../../../../components/partner/messaging/ContactsView';
import TemplatesView from '../../../../components/partner/messaging/TemplatesView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { Activity, Target, Users, MessageSquare } from 'lucide-react';

export default function PartnerMessagingPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <>
      <PartnerHeader
        title="Messaging Hub"
        subtitle="Manage campaigns and subscriber communications"
      />
      <main className="flex-1 overflow-auto bg-gray-50">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="bg-white border-b border-gray-200 px-6">
            <TabsList className="grid w-full max-w-2xl grid-cols-4 h-12">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="campaigns" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Campaigns
              </TabsTrigger>
              <TabsTrigger value="contacts" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Contacts
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Templates
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-auto">
            <TabsContent value="dashboard" className="m-0 h-full">
              <MessagingDashboard />
            </TabsContent>
            <TabsContent value="campaigns" className="m-0 h-full">
              <CampaignsView />
            </TabsContent>
            <TabsContent value="contacts" className="m-0 h-full">
              <ContactsView />
            </TabsContent>
            <TabsContent value="templates" className="m-0 h-full">
              <TemplatesView />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </>
  );
}
