'use client';

import { useModuleAssignments, useSystemModules } from '@/hooks/use-modules';
import { AssignmentManager } from '@/components/admin/modules/AssignmentManager';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock user ID - in a real app this would come from auth context
const MOCK_USER_ID = 'admin-user';

export default function AssignmentsPage() {
    const { assignments, isLoading: assignmentsLoading } = useModuleAssignments();
    const { modules, isLoading: modulesLoading } = useSystemModules();

    const isLoading = assignmentsLoading || modulesLoading;

    // Group assignments by industry
    const groupedAssignments = assignments.reduce((acc, curr) => {
        if (!acc[curr.industryName]) {
            acc[curr.industryName] = [];
        }
        acc[curr.industryName].push(curr);
        return acc;
    }, {} as Record<string, typeof assignments>);

    const industryNames = Object.keys(groupedAssignments);

    return (
        <div className="container mx-auto py-8">
            <div className="mb-8">
                <Button variant="ghost" className="mb-4 pl-0 hover:pl-0 hover:bg-transparent" asChild>
                    <Link href="/admin/modules">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Modules
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">Module Assignments</h1>
                <p className="text-muted-foreground mt-2">
                    Configure which modules are available for each industry and business type
                </p>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full max-w-md" />
                    <div className="grid gap-4 md:grid-cols-2">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
                        ))}
                    </div>
                </div>
            ) : (
                <Tabs defaultValue={industryNames[0]} className="space-y-6">
                    <TabsList className="mb-4 flex-wrap h-auto">
                        {industryNames.map(industry => (
                            <TabsTrigger key={industry} value={industry}>{industry}</TabsTrigger>
                        ))}
                    </TabsList>

                    {industryNames.map(industry => (
                        <TabsContent key={industry} value={industry} className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                                {groupedAssignments[industry].map(assignment => (
                                    <AssignmentManager
                                        key={assignment.id}
                                        assignment={assignment}
                                        availableModules={modules}
                                        userId={MOCK_USER_ID}
                                    />
                                ))}
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
            )}
        </div>
    );
}
