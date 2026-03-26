import AdminHeader from '@/components/admin/AdminHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { GitBranch, Zap, Users, ArrowRight } from 'lucide-react';
import { getAdminFlowOverviewAction } from '@/actions/flow-engine-actions';

export default async function AdminFlowsPage() {
    const result = await getAdminFlowOverviewAction();
    const overview = result.success ? result.overview : null;

    return (
        <div>
            <AdminHeader
                title="Flow Engine"
                subtitle="System flow templates and partner custom flows"
                actions={
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/relay">
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Back to Relay
                        </Link>
                    </Button>
                }
            />

            <div className="container mx-auto py-8 px-6 space-y-8">
                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="p-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Zap className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{overview?.totalTemplates || 0}</div>
                                    <div className="text-sm text-muted-foreground">System Templates</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                    <Users className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{overview?.partnersWithCustomFlows || 0}</div>
                                    <div className="text-sm text-muted-foreground">Partners with Custom Flows</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                    <GitBranch className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">
                                        {overview?.templateUsage.reduce((sum, t) => sum + t.stageCount, 0) || 0}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Total Stages (Templates)</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* System Templates */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">System Flow Templates</CardTitle>
                        <CardDescription>
                            Pre-built conversation flows auto-applied based on business function
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 md:grid-cols-2">
                            {(overview?.templateUsage || []).map(t => (
                                <div
                                    key={t.functionId}
                                    className="flex items-center gap-3 p-3 rounded-lg border"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                        <GitBranch className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{t.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {t.functionId} &middot; {t.stageCount} stages
                                        </p>
                                    </div>
                                    <Badge variant="secondary" className="text-xs shrink-0">
                                        {t.stageCount} stages
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Partner Custom Flows */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Partner Custom Flows</CardTitle>
                        <CardDescription>
                            Partners who have created or customized their conversation flows
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {(overview?.recentFlowPartners || []).length === 0 ? (
                            <div className="text-center py-8">
                                <GitBranch className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    No partners have created custom flows yet.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {(overview?.recentFlowPartners || []).map(p => (
                                    <div
                                        key={p.partnerId}
                                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                                            {p.partnerId.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-sm truncate">{p.flowName}</p>
                                                <Badge
                                                    variant={p.status === 'active' ? 'default' : 'secondary'}
                                                    className="text-[10px]"
                                                >
                                                    {p.status}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {p.partnerId} &middot; {p.stageCount} stages
                                            </p>
                                        </div>
                                        <span className="text-xs text-muted-foreground shrink-0">
                                            {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : ''}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
