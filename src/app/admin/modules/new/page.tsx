
import { adminAuth } from '@/lib/firebase-admin';
import { notFound, redirect } from 'next/navigation';
import { getUser } from '@/actions/auth-actions';
import { AIModuleWizard } from '@/components/admin/modules/AIModuleWizard';

export default async function NewModulePage() {
    // 1. Verify Authentication
    const user = await getUser();
    if (!user) {
        redirect('/login');
    }

    // 2. Verify Admin Role (optional, depending on requirements)
    // if (user.role !== 'admin') { ... }

    return (
        <div className="container max-w-5xl mx-auto py-10 px-4">
            <AIModuleWizard userId={user.uid} />
        </div>
    );
}
