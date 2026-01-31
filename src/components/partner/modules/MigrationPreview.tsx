
'use client';

import { useMigrationPreview } from "@/hooks/use-modules";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ArrowRight, Check, Info } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface MigrationPreviewProps {
    partnerId: string;
    moduleId: string;
    targetVersion: number;
}

export function MigrationPreview({ partnerId, moduleId, targetVersion }: MigrationPreviewProps) {
    const { preview, isLoading, error } = useMigrationPreview(partnerId, moduleId, targetVersion);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error loading preview</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (!preview) return null;

    const hasChanges =
        preview.addedFields.length > 0 ||
        preview.removedFields.length > 0 ||
        preview.renamedFields.length > 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-4">
                    <div className="text-center">
                        <div className="text-sm font-medium text-muted-foreground">Current</div>
                        <div className="text-2xl font-bold">v{preview.fromVersion}</div>
                    </div>
                    <ArrowRight className="h-6 w-6 text-muted-foreground" />
                    <div className="text-center">
                        <div className="text-sm font-medium text-muted-foreground">New</div>
                        <div className="text-2xl font-bold text-primary">v{preview.toVersion}</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-sm font-medium text-muted-foreground">Items to Update</div>
                    <div className="text-2xl font-bold">{preview.itemCount}</div>
                </div>
            </div>

            {!hasChanges && (
                <Alert>
                    <Check className="h-4 w-4" />
                    <AlertTitle>No Data Changes</AlertTitle>
                    <AlertDescription>This update does not modify data structure.</AlertDescription>
                </Alert>
            )}

            {hasChanges && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Changes Summary</CardTitle>
                        <CardDescription>Review how your data will be affected.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {preview.renamedFields.length > 0 && (
                            <div>
                                <h4 className="font-medium mb-2 flex items-center text-blue-600">
                                    <Info className="h-4 w-4 mr-2" /> Renamed Fields
                                </h4>
                                <div className="space-y-2">
                                    {preview.renamedFields.map((field, i) => (
                                        <div key={i} className="flex items-center text-sm p-2 bg-muted/50 rounded border">
                                            <span className="font-mono">{field.oldName}</span>
                                            <ArrowRight className="h-3 w-3 mx-2 text-muted-foreground" />
                                            <span className="font-mono font-medium">{field.newName}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {preview.addedFields.length > 0 && (
                            <div>
                                <h4 className="font-medium mb-2 flex items-center text-green-600">
                                    <PlusIcon className="h-4 w-4 mr-2" /> New Fields
                                </h4>
                                <div className="space-y-2">
                                    {preview.addedFields.map((field, i) => (
                                        <div key={i} className="flex items-center justify-between text-sm p-2 bg-green-50/50 dark:bg-green-950/20 rounded border border-green-100 dark:border-green-900">
                                            <span className="font-medium">{field.name}</span>
                                            <Badge variant="outline" className="text-xs">
                                                Default: {JSON.stringify(field.defaultValue)}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {preview.removedFields.length > 0 && (
                            <div>
                                <h4 className="font-medium mb-2 flex items-center text-red-600">
                                    <TrashIcon className="h-4 w-4 mr-2" /> Removed Fields
                                </h4>
                                <Alert className="mb-2 border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>Data Archived</AlertTitle>
                                    <AlertDescription>
                                        Data for removed fields will be archived, not deleted.
                                    </AlertDescription>
                                </Alert>
                                <div className="space-y-2">
                                    {preview.removedFields.map((field, i) => (
                                        <div key={i} className="flex items-center text-sm p-2 bg-red-50/50 dark:bg-red-950/20 rounded border border-red-100 dark:border-red-900">
                                            <span className="font-medium line-through text-muted-foreground">{field.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            <div className="text-xs text-muted-foreground text-center">
                Estimated time: ~{preview.estimatedTime} seconds
            </div>
        </div>
    );
}

function PlusIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    )
}

function TrashIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </svg>
    )
}
