// src/app/partner/(protected)/templates/page.tsx
"use client";

import React, { useState } from 'react';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card';
import { Plus, MessageSquare, FileText } from 'lucide-react';
import PartnerHeader from '../../../../components/partner/PartnerHeader';

const mockTemplates = [
    { id: '1', name: 'Stock Pick Alert', category: 'Trading', content: '💰 GS Foundation - {{Date}} Selected Quality Stock...'},
    { id: '2', name: 'Quick Update', category: 'General', content: 'Quick update: {{Stock}} has performed really well...'},
    { id: '3', name: 'Market Analysis', category: 'Analysis', content: 'This week in the markets: {{Summary}}'},
    { id: '4', name: 'Welcome Message', category: 'Onboarding', content: 'Welcome to the service, {{ClientName}}!'},
];

export default function TemplatesPage() {

  return (
    <>
      <PartnerHeader
        title="Message Templates"
        subtitle="Create and manage reusable message templates."
        actions={<Button><Plus className="w-4 h-4 mr-2" />New Template</Button>}
      />
      <main className="flex-1 overflow-y-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>My Templates</CardTitle>
            <CardDescription>
              A list of your saved message templates for quick campaign creation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockTemplates.map(template => (
                <div key={template.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 rounded">
                           <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <h3 className="font-semibold flex-1 truncate">{template.name}</h3>
                    </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{template.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">{template.category}</p>
                </div>
              ))}
              <div className="p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center hover:border-primary hover:bg-secondary/50 cursor-pointer transition-colors">
                  <Plus className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Create New</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
