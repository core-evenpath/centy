'use client';

import { useAuth } from '@/hooks/use-auth';
import { UnifiedModuleCreator } from '@/components/admin/modules/UnifiedModuleCreator';

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
            <UnifiedModuleCreator userId={user.uid} />
        </div>
    );
}
