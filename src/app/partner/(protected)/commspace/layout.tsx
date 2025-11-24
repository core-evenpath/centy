import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'CommSpace - WhatsApp Business Messaging',
    description: 'Manage your WhatsApp Business conversations',
};

export default function CommSpaceLayout({
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
