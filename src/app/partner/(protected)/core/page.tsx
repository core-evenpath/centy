"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HardDrive, Bot } from 'lucide-react';
import AssetsPanel from '@/components/partner/core/AssetsPanel';
import AgentsPanel from '@/components/partner/core/AgentsPanel';
import AgentConfigPanel from '@/components/partner/core/AgentConfigPanel';
import PartnerHubChatWidget from '@/components/partner/core/PartnerHubChatWidget';
import { EssentialAgent } from '@/lib/partnerhub-types';
import { usePartnerHub } from '@/hooks/use-partnerhub';
import { saveEssentialAgentAction } from '@/actions/partnerhub-actions';

export default function CoreMemoryPage() {
    const { partnerId } = usePartnerHub();
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [configAgent, setConfigAgent] = useState<EssentialAgent | null>(null);

    // If configuring an agent, show the config panel
    if (configAgent) {
        return (
            <div className="h-full flex flex-col bg-gray-50/50 relative">
                <AgentConfigPanel
                    agent={configAgent}
                    onBack={() => setConfigAgent(null)}
                    onSave={async (updated) => {
                        if (!partnerId) return;
                        try {
                            await saveEssentialAgentAction(partnerId, updated);
                            setConfigAgent(null);
                        } catch (error) {
                            console.error('Failed to save agent:', error);
                            // Ideally show a toast here
                        }
                    }}
                    onTest={() => setIsChatOpen(true)}
                />
                <PartnerHubChatWidget
                    isOpen={isChatOpen}
                    onToggle={() => setIsChatOpen(!isChatOpen)}
                    onClose={() => setIsChatOpen(false)}
                />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-gray-50/50 relative">
            <div className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Core Memory</h1>
                    <p className="text-gray-500">Manage your digital assets and AI agents.</p>
                </div>

                <Tabs defaultValue="assets" className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <TabsList className="bg-white border border-gray-200 p-1 h-10">
                            <TabsTrigger value="assets" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 px-4">
                                <HardDrive className="w-4 h-4 mr-2" />
                                Digital Assets
                            </TabsTrigger>
                            <TabsTrigger value="agents" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 px-4">
                                <Bot className="w-4 h-4 mr-2" />
                                AI Agents
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="assets" className="flex-1 overflow-hidden mt-0 data-[state=active]:flex flex-col">
                        <AssetsPanel onChat={() => setIsChatOpen(true)} />
                    </TabsContent>

                    <TabsContent value="agents" className="flex-1 overflow-hidden mt-0 data-[state=active]:flex flex-col">
                        <AgentsPanel
                            onTestAgent={() => setIsChatOpen(true)}
                            onConfigureAgent={(agent) => setConfigAgent(agent)}
                        />
                    </TabsContent>
                </Tabs>
            </div>

            <PartnerHubChatWidget
                isOpen={isChatOpen}
                onToggle={() => setIsChatOpen(!isChatOpen)}
                onClose={() => setIsChatOpen(false)}
            />
        </div>
    );
}
