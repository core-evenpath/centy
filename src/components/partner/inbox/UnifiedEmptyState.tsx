import React from 'react';
import { Inbox, Settings, MessageSquareMore, AlertCircle, MessageCircle, Send } from 'lucide-react';
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
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#fafafa]">
            {/* Icon Group */}
            <div
                className="relative mb-10"
                style={{ animation: 'fadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
                <div className="relative w-20 h-20 bg-white rounded-2xl flex items-center justify-center border border-[#e5e5e5] shadow-sm">
                    <Inbox className="w-10 h-10 text-[#999]" />
                </div>
                <div
                    className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#000] rounded-xl flex items-center justify-center shadow-lg"
                    style={{ animation: 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both' }}
                >
                    <MessageSquareMore className="w-5 h-5 text-white" />
                </div>
            </div>

            {/* Title & Description */}
            <h2
                className="text-[24px] font-bold text-[#000] mb-3 tracking-[-0.5px]"
                style={{ animation: 'fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both' }}
            >
                Welcome to your Unified Inbox
            </h2>
            <p
                className="text-[#666] max-w-md text-[15px] leading-relaxed mb-10"
                style={{ animation: 'fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both' }}
            >
                Manage all your client communications from WhatsApp and Telegram in one place.
                Select a conversation from the sidebar to start messaging.
            </p>

            {/* Connection Status */}
            <div
                className="flex items-center gap-5 mb-10 px-6 py-4 bg-white rounded-2xl border border-[#e5e5e5]"
                style={{ animation: 'fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both' }}
            >
                <div className="flex items-center gap-2.5">
                    {isWhatsAppConnected === null ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#e5e5e5] animate-pulse" />
                    ) : (
                        <div className={`w-2.5 h-2.5 rounded-full transition-colors ${isWhatsAppConnected ? 'bg-[#25D366]' : 'bg-[#ccc]'}`} />
                    )}
                    <span className="text-[14px] text-[#666] font-medium">
                        {isWhatsAppConnected === null ? 'Checking...' : `WhatsApp ${isWhatsAppConnected ? 'Connected' : 'Not Connected'}`}
                    </span>
                </div>
                <div className="w-px h-5 bg-[#e5e5e5]" />
                <div className="flex items-center gap-2.5">
                    {isTelegramConnected === null ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#e5e5e5] animate-pulse" />
                    ) : (
                        <div className={`w-2.5 h-2.5 rounded-full transition-colors ${isTelegramConnected ? 'bg-[#0088cc]' : 'bg-[#ccc]'}`} />
                    )}
                    <span className="text-[14px] text-[#666] font-medium">
                        {isTelegramConnected === null ? 'Checking...' : `Telegram ${isTelegramConnected ? 'Connected' : 'Not Connected'}`}
                    </span>
                </div>
            </div>

            {/* Action Buttons */}
            <div
                className="flex flex-col gap-3 w-full max-w-xs"
                style={{ animation: 'fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both' }}
            >
                {noConnections && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-2">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="text-left">
                                <p className="text-[14px] font-semibold text-amber-800">No channels connected</p>
                                <p className="text-[12px] text-amber-700 mt-1 leading-relaxed">
                                    Connect at least one messaging channel to start receiving messages.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {!isLoading && !isWhatsAppConnected && (
                    <Link href="/partner/apps/whatsapp-api" className="w-full">
                        <Button
                            className={`w-full h-12 rounded-xl text-[14px] font-semibold ${isPending
                                ? 'bg-amber-500 hover:bg-amber-600'
                                : 'bg-[#25D366] hover:bg-[#20bd5a]'
                                } text-white flex items-center justify-center gap-2.5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]`}
                        >
                            <MessageCircle className="w-4 h-4" />
                            {isPending ? 'Complete WhatsApp Setup' : 'Connect WhatsApp'}
                        </Button>
                    </Link>
                )}

                {!isLoading && !isTelegramConnected && (
                    <Link href="/partner/apps/telegram-api" className="w-full">
                        <Button
                            className="w-full h-12 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white text-[14px] font-semibold flex items-center justify-center gap-2.5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Send className="w-4 h-4" />
                            Connect Telegram
                        </Button>
                    </Link>
                )}

                <Link href="/partner/apps" className="w-full">
                    <Button
                        variant="outline"
                        className="w-full h-12 rounded-xl border-[#e5e5e5] text-[#666] hover:bg-[#f5f5f5] hover:text-[#000] hover:border-[#ddd] transition-all duration-200 bg-white text-[14px] font-medium"
                    >
                        <Settings className="w-4 h-4 mr-2" />
                        Manage Integrations
                    </Button>
                </Link>
            </div>

            {/* Inline animations */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes fadeSlideUp {
                    from {
                        opacity: 0;
                        transform: translateY(16px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes scaleIn {
                    from {
                        opacity: 0;
                        transform: scale(0);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
            `}} />
        </div>
    );
}
