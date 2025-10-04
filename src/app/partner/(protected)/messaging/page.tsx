// ============================================================================
// File: src/app/partner/(protected)/messaging/page.tsx
// ============================================================================
"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PartnerHeader from '../../../../components/partner/PartnerHeader';
import MessagingDashboard from '../../../../components/partner/messaging/MessagingDashboard';
import CampaignsView from '../../../../components/partner/messaging/CampaignsView';
import ContactsView from '../../../../components/partner/messaging/ContactsView';
import TemplatesView from '../../../../components/partner/messaging/TemplatesView';
import { Activity, Target, Users, MessageSquare } from 'lucide-react';

function MessagingContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'dashboard';

  const getPageTitle = () => {
    switch (tab) {
      case 'campaigns': return 'Campaigns';
      case 'contacts': return 'Contacts';
      case 'templates': return 'Templates';
      default: return 'Messaging Hub';
    }
  };

  const getPageSubtitle = () => {
    switch (tab) {
        case 'campaigns': return 'Manage and monitor your messaging campaigns';
        case 'contacts': return 'Organize and segment your subscriber base';
        case 'templates': return 'Pre-built message templates for quick sending';
        default: return 'Manage campaigns and subscriber communications';
      }
  }

  return (
    <>
      <PartnerHeader
        title={getPageTitle()}
        subtitle={getPageSubtitle()}
      />
      <main className="flex-1 overflow-auto bg-gray-50">
        {tab === 'dashboard' && <MessagingDashboard />}
        {tab === 'campaigns' && <CampaignsView />}
        {tab === 'contacts' && <ContactsView />}
        {tab === 'templates' && <TemplatesView />}
      </main>
    </>
  );
}

export default function PartnerMessagingPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <MessagingContent />
        </Suspense>
    )
}
