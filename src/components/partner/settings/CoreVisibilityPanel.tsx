'use client';

import React, { useTransition } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Eye,
    EyeOff,
    ShieldCheck,
    AlertCircle,
    BrainCircuit,
    Lock
} from 'lucide-react';
import { toast } from 'sonner';
import type { BusinessPersona, CoreVisibilitySettings } from '@/lib/business-persona-types';
import { updateCoreVisibilityAction } from '@/actions/business-persona-actions';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface CoreVisibilityPanelProps {
    partnerId: string;
    persona: BusinessPersona;
    className?: string;
}

export function CoreVisibilityPanel({ partnerId, persona, className }: CoreVisibilityPanelProps) {
    const [isPending, startTransition] = useTransition();

    // Default to all true if not set
    const visibility = persona.coreVisibility || {
        identity: true,
        personality: true,
        customerProfile: true,
        knowledge: true,
        industrySpecificData: true,
        webIntelligence: true,
        reviews: true,
        importedData: true,
        inventory: true,
    };

    const handleToggle = (key: keyof CoreVisibilitySettings) => {
        const newValue = !(visibility as any)[key];

        // Optimistic update (optional, but we'll rely on server action revalidation for robust sync)
        // Actually, persona is passed from parent which is a server component or updated via state.
        // We should assume parent revalidates.

        startTransition(async () => {
            try {
                const result = await updateCoreVisibilityAction(partnerId, {
                    [key]: newValue
                });

                if (result.success) {
                    toast.success(`Visibility updated for ${key}`);
                } else {
                    toast.error(result.message || 'Failed to update visibility');
                }
            } catch (error) {
                toast.error('An error occurred');
                console.error(error);
            }
        });
    };

    const sections = [
        { key: 'identity', label: 'Identity', description: 'Name, address, contact info', icon: ShieldCheck },
        { key: 'personality', label: 'Brand Personality', description: 'Voice tone, values, story', icon: BrainCircuit },
        { key: 'customerProfile', label: 'Customer Profile', description: 'Target audience, demographics', icon: Eye },
        { key: 'knowledge', label: 'Business Knowledge', description: 'Products, services, policies', icon: Lock },
        { key: 'industrySpecificData', label: 'Industry Data', description: 'Specific fields for your industry', icon: AlertCircle },
        { key: 'webIntelligence', label: 'Web Intelligence', description: 'Data scraped from web', icon: Eye },
        { key: 'reviews', label: 'Reviews & Reputation', description: 'Testimonials and ratings', icon: Eye },
        { key: 'inventory', label: 'Inventory', description: 'Detailed product/service lists', icon: PackageIcon },
        { key: 'importedData', label: 'Raw Import Data', description: 'Original source data', icon: DatabaseIcon },
    ] as const;

    // Icons wrappers
    function PackageIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22v-9" /></svg>; }
    function DatabaseIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>; }

    return (
        <Card className={cn("border-l-4 border-l-indigo-500", className)}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <BrainCircuit className="w-5 h-5 text-indigo-600" />
                            What "Core" Sees
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Control exactly what data the AI (Core) can access and use to help you.
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                        {Object.values(visibility).filter(Boolean).length} / {Object.keys(visibility).length} Active
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sections.map(({ key, label, description, icon: Icon }) => {
                            const isActive = (visibility as any)[key];
                            return (
                                <div
                                    key={key}
                                    className={cn(
                                        "flex flex-col p-3 rounded-lg border transition-all duration-200",
                                        isActive
                                            ? "bg-white border-slate-200 shadow-sm hover:border-indigo-300"
                                            : "bg-slate-50 border-slate-100 opacity-70"
                                    )}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className={cn("p-1.5 rounded-md", isActive ? "bg-indigo-100 text-indigo-600" : "bg-slate-200 text-slate-500")}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <Switch
                                            checked={isActive}
                                            disabled={isPending}
                                            onCheckedChange={() => handleToggle(key as keyof CoreVisibilitySettings)}
                                            className="data-[state=checked]:bg-indigo-600"
                                        />
                                    </div>
                                    <div>
                                        <span className={cn("font-medium text-sm block", isActive ? "text-slate-900" : "text-slate-500")}>
                                            {label}
                                        </span>
                                        <span className="text-xs text-slate-500 leading-tight block mt-0.5">
                                            {description}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-600 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                        <p>
                            <strong>Note:</strong> Disabling a section prevents Core from using that data for suggestions,
                            chats, and automated tasks. However, the data remains safely stored in your profile.
                            We recommend keeping most sections enabled for the best AI performance.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
