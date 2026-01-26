import React from 'react';
import { Inbox, Settings, MessageSquareMore, ArrowRight, AlertCircle, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface UnifiedEmptyStateProps {
    isWhatsAppConnected: boolean | null;
    isTelegramConnected: boolean | null;
    whatsAppStatus?: string | null;
}

export function UnifiedEmptyState({
    isWhatsAppConnected,
    isTelegramConnected,
    whatsAppStatus
}: UnifiedEmptyStateProps) {
    const isLoading = isWhatsAppConnected === null || isTelegramConnected === null;
    const isPending = whatsAppStatus === 'pending';
    const noConnections = !isLoading && !isWhatsAppConnected && !isTelegramConnected;

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-slate-50/50 via-white to-indigo-50/30">
            <div className="relative mb-8 group">
                <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-all duration-500"></div>
                <div className="relative w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-xl border border-gray-100/80">
                    <Inbox className="w-11 h-11 text-indigo-600" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-11 h-11 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <MessageSquareMore className="w-5 h-5 text-white" />
                </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
                Welcome to your Unified Inbox
            </h2>
            <p className="text-gray-500 max-w-md text-base leading-relaxed mb-8">
                Manage all your client communications from WhatsApp and Telegram in one place.
                Select a conversation from the sidebar to start messaging.
            </p>

            <div className="flex items-center gap-4 mb-8 px-5 py-3 bg-white/80 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2">
                    {isWhatsAppConnected === null ? (
                        <div className="w-3 h-3 rounded-full bg-gray-200 animate-pulse" />
                    ) : (
                        <div className={`w-3 h-3 rounded-full ${isWhatsAppConnected ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-gray-300'}`} />
                    )}
                    <span className="text-sm text-gray-600 font-medium">
                        {isWhatsAppConnected === null ? 'Checking WhatsApp...' : `WhatsApp ${isWhatsAppConnected ? 'Connected' : 'Not Connected'}`}
                    </span>
                </div>
                <div className="w-px h-4 bg-gray-200" />
                <div className="flex items-center gap-2">
                    {isTelegramConnected === null ? (
                        <div className="w-3 h-3 rounded-full bg-gray-200 animate-pulse" />
                    ) : (
                        <div className={`w-3 h-3 rounded-full ${isTelegramConnected ? 'bg-sky-500 shadow-sm shadow-sky-500/50' : 'bg-gray-300'}`} />
                    )}
                    <span className="text-sm text-gray-600 font-medium">
                        {isTelegramConnected === null ? 'Checking Telegram...' : `Telegram ${isTelegramConnected ? 'Connected' : 'Not Connected'}`}
                    </span>
                </div>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-xs">
                {noConnections && (
                    <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl mb-2 shadow-sm">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="text-left">
                                <p className="text-sm font-semibold text-amber-800">No channels connected</p>
                                <p className="text-xs text-amber-700 mt-1">
                                    Connect at least one messaging channel to start receiving messages.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {!isLoading && !isWhatsAppConnected && (
                    <Link href="/partner/apps/whatsapp-api" className="w-full">
                        <Button
                            className={`w-full h-12 rounded-xl ${isPending
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                                : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700'
                                } text-white shadow-md flex items-center justify-center gap-2 group transition-all active:scale-[0.98]`}
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span className="font-medium">{isPending ? 'Complete WhatsApp Setup' : 'Connect WhatsApp'}</span>
                            <ArrowRight className="w-4 h-4 opacity-60 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                )}

                {!isLoading && !isTelegramConnected && (
                    <Link href="/partner/apps/telegram-api" className="w-full">
                        <Button
                            className="w-full h-12 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-md flex items-center justify-center gap-2 group transition-all active:scale-[0.98]"
                        >
                            <Send className="w-4 h-4" />
                            <span className="font-medium">Connect Telegram</span>
                            <ArrowRight className="w-4 h-4 opacity-60 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                )}

                <Link href="/partner/apps" className="w-full">
                    <Button variant="outline" className="w-full h-12 rounded-xl border-gray-200 text-gray-600 hover:bg-white hover:text-indigo-600 hover:border-indigo-300 transition-all bg-white/80 shadow-sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Manage Integrations
                    </Button>
                </Link>
            </div>
        </div>
    );
}
