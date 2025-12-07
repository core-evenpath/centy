
"use client";

import React, { useState } from 'react';
import {
    User,
    Sparkles,
    RefreshCw,
    Save,
    MessageCircle,
    Heart,
    Target,
    Activity,
    AlertCircle,
    CheckCircle2,
    Edit2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';

import { ContactPersona, CommunicationTone, CommunicationLength } from '@/lib/types-contact';
import { triggerPersonaGenerationAction, updateContactPersonaFieldAction } from '@/actions/persona-actions';
import { cn } from '@/lib/utils';
import PersonaCard from './PersonaCard';

interface PersonaPanelProps {
    contactId: string;
    partnerId: string;
    persona: ContactPersona | undefined;
    messageCount: number;
    generationStatus: 'idle' | 'pending' | 'generating' | 'completed' | 'failed' | 'outdated';
}

export const PersonaPanel: React.FC<PersonaPanelProps> = ({
    contactId,
    partnerId,
    persona,
    messageCount,
    generationStatus
}) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState('view');

    // Edit State (simplified for manual overrides)
    const [editedSummary, setEditedSummary] = useState(persona?.summary || '');
    const [editedTone, setEditedTone] = useState<CommunicationTone>(persona?.communicationStyle.tone || 'neutral');

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const result = await triggerPersonaGenerationAction(partnerId, contactId, true);
            if (result.success) {
                toast.success("Persona generation started");
            } else {
                toast.error(result.message || "Generation failed");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveOverride = async () => {
        try {
            const result = await updateContactPersonaFieldAction(partnerId, contactId, 'summary', editedSummary);
            if (result.success) {
                toast.success("Summary updated manually");
            } else {
                toast.error(result.error || "Update failed");
            }
        } catch (error) {
            toast.error("An error occurred while saving");
        }
    };

    if (!persona && generationStatus === 'idle' && messageCount < 5) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <div className="bg-gray-100 p-3 rounded-full mb-3">
                    <User className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">No Persona Yet</h3>
                <p className="text-xs text-gray-500 max-w-[200px] mb-4">
                    Wait for at least 5 messages to generate an AI persona profile.
                </p>
                <Badge variant="outline" className="text-xs">
                    {messageCount} / 5 Messages
                </Badge>
            </div>
        );
    }

    if (!persona && (generationStatus === 'generating' || isGenerating)) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="relative mb-4">
                    <div className="absolute inset-0 bg-purple-100 rounded-full animate-ping opacity-75"></div>
                    <div className="relative bg-purple-50 p-3 rounded-full border border-purple-100">
                        <Sparkles className="w-6 h-6 text-purple-600 animate-pulse" />
                    </div>
                </div>
                <h3 className="text-sm font-semibold text-gray-900">Analyzing Persona...</h3>
                <p className="text-xs text-gray-500 mt-1">This may take a few seconds.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    Persona Insights
                </h3>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1.5"
                    onClick={handleGenerate}
                    disabled={isGenerating || messageCount < 5}
                >
                    <RefreshCw className={cn("w-3.5 h-3.5", isGenerating && "animate-spin")} />
                    Refresh
                </Button>
            </div>

            {generationStatus === 'failed' && (
                <div className="bg-red-50 text-red-700 p-3 rounded-md text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Last generation failed. Try again.
                </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="view">Overview</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>

                <TabsContent value="view" className="mt-4 space-y-4">
                    {persona && (
                        <div className="space-y-4">
                            <PersonaCard
                                persona={persona}
                                messageCount={messageCount}
                                lastGeneratedAt={persona.generatedAt}
                            />

                            {/* Simple Override Section */}
                            <div className="space-y-2 pt-2 border-t border-gray-100">
                                <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                                    <Edit2 className="w-3 h-3" />
                                    Override Summary
                                </label>
                                <div className="flex gap-2">
                                    <Textarea
                                        value={editedSummary}
                                        onChange={(e) => setEditedSummary(e.target.value)}
                                        className="text-xs min-h-[80px]"
                                        placeholder="Customize the executive summary..."
                                    />
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-auto"
                                        onClick={handleSaveOverride}
                                        disabled={editedSummary === persona.summary}
                                    >
                                        <Save className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="details" className="mt-4">
                    <ScrollArea className="h-[300px] pr-4">
                        <div className="space-y-5">
                            {/* Detailed Fields */}
                            <div className="space-y-3">
                                <label className="text-xs font-medium text-gray-700">Communication Style</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Tone</span>
                                        <p className="text-sm font-medium text-gray-900 mt-1 capitalize">
                                            {persona?.communicationStyle.tone}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Length</span>
                                        <p className="text-sm font-medium text-gray-900 mt-1 capitalize">
                                            {persona?.communicationStyle.lengthPreference}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-700">Buying Intent</label>
                                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md border border-gray-100">
                                    <div className={cn(
                                        "w-2 h-2 rounded-full",
                                        persona?.buyingIntent === 'high' ? "bg-green-500" :
                                            persona?.buyingIntent === 'medium' ? "bg-amber-500" : "bg-gray-300"
                                    )} />
                                    <span className="text-sm font-medium capitalize">{persona?.buyingIntent || 'Unknown'}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-700">Pain Points</label>
                                <div className="flex flex-wrap gap-2">
                                    {persona?.painPoints.length ? persona.painPoints.map((pp, i) => (
                                        <Badge key={i} variant="secondary" className="bg-red-50 text-red-700 border-red-100 hover:bg-red-100">
                                            {pp}
                                        </Badge>
                                    )) : <span className="text-xs text-gray-400">None detected</span>}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <p className="text-[10px] text-center text-gray-400">
                                    AI generated content can be inaccurate. verify important details.
                                </p>
                            </div>
                        </div>
                    </ScrollArea>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default PersonaPanel;
