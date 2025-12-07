"use client";

import React, { useState, useEffect } from 'react';
import { usePartnerHub } from '@/hooks/use-partnerhub';
import { cn } from '@/lib/utils';
import {
    FileText,
    Bot,
    Brain,
    MessageCircle,
    Upload,
    CheckCircle2
} from 'lucide-react';
import { ProcessingStatus } from '@/lib/partnerhub-types';
import DocumentsView from '@/components/partner/core/DocumentsView';
import AgentsView from '@/components/partner/core/AgentsView';

type TabType = 'documents' | 'agents';

export default function CorePage() {
    const { documents, customAgents, partnerId } = usePartnerHub();
    const [activeTab, setActiveTab] = useState<TabType>('documents');

    const completedDocs = documents.filter(d => d.status === ProcessingStatus.COMPLETED).length;

    useEffect(() => {
        const handleSwitchToAgents = () => setActiveTab('agents');
        window.addEventListener('switchToAgentsTab', handleSwitchToAgents);
        return () => window.removeEventListener('switchToAgentsTab', handleSwitchToAgents);
    }, []);

    if (!partnerId) {
        return (
            <div className="h-full flex items-center justify-center text-slate-500">
                Loading...
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-50">
            <div className="bg-white border-b border-slate-200">
                <div className="px-6 py-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <Brain className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-slate-900">AI Setup</h1>
                            <p className="text-sm text-slate-500">Train your AI with documents and configure assistants</p>
                        </div>
                    </div>

                    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                        <button
                            onClick={() => setActiveTab('documents')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                activeTab === 'documents'
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                            )}
                        >
                            <FileText className="w-4 h-4" />
                            Documents
                            {completedDocs > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                                    {completedDocs}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('agents')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                activeTab === 'agents'
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                            )}
                        >
                            <Bot className="w-4 h-4" />
                            Assistants
                            <span className="ml-1 px-1.5 py-0.5 bg-slate-200 text-slate-600 text-xs rounded-full">
                                {customAgents.length > 0 ? customAgents.length : '3'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                {activeTab === 'documents' ? (
                    <DocumentsView />
                ) : (
                    <AgentsView partnerId={partnerId} documents={documents} />
                )}
            </div>
        </div>
    );
}