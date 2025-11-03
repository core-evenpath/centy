// src/components/partner/messaging/EmptyState.tsx
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Plus, Settings } from 'lucide-react';

interface EmptyStateProps {
  onNewConversation: () => void;
  onViewDiagnostics: () => void;
}

export default function EmptyState({ onNewConversation, onViewDiagnostics }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
      <div className="text-center max-w-md p-8">
        <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2">Welcome to Messaging</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Send and receive SMS and WhatsApp messages with your customers. Select a conversation from the left or start a new one.
        </p>
        <div className="flex flex-col gap-3">
          <Button onClick={onNewConversation}>
            <Plus className="w-4 h-4 mr-2" />
            New Conversation
          </Button>
          <Button variant="outline" onClick={onViewDiagnostics}>
            <Settings className="w-4 h-4 mr-2" />
            View Diagnostics
          </Button>
        </div>
      </div>
    </div>
  );
}
