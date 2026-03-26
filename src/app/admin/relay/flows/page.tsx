'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { getAllFlowTemplatesAction, getAdminFlowOverviewAction } from '@/actions/flow-engine-actions';
import FlowVisualization from '@/components/partner/relay/FlowVisualization';
import type { SystemFlowTemplate } from '@/lib/types-flow-engine';
import { Loader2, ArrowLeft } from 'lucide-react';

function relativeTime(dateStr: string): string {
    if (!dateStr) return '—';
    const diff = Date.now() - Date.parse(dateStr);
    if (isNaN(diff)) return '—';
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

interface PartnerFlowRow {
    partnerId: string;
    partnerName: string;
    flowName: string;
    industryId: string;
    functionId: string;
    stageCount: number;
    status: string;
    updatedAt: string;
    conversationCount: number;
    avgLeadScore: number;
}

export default function AdminFlowsPage() {
    const [templates, setTemplates] = useState<SystemFlowTemplate[]>([]);
    const [partnerFlows, setPartnerFlows] = useState<PartnerFlowRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [tplResult, overviewResult] = await Promise.all([
                    getAllFlowTemplatesAction(),
                    getAdminFlowOverviewAction(),
                ]);
                if (tplResult.success) setTemplates(tplResult.templates);
                if (overviewResult.success) {
                    setPartnerFlows(
                        [...overviewResult.partnerFlows].sort(
                            (a, b) => Date.parse(b.updatedAt || '') - Date.parse(a.updatedAt || '')
                        )
                    );
                }
            } catch (e) {
                console.error('Failed to load flow data:', e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-6">
            <div className="mb-6">
                <Link
                    href="/admin/relay"
                    className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4"
                >
                    <ArrowLeft className="h-3 w-3" /> Back to Relay
                </Link>
                <h1 className="text-2xl font-bold">Flow Engine</h1>
                <p className="text-muted-foreground">
                    System flow templates and partner flow activity
                </p>
            </div>

            {/* Section A: System Flow Templates */}
            <div className="mb-10">
                <h2 className="text-lg font-semibold mb-4">System Flow Templates</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map((tpl) => (
                        <Card key={tpl.id}>
                            <CardContent className="p-5">
                                <h3 className="font-semibold mb-1">{tpl.name}</h3>
                                <div className="flex items-center gap-1.5 mb-2">
                                    <Badge variant="secondary" className="text-xs">
                                        {tpl.industryName}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                        {tpl.functionName}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                    {tpl.description}
                                </p>
                                <div className="text-xs text-muted-foreground mb-2">
                                    {tpl.stages.length} stages
                                </div>
                                <FlowVisualization stages={tpl.stages} compact />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Section B: Partner Flow Activity */}
            <div>
                <h2 className="text-lg font-semibold mb-4">Partner Flow Activity</h2>
                {partnerFlows.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="py-12 text-center">
                            <p className="text-muted-foreground">
                                No partners have customized their flows yet. All partners are
                                using system defaults.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Partner Name</TableHead>
                                    <TableHead>Flow Name</TableHead>
                                    <TableHead>Industry / Function</TableHead>
                                    <TableHead className="text-center">Stages</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Updated</TableHead>
                                    <TableHead className="text-center">Conversations</TableHead>
                                    <TableHead className="text-right">Avg Lead Score</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {partnerFlows.map((pf) => (
                                    <TableRow key={pf.partnerId}>
                                        <TableCell className="font-medium">
                                            {pf.partnerName}
                                        </TableCell>
                                        <TableCell>{pf.flowName}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Badge variant="secondary" className="text-xs">
                                                    {pf.industryId}
                                                </Badge>
                                                <Badge variant="outline" className="text-xs">
                                                    {pf.functionId}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {pf.stageCount}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    pf.status === 'active'
                                                        ? 'success'
                                                        : 'secondary'
                                                }
                                            >
                                                {pf.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {relativeTime(pf.updatedAt)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {pf.conversationCount}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {pf.avgLeadScore.toFixed(1)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                )}
            </div>
        </div>
    );
}
