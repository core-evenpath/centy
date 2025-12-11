"use client";

import React from 'react';
import { usePartnerHub } from '@/hooks/use-partnerhub';
import {
    FileText,
    Sparkles,
    CheckCircle2,
    Clock,
    Bot,
    ArrowRight
} from 'lucide-react';
import { ProcessingStatus } from '@/lib/partnerhub-types';
import DocumentsView from '@/components/partner/core/DocumentsView';
import Link from 'next/link';

export default function CorePage() {
    const { documents, partnerId } = usePartnerHub();

    const completedDocs = documents.filter(d => d.status === ProcessingStatus.COMPLETED).length;
    const processingDocs = documents.filter(d => d.status === ProcessingStatus.PROCESSING).length;

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
                <div className="px-6 py-5">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold text-slate-900">Knowledge Base</h1>
                                <p className="text-sm text-slate-500 mt-0.5">
                                    Upload documents to train your AI assistants
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-4">
                                {completedDocs > 0 && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        <span className="text-sm font-medium text-emerald-700">
                                            {completedDocs} ready
                                        </span>
                                    </div>
                                )}
                                {processingDocs > 0 && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg">
                                        <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                                        <span className="text-sm font-medium text-amber-700">
                                            {processingDocs} processing
                                        </span>
                                    </div>
                                )}
                            </div>

                            <Link
                                href="/partner/agents"
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                                <Bot className="w-4 h-4" />
                                Configure Assistants
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>

                    {documents.length === 0 && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                            <div className="flex items-start gap-3">
                                <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-indigo-900">
                                        Get started by uploading your business documents
                                    </p>
                                    <p className="text-sm text-indigo-700 mt-1">
                                        FAQs, pricing, product info, policies — your AI will learn from these to answer customer questions accurately.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <DocumentsView />
            </div>
        </div>
    );
}