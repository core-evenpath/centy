'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getCoreAccessibleDataAction, getBusinessPersonaAction } from '@/actions/business-persona-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    ArrowLeft,
    Brain,
    Building2,
    Phone,
    Mail,
    MapPin,
    MessageSquare,
    Package,
    Users,
    Globe,
    FileText,
    RefreshCw,
    Eye,
    EyeOff,
    Sparkles,
    CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function CoreDataPage() {
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [accessibleData, setAccessibleData] = useState<any>(null);
    const [visibilitySettings, setVisibilitySettings] = useState<any>(null);
    const partnerId = user?.customClaims?.partnerId;

    const fetchData = async () => {
        if (!partnerId) return;
        setLoading(true);

        try {
            const [coreResult, personaResult] = await Promise.all([
                getCoreAccessibleDataAction(partnerId),
                getBusinessPersonaAction(partnerId),
            ]);

            if (coreResult.success) setAccessibleData(coreResult.data);
            if (personaResult.success) setVisibilitySettings(personaResult.persona?.coreVisibility);
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && partnerId) fetchData();
    }, [partnerId, authLoading]);

    if (authLoading || loading) {
        return (
            <div className="p-6 max-w-4xl mx-auto space-y-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-[500px] w-full" />
            </div>
        );
    }

    const sections = visibilitySettings?.sections || {};

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <div className="max-w-4xl mx-auto p-6">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/partner/settings">
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 rounded-xl">
                                    <Brain className="w-6 h-6 text-indigo-600" />
                                </div>
                                What Core Sees
                            </h1>
                            <p className="text-slate-500 mt-1">
                                This is exactly what your AI assistant can access
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={fetchData} className="gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </Button>
                </div>

                {accessibleData?.summary && (
                    <Card className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-600" />
                                AI Context Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono bg-white/70 p-4 rounded-xl">
                                {accessibleData.summary}
                            </pre>
                        </CardContent>
                    </Card>
                )}

                <div className="space-y-4">
                    <DataSection
                        title="Business Classification"
                        icon={Globe}
                        enabled={sections.identity !== false}
                        data={{
                            industry: accessibleData?.identity?.industry?.category,
                            subcategory: accessibleData?.identity?.industry?.name,
                            location: accessibleData?.identity?.address?.country || accessibleData?.identity?.address?.city
                        }}
                        fields={['industry', 'subcategory', 'location']}
                        renderField={(key, val) => {
                            if (key === 'industry') return <span className="capitalize">{String(val).replace(/_/g, ' ')}</span>;
                            return val;
                        }}
                    />
                    <DataSection
                        title="Business Classification"
                        icon={Globe}
                        enabled={sections.identity !== false}
                        data={{
                            industry: accessibleData?.identity?.industry?.category,
                            subcategory: accessibleData?.identity?.industry?.name,
                            location: accessibleData?.identity?.address?.country || accessibleData?.identity?.address?.city,
                            timezone: accessibleData?.identity?.timezone,
                            currency: accessibleData?.identity?.currency
                        }}
                        fields={['industry', 'subcategory', 'location', 'timezone', 'currency']}
                        renderField={(key, val) => {
                            if (key === 'industry') return <span className="capitalize">{String(val).replace(/_/g, ' ')}</span>;
                            return val;
                        }}
                    />
                    <DataSection
                        title="Business Identity"
                        icon={Building2}
                        enabled={sections.identity !== false}
                        data={accessibleData?.identity}
                        fields={['name', 'phone', 'email', 'website', 'whatsAppNumber', 'serviceArea', 'socialMedia', 'operatingHours']}
                        renderField={(key, val) => {
                            if (key === 'socialMedia') {
                                return (
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(val || {}).map(([k, v]) => (
                                            v ? <Badge key={k} variant="secondary" className="capitalize">{k}</Badge> : null
                                        ))}
                                    </div>
                                );
                            }
                            if (key === 'operatingHours') {
                                return (
                                    <div className="text-xs text-slate-500">
                                        {val.isOpen24x7 ? 'Open 24/7' : val.schedule ? 'Custom Schedule' : 'Not set'}
                                        {val.holidays?.length > 0 && <div className="mt-1">Holidays: {val.holidays.join(', ')}</div>}
                                    </div>
                                );
                            }
                            return val;
                        }}
                    />
                    <DataSection
                        title="Brand & Personality"
                        icon={MessageSquare}
                        enabled={sections.personality !== false}
                        data={accessibleData?.personality}
                        fields={['tagline', 'description', 'voiceTone', 'communicationStyle', 'languagePreference', 'uniqueSellingPoints', 'brandValues', 'foundedYear', 'responseTimeExpectation', 'escalationPreferences']}
                        renderField={(key, val) => {
                            if (key === 'escalationPreferences') {
                                return (
                                    <div className="text-xs text-slate-500">
                                        {val.escalateOnHumanRequest ? 'Escalates on request. ' : ''}
                                        {val.escalateOnComplaint ? 'Escalates on complaint.' : ''}
                                    </div>
                                );
                            }
                            return val;
                        }}
                    />
                    <DataSection
                        title="Products & Services"
                        icon={Package}
                        enabled={sections.knowledge !== false}
                        data={accessibleData?.knowledge}
                        fields={['productsOrServices', 'serviceCategories', 'pricingModel', 'pricingHighlights', 'acceptedPayments', 'policies', 'faqs', 'currentOffers', 'certifications', 'awards']}
                        renderField={(key, val) => {
                            if (key === 'productsOrServices' && Array.isArray(val)) {
                                return (
                                    <div className="flex flex-col gap-1">
                                        {val.slice(0, 5).map((p: any) => (
                                            <div key={p.name} className="flex justify-between text-xs">
                                                <span>{p.name}</span>
                                                <span className="text-slate-400">{p.priceRange}</span>
                                            </div>
                                        ))}
                                        {val.length > 5 && <div className="text-xs text-slate-400">+{val.length - 5} more</div>}
                                    </div>
                                );
                            }
                            if (key === 'policies' && typeof val === 'object') {
                                return (
                                    <div className="flex flex-wrap gap-1">
                                        {Object.keys(val || {}).filter(k => val[k]).map(k => (
                                            <Badge key={k} variant="outline" className="text-[10px]">{k.replace(/([A-Z])/g, ' $1').trim()}</Badge>
                                        ))}
                                    </div>
                                );
                            }
                            if (key === 'faqs' && Array.isArray(val)) return `${val.length} FAQs configured`;
                            if (Array.isArray(val)) return val.join(', ');
                            return val;
                        }}
                    />
                    <DataSection
                        title="Customer Profile"
                        icon={Users}
                        enabled={sections.customerProfile !== false}
                        data={accessibleData?.customerProfile}
                        fields={['targetAudience', 'customerDemographics', 'commonQueries', 'peakContactTimes', 'typicalJourneyStages', 'customerPainPoints', 'acquisitionChannels']}
                    />
                    <DataSection
                        title="Industry Specific Data"
                        icon={FileText}
                        enabled={sections.industrySpecificData !== false}
                        data={accessibleData?.industrySpecificData}
                        fields={accessibleData?.industrySpecificData ? Object.keys(accessibleData.industrySpecificData) : []}
                        renderField={(key, val) => {
                            if (Array.isArray(val)) return val.join(', ');
                            if (typeof val === 'object') return JSON.stringify(val);
                            return val;
                        }}
                    />
                    <DataSection
                        title="Other Data"
                        icon={FileText}
                        enabled={sections.otherUsefulData !== false}
                        data={{ items: accessibleData?.otherUsefulData || [] }}
                        fields={['items']}
                        renderField={(key, val) => {
                            if (!Array.isArray(val) || val.length === 0) return 'None';
                            return (
                                <div className="space-y-2 mt-1">
                                    {val.map((item: any, idx: number) => (
                                        <div key={idx} className="bg-slate-50 p-2 rounded text-xs border border-slate-100">
                                            <div className="font-medium text-slate-700">{item.key}</div>
                                            <div className="text-slate-500 line-clamp-2">{String(item.value)}</div>
                                        </div>
                                    ))}
                                </div>
                            );
                        }}
                    />
                </div>

                <div className="mt-8 text-center">
                    <Link href="/partner/settings">
                        <Button variant="outline" size="lg" className="gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Settings
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

function DataSection({ title, icon: Icon, enabled, data, fields, renderField }: {
    title: string;
    icon: React.ElementType;
    enabled: boolean;
    data: any;
    fields: string[];
    renderField?: (key: string, value: any) => React.ReactNode;
}) {
    return (
        <Card className={cn(
            "transition-all overflow-hidden",
            enabled ? "border-green-200" : "border-slate-200 bg-slate-50 opacity-60"
        )}>
            <CardHeader className="pb-2 bg-slate-50/50">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <div className={cn("p-1.5 rounded-lg", enabled ? "bg-green-100/50" : "bg-slate-100")}>
                            <Icon className={cn("w-4 h-4", enabled ? "text-green-700" : "text-slate-400")} />
                        </div>
                        {title}
                    </CardTitle>
                    <Badge variant="outline" className={cn(
                        "text-xs font-normal",
                        enabled ? "bg-green-50 text-green-700 border-green-200" : "text-slate-500"
                    )}>
                        {enabled ? <><Eye className="w-3 h-3 mr-1" />Visible</> : <><EyeOff className="w-3 h-3 mr-1" />Hidden</>}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-4">
                {enabled && data ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                        {fields.map(key => {
                            const val = data[key];
                            if (val === undefined || val === null || (Array.isArray(val) && val.length === 0) || val === '') return null;

                            const display = renderField ? renderField(key, val) : (
                                Array.isArray(val) ? val.join(', ') : String(val)
                            );

                            return (
                                <div key={key} className={cn(
                                    "flex flex-col gap-1 pb-2 border-b border-slate-50 last:border-0",
                                    // Make certain complex fields full width
                                    ['productsOrServices', 'items', 'operatingHours', 'policies'].includes(key) ? "md:col-span-2" : ""
                                )}>
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1')}</span>
                                    <span className="text-slate-700">{display}</span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-sm text-slate-400 italic flex items-center gap-2">
                        <EyeOff className="w-4 h-4" />
                        {enabled ? 'No data populated in this section' : 'This section is hidden from Core context'}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
