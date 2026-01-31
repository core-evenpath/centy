'use client';

import { useAuth } from '@/hooks/use-auth';
import { AIModuleWizard } from '@/components/admin/modules/AIModuleWizard';

export default function NewModulePage() {
    const { user, loading } = useAuth();

    if (loading) {
        return null;
    }

    if (!user) {
        return null;
    }

    return (
        <div className="container max-w-5xl mx-auto py-10 px-4">
            <AIModuleWizard userId={user.uid} />
        </div>
    );
}
