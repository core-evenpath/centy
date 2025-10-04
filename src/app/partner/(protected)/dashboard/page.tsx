// src/app/partner/(protected)/dashboard/page.tsx
"use client";

import PartnerHeader from "../../../../components/partner/PartnerHeader";
import PartnerDashboard from "../../../../components/partner/PartnerDashboard";
import { Button } from "../../../../components/ui/button";
import { Plus } from "lucide-react";

export default function PartnerDashboardPage() {
  return (
    <>
      <PartnerHeader
        title="Dashboard"
        subtitle="Here's a snapshot of your workspace activity."
        actions={
          <Button>
            <Plus className="w-4 h-4" />
            New Campaign
          </Button>
        }
      />
      <main className="flex-1 overflow-auto p-6 bg-gray-50/50">
        <PartnerDashboard />
      </main>
    </>
  );
}
