'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { backfillRelayBlockConfigsAction } from '@/actions/modules-actions';
import { useRouter } from 'next/navigation';

export function BackfillButton() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleBackfill() {
        setLoading(true);
        try {
            const result = await backfillRelayBlockConfigsAction();
            if (result.success) {
                alert(`Backfill complete: ${result.created} created, ${result.skipped} skipped, ${result.errors.length} errors`);
                router.refresh();
            }
        } catch (e) {
            alert('Backfill failed. Check console for details.');
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Button variant="outline" size="sm" onClick={handleBackfill} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Backfilling…' : 'Backfill'}
        </Button>
    );
}
