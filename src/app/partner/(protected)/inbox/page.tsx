import { Metadata } from 'next';
import ChatInterface from '@/components/partner/inbox/ChatInterface';

export const metadata: Metadata = {
    title: 'AI Inbox | PartnerHub',
    description: 'Chat with your AI assistants and documents',
};

export default function InboxPage() {
    return (
        <div className="h-full p-4 md:p-6 bg-gray-50/50">
            <div className="h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)]">
                <ChatInterface />
            </div>
        </div>
    );
}
