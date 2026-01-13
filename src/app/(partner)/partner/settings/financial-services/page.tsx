'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    ArrowLeft, Landmark, Shield, Building2, CreditCard, PiggyBank,
    TrendingUp, FileText, Users, Loader2, Save, CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { getBusinessPersonaAction, saveBusinessPersonaAction } from '@/actions/business-persona-actions';
import type { BusinessPersona } from '@/lib/business-persona-types';

// Schema & Renderer
import { FINANCIAL_SERVICES_SCHEMA, getCategorySchema } from '@/lib/business-schemas';
import SchemaFieldRenderer from '@/components/partner/settings/SchemaFieldRenderer';

// Business functions for Financial Services
const FINANCIAL_FUNCTIONS = [
    { id: 'retail_banking', label: 'Retail Banking', icon: Landmark, description: 'Savings, current accounts, deposits' },
    { id: 'alternative_lending', label: 'NBFC / Alternative Lending', icon: Building2, description: 'Non-bank lending, microfinance' },
    { id: 'consumer_lending', label: 'Consumer Lending', icon: CreditCard, description: 'Personal loans, credit cards' },
    { id: 'commercial_lending', label: 'Commercial Lending', icon: Building2, description: 'Business loans, working capital' },
    { id: 'wealth_management', label: 'Wealth Management', icon: TrendingUp, description: 'Investments, PMS, mutual funds' },
    { id: 'insurance_brokerage', label: 'Insurance Brokerage', icon: Shield, description: 'Life, health, general insurance' },
    { id: 'accounting_tax', label: 'Accounting & Tax', icon: FileText, description: 'CA, tax filing, compliance' },
    { id: 'fintech', label: 'Fintech', icon: Landmark, description: 'Digital payments, neo-banks' },
];

export default function FinancialServicesDemo() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const partnerId = user?.customClaims?.partnerId;

    // State
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [persona, setPersona] = useState<Partial<BusinessPersona>>({});
    const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
    const [schemaData, setSchemaData] = useState<Record<string, any>>({});
    const [hasChanges, setHasChanges] = useState(false);
    const [isDemo, setIsDemo] = useState(false);

    // Load persona on mount - handle both authenticated and demo modes
    useEffect(() => {
        const loadPersona = async () => {
            // Wait for auth to finish loading
            if (authLoading) return;

            // If no partnerId, run in demo mode
            if (!partnerId) {
                setIsDemo(true);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const result = await getBusinessPersonaAction(partnerId);
                if (result.success && result.persona) {
                    setPersona(result.persona);

                    // Load existing financial services data
                    const financialData = result.persona.industrySpecificData?.financial_services;
                    if (financialData) {
                        setSchemaData(financialData);
                        // Set selected function from core_identity
                        const savedFunction = financialData.core_identity?.business_function;
                        if (savedFunction) {
                            setSelectedFunction(savedFunction);
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading persona:', error);
                toast.error('Failed to load profile');
            } finally {
                setLoading(false);
            }
        };

        loadPersona();
    }, [partnerId, authLoading]);

    // Handle field updates
    const handleUpdate = async (path: string, value: any) => {
        // Parse path like: industrySpecificData.financial_services.core_identity.business_function
        const keys = path.split('.');

        // Update local state
        setSchemaData(prev => {
            const newData = { ...prev };

            // Extract the section.field from the path
            // Path format: industrySpecificData.financial_services.sectionKey.fieldKey
            if (keys.length >= 4) {
                const sectionKey = keys[2];
                const fieldKey = keys[3];

                if (!newData[sectionKey]) {
                    newData[sectionKey] = {};
                }
                newData[sectionKey][fieldKey] = value;
            }

            return newData;
        });

        setHasChanges(true);
    };

    // Save all changes
    const handleSave = async () => {
        // In demo mode, just show a message
        if (isDemo) {
            toast.info('Demo mode: Changes are not persisted. Sign in to save.');
            setHasChanges(false);
            return;
        }

        if (!partnerId) return;

        setSaving(true);
        try {
            // Build update object
            const updateData = {
                industrySpecificData: {
                    ...persona.industrySpecificData,
                    financial_services: schemaData,
                },
                identity: {
                    ...persona.identity,
                    industry: {
                        category: 'financial_services',
                        name: 'Financial Services',
                    },
                },
            };

            await saveBusinessPersonaAction(partnerId, updateData as Partial<BusinessPersona>);
            setHasChanges(false);
            toast.success('Profile saved successfully!');
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    // Handle function selection
    const handleSelectFunction = (funcId: string) => {
        setSelectedFunction(funcId);
        handleUpdate('industrySpecificData.financial_services.core_identity.business_function', funcId);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
                    <p className="text-slate-500">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push('/partner/settings')}
                            className="p-2 hover:bg-slate-100 rounded-lg"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                            <Landmark className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-slate-900">Financial Services Profile</h1>
                            <p className="text-xs text-slate-500">Configure your financial services business</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {hasChanges && (
                            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                                Unsaved changes
                            </span>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={saving || !hasChanges}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm",
                                hasChanges
                                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                            )}
                        >
                            {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            Save Profile
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto py-8 px-4">
                {/* Step 1: Select Business Function */}
                {!selectedFunction ? (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">What type of financial service do you provide?</h2>
                            <p className="text-slate-500">Select the option that best describes your business</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {FINANCIAL_FUNCTIONS.map((func) => {
                                const Icon = func.icon;
                                return (
                                    <button
                                        key={func.id}
                                        onClick={() => handleSelectFunction(func.id)}
                                        className="group p-6 bg-white rounded-2xl border-2 border-slate-200 hover:border-indigo-500 transition-all text-left hover:shadow-lg"
                                    >
                                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
                                            <Icon className="w-6 h-6 text-indigo-600" />
                                        </div>
                                        <h3 className="font-semibold text-slate-900 mb-1">{func.label}</h3>
                                        <p className="text-sm text-slate-500">{func.description}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Selected Function Badge */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full">
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                                <span className="text-sm font-medium text-emerald-700">
                                    {FINANCIAL_FUNCTIONS.find(f => f.id === selectedFunction)?.label}
                                </span>
                            </div>
                            <button
                                onClick={() => setSelectedFunction(null)}
                                className="text-sm text-slate-500 hover:text-slate-700 underline"
                            >
                                Change
                            </button>
                        </div>

                        {/* Schema-Driven Form */}
                        <SchemaFieldRenderer
                            schema={FINANCIAL_SERVICES_SCHEMA}
                            data={schemaData}
                            onUpdate={handleUpdate}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
