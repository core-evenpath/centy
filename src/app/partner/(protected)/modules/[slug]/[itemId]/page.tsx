'use client';

import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { usePartnerModule } from '@/hooks/use-modules';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PageProps {
    params: {
        slug: string;
        itemId: string;
    };
}

export default function ItemDetailPage({ params }: PageProps) {
    const { user, currentWorkspace, loading: authLoading } = useMultiWorkspaceAuth();
    const partnerId = currentWorkspace?.partnerId || user?.customClaims?.partnerId;

    const { partnerModule, isLoading: pLoading } = usePartnerModule(partnerId || '', params.slug);

    if (authLoading || pLoading) {
        return (
            <div className="container mx-auto py-8 space-y-4">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-[200px] w-full" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8">
            <Button variant="ghost" className="mb-4 pl-0" asChild>
                <Link href={`/partner/modules/${params.slug}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Items
                </Link>
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle>Item Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="p-8 text-center text-muted-foreground">
                        Item Detail View (ID: {params.itemId})
                        <br />
                        <span className="text-sm">Please manage items via the list view editor for now.</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
