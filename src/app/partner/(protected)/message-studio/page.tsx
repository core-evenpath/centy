// src/app/partner/(protected)/message-studio/page.tsx
"use client";

import PartnerHeader from "../../../../components/partner/PartnerHeader";
import { Card, CardContent } from "../../../../components/ui/card";
import { MessageSquare } from "lucide-react";

export default function MessageStudioPage() {
  return (
    <>
      <PartnerHeader
        title="Message Studio"
        subtitle="Create and manage your messaging campaigns."
      />
      <main className="flex-1 overflow-auto p-6">
        <Card>
          <CardContent className="p-10 text-center">
            <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">Message Studio</h2>
            <p className="text-muted-foreground mt-2">
              This page is under construction.
            </p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
