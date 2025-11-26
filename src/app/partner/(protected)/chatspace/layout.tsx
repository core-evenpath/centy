import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'ChatSpace - WhatsApp Business Messaging',
    description: 'Manage your WhatsApp Business conversations',
};

export default function ChatSpaceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="h-full">
            {children}
        </div>
    );
}
