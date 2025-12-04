"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HardDrive, Bot, Swords } from 'lucide-react';
import AssetsPanel from '@/components/partner/core/AssetsPanel';
import PersonaEditor from '@/components/partner/core/PersonaEditor';
import Simulator from '@/components/partner/core/Simulator';

export default function CoreMemoryPage() {
    return (
        <div className="h-full flex flex-col bg-gray-50/50">
            <div className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Core Memory</h1>
                    <p className="text-gray-500">Manage your digital assets, AI agents, and training simulations.</p>
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
                            <TabsTrigger value="simulator" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 px-4">
                                <Swords className="w-4 h-4 mr-2" />
                                Training Arena
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="assets" className="flex-1 overflow-hidden mt-0 data-[state=active]:flex flex-col">
                        <AssetsPanel />
                    </TabsContent>

                    <TabsContent value="agents" className="flex-1 overflow-hidden mt-0 data-[state=active]:flex flex-col">
                        <PersonaEditor />
                    </TabsContent>

                    <TabsContent value="simulator" className="flex-1 overflow-hidden mt-0 data-[state=active]:flex flex-col">
                        <Simulator />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
