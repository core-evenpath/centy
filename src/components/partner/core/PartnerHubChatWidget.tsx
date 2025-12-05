"use client";

import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Maximize2, Minimize2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import ChatInterface from '@/components/partner/inbox/ChatInterface';
import { usePartnerHub } from '@/hooks/use-partnerhub';
import { ChatContextType } from '@/lib/partnerhub-types';

interface PartnerHubChatWidgetProps {
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
}

export default function PartnerHubChatWidget({ isOpen, onToggle, onClose }: PartnerHubChatWidgetProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const { activeContext } = usePartnerHub();

    // Auto-open if context changes to something specific? 
    // Maybe not, let the parent control it.

    return (
        <div className={cn(
            "fixed z-50 transition-all duration-300 ease-in-out shadow-2xl",
            isOpen
                ? isExpanded
                    ? "bottom-0 right-0 w-full h-full md:w-[600px] md:h-[800px] md:bottom-6 md:right-6 md:rounded-2xl"
                    : "bottom-0 right-0 w-full h-[600px] md:w-[400px] md:bottom-6 md:right-6 md:rounded-2xl"
                : "bottom-6 right-6 w-14 h-14 rounded-full"
        )}>
            {isOpen ? (
                <div className="flex flex-col h-full bg-white overflow-hidden rounded-t-2xl md:rounded-2xl border border-gray-200 shadow-2xl ring-1 ring-black/5">
                    {/* Widget Header */}
                    <div className="h-12 bg-indigo-600 flex items-center justify-between px-4 text-white flex-shrink-0 cursor-pointer" onClick={onToggle}>
                        <div className="flex items-center gap-2">
                            <MessageCircle className="w-5 h-5" />
                            <span className="font-medium text-sm">
                                {activeContext?.name || 'Partner Assistant'}
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors hidden md:block"
                            >
                                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onToggle(); }}
                                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors md:hidden"
                            >
                                <ChevronDown className="w-4 h-4" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onClose(); }}
                                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors hidden md:block"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Chat Content */}
                    <div className="flex-1 overflow-hidden relative">
                        <ChatInterface showBackButton={false} hideCallButtons={true} />
                    </div>
                </div>
            ) : (
                <button
                    onClick={onToggle}
                    className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                >
                    <MessageCircle className="w-7 h-7" />
                </button>
            )}
        </div>
    );
}
