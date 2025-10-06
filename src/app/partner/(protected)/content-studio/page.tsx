// src/app/partner/(protected)/content-studio/page.tsx
"use client";

import PartnerHeader from "../../../../components/partner/PartnerHeader";
import { Card, CardContent } from "../../../../components/ui/card";
import { Layers } from "lucide-react";

export default function ContentStudioPage() {
  return (
    <>
      <PartnerHeader
        title="Content Studio"
        subtitle="Create and manage your content templates."
      />
      <main className="flex-1 overflow-auto p-6">
        <Card>
          <CardContent className="p-10 text-center">
            <Layers className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">Content Studio</h2>
            <p className="text-muted-foreground mt-2">
              This page is under construction.
            </p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
