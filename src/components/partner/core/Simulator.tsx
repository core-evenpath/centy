"use client";

import React from 'react';
import { usePartnerHub } from '@/hooks/use-partnerhub';
import ChatInterface from '@/components/partner/inbox/ChatInterface';
import { ArrowLeft } from 'lucide-react';

interface SimulatorProps {
    onBack?: () => void;
}

export default function Simulator({ onBack }: SimulatorProps) {
    const {
        customAgents,
        selectedAgentId
    } = usePartnerHub();

    const trainingAgent = customAgents.find(a => a.id === selectedAgentId) || customAgents[0];

    return (
        <div className="flex-1 flex flex-col h-full bg-[#f9fafb] relative">
            <div className="h-14 border-b border-gray-200 flex items-center justify-between px-6 bg-white flex-shrink-0 z-10">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded text-gray-500">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    )}
                    <span className="font-semibold text-gray-900">Training Arena: {trainingAgent?.name}</span>
                    <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100">Simulator Mode</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>Test your agent's persona before deploying.</span>
                </div>
            </div>

            <div className="flex-1 relative overflow-hidden">
                <ChatInterface />
            </div>
        </div>
    );
}