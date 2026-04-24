
'use client';

import { useMultiWorkspaceAuth } from "@/hooks/use-multi-workspace-auth";
import { usePartnerModules } from "@/hooks/use-modules";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ModuleSettingsPage() {
    const { user, currentWorkspace } = useMultiWorkspaceAuth();
    const partnerId = currentWorkspace?.partnerId || user?.customClaims?.partnerId || '';

    const { modules, isLoading } = usePartnerModules(partnerId);

    if (isLoading) {
        return (
            <div className="container mx-auto py-8 space-y-4">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-[200px] w-full" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 max-w-4xl">
            <div className="mb-6">
                <Button variant="ghost" className="mb-4 pl-0 hover:pl-0 hover:bg-transparent" asChild>
                    <Link href="/partner/relay/data">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">Module Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Configure preferences for your active modules.
                </p>
            </div>

            <div className="grid gap-6">
                {modules.map(module => (
                    <Card key={module.id}>
                        <CardHeader>
                            <CardTitle>{module.name}</CardTitle>
                            <CardDescription>Settings for {module.name}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Show Inactive Items</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Display inactive items in your dashboard list (admins only)
                                    </p>
                                </div>
                                <Switch
                                    checked={module.settings.showInactiveItems}
                                    onCheckedChange={() => toast.info('Setting update not implemented yet')}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Items Per Page</Label>
                                <Select defaultValue={String(module.settings.itemsPerPage)}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="20">20</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label>Default Currency</Label>
                                <Select defaultValue={module.settings.defaultCurrency}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USD">USD</SelectItem>
                                        <SelectItem value="EUR">EUR</SelectItem>
                                        <SelectItem value="INR">INR</SelectItem>
                                        <SelectItem value="GBP">GBP</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {modules.length === 0 && (
                    <div className="text-center py-12 border rounded-lg bg-muted/10">
                        <p className="text-muted-foreground">No active modules found.</p>
                        <Button variant="link" asChild>
                            <Link href="/partner/relay/data">Enable a Module</Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
