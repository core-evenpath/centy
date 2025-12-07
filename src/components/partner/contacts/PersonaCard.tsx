
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    User,
    MessageCircle,
    Smile,
    Target,
    Briefcase,
    Zap,
    Clock
} from 'lucide-react';
import type { ContactPersona } from '@/lib/types-contact';

interface PersonaCardProps {
    persona: ContactPersona;
    messageCount: number;
    lastGeneratedAt?: any;
    compact?: boolean;
}

export const PersonaCard: React.FC<PersonaCardProps> = ({
    persona,
    messageCount,
    lastGeneratedAt,
    compact = false
}) => {
    if (!persona) return null;

    if (compact) {
        return (
            <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-lg p-3 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-purple-100 rounded-full">
                        <User className="w-3 h-3 text-purple-600" />
                    </div>
                    <span className="text-xs font-semibold text-purple-900">AI Persona Insight</span>
                </div>
                <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-[10px] bg-white border-purple-200 text-purple-700">
                            {persona.communicationStyle.tone}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] bg-white border-purple-200 text-purple-700">
                            {persona.customerStage}
                        </Badge>
                    </div>
                    <p className="text-[10px] text-gray-600 line-clamp-2">
                        {persona.summary || "No summary available."}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <Card className="border-purple-100 shadow-sm overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400" />
            <CardHeader className="pb-3 bg-purple-50/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-100 rounded-full">
                            <User className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                            <CardTitle className="text-base text-gray-900">Contact Persona</CardTitle>
                            <p className="text-xs text-gray-500">
                                AI-generated based on {messageCount} messages
                            </p>
                        </div>
                    </div>
                    {lastGeneratedAt && (
                        <div className="flex items-center gap-1 text-[10px] text-gray-400 bg-white px-2 py-1 rounded-full border border-gray-100 shadow-sm">
                            <Clock className="w-3 h-3" />
                            <span>Updated recently</span>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pt-4 grid gap-4">
                {/* Summary */}
                <div className="space-y-1.5">
                    <h4 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-purple-500" />
                        Executive Summary
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-2.5 rounded-md border border-gray-100">
                        {persona.summary}
                    </p>
                </div>

                {/* Key Traits Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <h4 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                            <MessageCircle className="w-3.5 h-3.5 text-blue-500" />
                            Communication
                        </h4>
                        <div className="flex flex-wrap gap-1">
                            <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 border-blue-100">
                                {persona.communicationStyle.tone}
                            </Badge>
                            <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 border-blue-100">
                                {persona.communicationStyle.lengthPreference}
                            </Badge>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <h4 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                            <Smile className="w-3.5 h-3.5 text-amber-500" />
                            Sentiment
                        </h4>
                        <Badge variant="secondary" className={cn(
                            "text-[10px] border",
                            persona.sentiment.score > 0.3 ? "bg-green-50 text-green-700 border-green-100" :
                                persona.sentiment.score < -0.3 ? "bg-red-50 text-red-700 border-red-100" :
                                    "bg-amber-50 text-amber-700 border-amber-100"
                        )}>
                            {persona.sentiment.label}
                        </Badge>
                    </div>

                    <div className="space-y-1.5">
                        <h4 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                            Stage
                        </h4>
                        <Badge variant="outline" className="text-[10px]">
                            {persona.customerStage}
                        </Badge>
                    </div>

                    <div className="space-y-1.5">
                        <h4 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-yellow-500" />
                            Interests
                        </h4>
                        <div className="flex flex-wrap gap-1">
                            {persona.interests.slice(0, 3).map((interest, i) => (
                                <Badge key={i} variant="outline" className="text-[10px] border-dashed">
                                    {interest}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Key Facts */}
                {persona.keyFacts.length > 0 && (
                    <div className="space-y-1.5">
                        <h4 className="text-xs font-semibold text-gray-700">Key Facts</h4>
                        <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                            {persona.keyFacts.slice(0, 3).map((fact, i) => (
                                <li key={i}>{fact}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ');
}

export default PersonaCard;
