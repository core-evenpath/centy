import React from 'react';
import { Inbox, Settings, MessageSquareMore, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface EmptyStateProps {
    isWhatsAppConnected: boolean | null;
}

export function EmptyState({ isWhatsAppConnected }: EmptyStateProps) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/30">
            <div className="relative mb-8 group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl border border-gray-100">
                    <Inbox className="w-10 h-10 text-indigo-600" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100">
                    <MessageSquareMore className="w-5 h-5 text-purple-500" />
                </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
                Welcome to your Inbox
            </h2>
            <p className="text-gray-500 max-w-md text-base leading-relaxed mb-8">
                Manage all your client communications in one place. Select a conversation from the sidebar to start messaging.
            </p>

            <div className="flex flex-col gap-3 w-full max-w-xs">
                {isWhatsAppConnected === false && (
                    <Link href="/partner/settings/whatsapp-business">
                        <Button className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 flex items-center justify-center gap-2 group transition-all">
                            <Settings className="w-4 h-4" />
                            <span>Connect WhatsApp</span>
                            <ArrowRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                )}

                <Button variant="outline" className="w-full h-11 border-gray-200 text-gray-600 hover:bg-white hover:text-indigo-600 hover:border-indigo-200 transition-all bg-white">
                    View Setup Guide
                </Button>
            </div>
        </div>
    );
}
