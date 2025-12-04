"use client";

import React, { useState } from 'react';
import { usePartnerHub } from '@/hooks/use-partnerhub';
import { AgentProfile, ChatContextType } from '@/lib/partnerhub-types';
import { Bot, Sparkles, Zap, Briefcase, Plus, Edit3, Play, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PersonaEditorProps {
    onSimulatorStart?: () => void;
}

export default function PersonaEditor({ onSimulatorStart }: PersonaEditorProps) {
    const {
        customAgents,
        selectedAgentId,
        setSelectedAgentId,
        createAgent,
        updateAgent,
        switchContext
    } = usePartnerHub();

    const [viewMode, setViewMode] = useState<'list' | 'edit'>('list');

    const activeAgent = customAgents.find(a => a.id === selectedAgentId) || customAgents[0];

    const handleCreateAgent = async () => {
        const newId = await createAgent({
            name: 'New Agent',
            systemPrompt: 'You are a helpful assistant.',
            personality: {
                tone: 'Helpful',
                style: 'Professional',
                traits: []
            }
        });

        if (newId) {
            setSelectedAgentId(newId);
            setViewMode('edit');
        }
    };

    const handleUpdateAgent = (updates: Partial<AgentProfile>) => {
        if (activeAgent) {
            updateAgent(activeAgent.id, updates);
        }
    };

    const getIcon = (iconName?: string) => {
        switch (iconName) {
            case 'Sparkles': return Sparkles;
            case 'Zap': return Zap;
            case 'Briefcase': return Briefcase;
            default: return Bot;
        }
    };

    if (viewMode === 'list') {
        return (
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 animate-in fade-in duration-300">
                <div className="max-w-5xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Custom Agents</h2>
                            <p className="text-gray-500 text-sm">Create and train specialized personas for your partner.</p>
                        </div>
                        <button onClick={handleCreateAgent} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-sm font-medium">
                            <Plus className="w-4 h-4" /> Create Agent
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {customAgents.map(agent => {
                            const Icon = getIcon(agent.avatar);
                            return (
                                <div key={agent.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white", agent.personality?.style === 'Creative' ? 'bg-pink-600' : 'bg-indigo-600')}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <button
                                            onClick={() => { setSelectedAgentId(agent.id); setViewMode('edit'); }}
                                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <h3 className="font-semibold text-gray-900 text-lg mb-1">{agent.name}</h3>
                                    <p className="text-sm text-gray-500 mb-4">{agent.description || agent.personality?.tone}</p>

                                    <div className="flex items-center gap-2 mt-auto pt-4 border-t border-gray-50">
                                        <button
                                            onClick={() => {
                                                setSelectedAgentId(agent.id);
                                                switchContext({
                                                    id: agent.id,
                                                    type: ChatContextType.TRAINING,
                                                    name: `${agent.name} (Simulator)`,
                                                    subtext: 'Training Mode',
                                                    avatarColor: 'bg-indigo-600',
                                                    isGlobal: false
                                                });
                                                onSimulatorStart?.();
                                            }}
                                            className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                                        >
                                            <Play className="w-3 h-3" /> Simulator
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 animate-in fade-in duration-300">
            <div className="max-w-4xl mx-auto space-y-6">

                <button onClick={() => setViewMode('list')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-2">
                    <ArrowLeft className="w-4 h-4" /> Back to Agents
                </button>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Bot className="w-5 h-5 text-indigo-600" />
                        Agent Configuration
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Agent Name</label>
                            <input
                                type="text"
                                value={activeAgent?.name || ''}
                                onChange={e => handleUpdateAgent({ name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input
                                type="text"
                                value={activeAgent?.description || ''}
                                onChange={e => handleUpdateAgent({ description: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 text-sm"
                                placeholder="e.g. Customer Success Manager"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tone of Voice</label>
                            <input
                                type="text"
                                value={activeAgent?.personality?.tone || ''}
                                onChange={e => handleUpdateAgent({ personality: { ...activeAgent?.personality, tone: e.target.value } })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 text-sm"
                                placeholder="e.g. Professional, Friendly, Witty..."
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">System Instructions</label>
                            <textarea
                                value={activeAgent?.systemPrompt || ''}
                                onChange={e => handleUpdateAgent({ systemPrompt: e.target.value })}
                                rows={6}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 text-sm font-mono bg-gray-50"
                            />
                            <p className="text-xs text-gray-500 mt-1">Define specific rules, behaviors, and knowledge boundaries for the AI.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}