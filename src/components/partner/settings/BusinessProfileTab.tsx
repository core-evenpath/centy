import React, { useState, useEffect, useMemo } from 'react';
import {
    Building2, Phone, MapPin, Clock, ChevronDown, Edit3, Check, X, Plus,
    Sparkles, Search, Eye, Award, Target, Shield, Bot, Home, Receipt,
    HelpCircle, Trophy, ArrowRight, Cpu, Loader2, Trash2, Globe,
    Landmark, GraduationCap, Heart, Briefcase, ShoppingBag, UtensilsCrossed,
    ShoppingCart, Car, Plane, Building, PartyPopper, Wrench, MoreHorizontal,
    LucideIcon, Zap, FileQuestion, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BusinessPersona } from '@/lib/business-persona-types';
import {
    getCountriesForDropdown,
    type CountryCode,
} from '@/lib/business-taxonomy';
import { BusinessCategoriesModal } from './BusinessCategoriesModal';
import { findFunctionInfoAction } from '@/actions/taxonomy-actions';
import { type SelectedBusinessCategory } from '@/hooks/use-taxonomy';
import { generateModulesFromCategories, type ModulesConfig } from '@/actions/module-generator-actions';
import { CoreVisibilityPanel } from './CoreVisibilityPanel';
import { OtherUsefulDataAccordion } from './OtherUsefulDataAccordion';
import { PublishedStatusBanner } from './PublishedStatusBanner';

// Icon mapping for category icons
const CATEGORY_ICONS: Record<string, LucideIcon> = {
    Landmark,
    GraduationCap,
    Heart,
    Briefcase,
    ShoppingBag,
    UtensilsCrossed,
    ShoppingCart,
    Sparkles,
    Car,
    Plane,
    Building,
    PartyPopper,
    Wrench,
    MoreHorizontal,
};


interface BusinessProfileTabProps {
    partnerId: string;
    persona: BusinessPersona; // More strict type for better intellisense
    onUpdate: (path: string, value: any) => Promise<void>;
    // Auto-fill props
    autoFillSearch: string;
    onSearchChange: (query: string) => void;
    autoFillResults: any[];
    onSelectPlace: (place: any) => void;
    selectedPlace: any | null;
    onAutoFill: () => Promise<void>;
    isAutoFilling: boolean;
    onClearProfile: () => Promise<void>;
    onPreviewAI?: () => void;
    onProcessAI?: () => Promise<void>;
    // Module generation callback
    onModulesGenerated?: (config: ModulesConfig) => Promise<void>;
}

function ProgressRing({ value }: { value: number }) {
    const radius = 54;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;
    const color = value >= 80 ? '#10b981' : value >= 50 ? '#f59e0b' : '#ef4444';

    return (
        <div className="relative w-32 h-32">
            <svg width="128" height="128" className="-rotate-90">
                <circle cx="64" cy="64" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />
                <circle cx="64" cy="64" r={radius} fill="none" stroke={color} strokeWidth="10"
                    strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-slate-900">{Math.round(value)}%</span>
                <span className="text-xs text-slate-500">Complete</span>
            </div>
        </div>
    );
}

function Section({ title, icon: Icon, iconBg, children, defaultOpen = false }: any) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <button onClick={() => setOpen(!open)} className="w-full p-5 flex items-center gap-4 text-left hover:bg-slate-50">
                <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 text-lg">{title}</h3>
                </div>
                <ChevronDown className={`w-6 h-6 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && <div className="p-5 pt-0 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200"><div className="pt-5">{children}</div></div>}
        </div>
    );
}

function Field({ label, value, badge, onSave, multiline = false, placeholder = "Click to add..." }: any) {
    const [editing, setEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value || '');

    useEffect(() => {
        setCurrentValue(value || '');
    }, [value]);

    const handleSave = () => {
        if (currentValue !== value) {
            onSave(currentValue);
        }
        setEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && !multiline) {
            e.preventDefault();
            handleSave();
        }
        if (e.key === 'Escape') {
            setCurrentValue(value || '');
            setEditing(false);
        }
    };

    return (
        <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
                {badge && <span className="px-1.5 py-0.5 text-[10px] font-medium bg-emerald-100 text-emerald-700 rounded">{badge}</span>}
            </div>
            {editing ? (
                <div className="flex gap-2 items-start">
                    {multiline ? (
                        <textarea
                            value={currentValue}
                            onChange={(e) => setCurrentValue(e.target.value)}
                            className="flex-1 px-3 py-2 border border-indigo-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                            autoFocus
                            onKeyDown={handleKeyDown}
                        />
                    ) : (
                        <input
                            value={currentValue}
                            onChange={(e) => setCurrentValue(e.target.value)}
                            className="flex-1 px-3 py-2 border border-indigo-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            autoFocus
                            onKeyDown={handleKeyDown}
                        />
                    )}
                    <button onClick={handleSave} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"><Check className="w-4 h-4" /></button>
                    <button onClick={() => { setCurrentValue(value || ''); setEditing(false); }} className="p-2 bg-slate-200 rounded-lg hover:bg-slate-300"><X className="w-4 h-4" /></button>
                </div>
            ) : (
                <div onClick={() => setEditing(true)} className="px-3 py-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 flex items-center justify-between group min-h-[38px]">
                    <span className={`text-sm whitespace-pre-wrap ${currentValue ? 'text-slate-700' : 'text-slate-400 italic'}`}>{currentValue || placeholder}</span>
                    <Edit3 className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 flex-shrink-0 ml-2" />
                </div>
            )}
        </div>
    );
}

function Tags({ items = [], onAdd, onRemove, color = 'slate' }: any) {
    const colors: Record<string, string> = {
        slate: 'bg-slate-100 text-slate-700',
        indigo: 'bg-indigo-50 text-indigo-700',
        emerald: 'bg-emerald-50 text-emerald-700',
        amber: 'bg-amber-50 text-amber-700'
    };

    const [isAdding, setIsAdding] = useState(false);
    const [newValue, setNewValue] = useState('');

    const handleAddKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (newValue.trim()) {
                onAdd(newValue.trim());
                setNewValue('');
                setIsAdding(false);
            }
        }
        if (e.key === 'Escape') {
            setNewValue('');
            setIsAdding(false);
        }
    };

    return (
        <div className="flex flex-wrap gap-2">
            {(Array.isArray(items) ? items : []).map((item: string, i: number) => (
                <span key={i} className={`px-3 py-1 text-sm font-medium rounded-lg ${colors[color]} flex items-center gap-1.5`}>
                    {item}
                    <button onClick={() => onRemove(i)} className="hover:bg-black/10 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                </span>
            ))}

            {isAdding ? (
                <div className="flex items-center gap-1">
                    <input
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        onKeyDown={handleAddKey}
                        onBlur={() => { if (newValue.trim()) onAdd(newValue.trim()); setNewValue(''); setIsAdding(false); }}
                        className="w-24 px-2 py-1 text-sm border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        autoFocus
                        placeholder="Add..."
                    />
                </div>
            ) : (
                <button onClick={() => setIsAdding(true)} className="px-3 py-1 text-sm text-slate-500 hover:bg-slate-100 rounded-lg border border-dashed border-slate-300 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add
                </button>
            )}
        </div>
    );
}

export default function BusinessProfileTab({
    partnerId,
    persona,
    onUpdate,
    autoFillSearch,
    onSearchChange,
    autoFillResults,
    onSelectPlace,
    selectedPlace,
    onAutoFill,
    isAutoFilling,
    onClearProfile,
    onPreviewAI,
    onProcessAI,
    onModulesGenerated
}: BusinessProfileTabProps) {

    // -- Data Mapping --

    // Country selection for localized labels
    const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
        (persona.identity as any)?.country || 'GLOBAL'
    );

    // UI State for editing
    const [showCategoryModal, setShowCategoryModal] = useState(false);

    // Get currently selected categories from persona
    const selectedCategories: SelectedBusinessCategory[] =
        (persona.identity as any)?.businessCategories || [];

    // Check if user has selected at least one category
    const hasSelectedCategories = selectedCategories.length > 0;

    const handleSaveCategories = async (categories: SelectedBusinessCategory[], country: CountryCode) => {
        // Save to persona
        await onUpdate('identity.businessCategories', categories);
        await onUpdate('identity.country', country);

        // Update primary industry
        if (categories.length > 0) {
            const firstInfo = await findFunctionInfoAction(categories[0].functionId, country);
            if (firstInfo.success && firstInfo.data?.function && firstInfo.data?.industry) {
                await onUpdate('identity.industry', {
                    name: firstInfo.data.displayLabel,
                    category: firstInfo.data.industry.industryId
                });
            }

            // Generate modules
            if (onModulesGenerated) {
                try {
                    const result = await generateModulesFromCategories(categories, country);
                    if (result.success && result.config) {
                        await onModulesGenerated(result.config);
                    }
                } catch (error) {
                    console.error('Error generating modules:', error);
                }
            }
        }
    };

    // Helper to safely get nested values
    const get = (path: string, def: any = '') => {
        const keys = path.split('.');
        let current: any = persona;
        for (const key of keys) {
            if (current === undefined || current === null) return def;
            current = current[key];
        }
        return current !== undefined && current !== null ? current : def;
    };

    // 1. Brand Identity
    const name = get('identity.name');
    const tagline = get('personality.tagline');
    const description = get('personality.description');
    const foundedYear = get('personality.foundedYear') || get('identity.foundedYear'); // Handle location logic later
    // Registrations (Generic support)
    const registrations = get('industrySpecificData.registrations', []);
    const reraNumber = typeof registrations === 'string' ? registrations :
        (registrations.find((r: any) => r.type === 'RERA')?.number || get('industrySpecificData.reraNumber'));
    const teamSize = get('industrySpecificData.teamSize') || get('companySize');

    // 2. Expertise
    // Property Types (Real Estate specific but could map to Products/Services categories)
    const propertyTypes = get('roomTypes') || get('propertyTypes') || get('industrySpecificData.propertyTypes') || [];
    // Generic products/services if above is empty
    const productsOrServices = get('knowledge.productsOrServices', []);

    const transactionTypes = get('industrySpecificData.transactionTypes', []);
    const targetAudience = get('customerProfile.targetAudience'); // string
    const clientTypes = get('customerProfile.customerDemographics', []); // array

    // Pricing
    const pricingHighlights = get('knowledge.pricingHighlights');
    // For Real Estate, pricing might be structured. For others, it's a string.
    // We'll treat pricingHighlights as the main "Price Range" display if it's a string

    const specializations = get('personality.uniqueSellingPoints', []);

    // 3. Coverage
    const city = get('identity.address.city');
    const serviceLocalities = get('industrySpecificData.serviceLocalities') || get('industrySpecificData.keyLocalities') || [];
    const addressStr = [
        get('identity.address.street'),
        get('identity.address.area'),
        get('identity.address.city'),
        get('identity.address.state'),
        get('identity.address.postalCode')
    ].filter(Boolean).join(', ');

    // 4. Contact
    const phone = get('identity.phone');
    const email = get('identity.email');
    const website = get('identity.website');
    const whatsapp = get('identity.whatsAppNumber');
    const social = get('identity.socialMedia', {});

    // 5. Hours
    const operatingHours = get('identity.operatingHours', {});
    const responseTime = get('personality.responseTimeExpectation');

    // 6. Credentials
    const awards = get('knowledge.awards', []);
    // mapped registrations above

    // 7. FAQs
    const faqs = get('knowledge.faqs', []);

    // 8. AI
    const aiPreferences = get('personality.aiPreferences', {}); // New nested object if needed, or map flat
    // We'll stick to 'personality' fields
    const voiceTone = get('personality.voiceTone', []);
    const greeting = get('personality.customGreeting') || get('personality.greetingStyle');
    const escalation = get('personality.escalationPreferences.escalationKeywords', []);
    const escalationPrefs = get('personality.escalationPreferences', {});

    // Score
    const score = get('setupProgress.overallPercentage', 0);

    // -- Handlers --

    const handleWrapper = (path: string) => async (val: any) => {
        await onUpdate(path, val);
    };

    const handleTagsAdd = (path: string, current: string[]) => async (newTag: string) => {
        await onUpdate(path, [...current, newTag]);
    };

    const handleTagsRemove = (path: string, current: string[]) => async (index: number) => {
        const next = [...current];
        next.splice(index, 1);
        await onUpdate(path, next);
    };

    // "Unmapped" or "Extra" Data Logic
    // We want to show industrySpecificData that we didn't explicitly render
    const industryData = get('industrySpecificData', {});
    const knownKeys = ['registrations', 'reraNumber', 'teamSize', 'propertyTypes', 'transactionTypes', 'serviceLocalities', 'keyLocalities'];
    const extraIndustryData = Object.entries(industryData).filter(([key]) => !knownKeys.includes(key));

    // Unmapped data from imports (webIntelligence.otherUsefulData)
    const webIntelligence = get('webIntelligence', {});
    const otherUsefulData: { key: string; value: string; source?: string }[] = webIntelligence.otherUsefulData || [];

    // Combine all unmapped data for display
    const hasUnmappedData = extraIndustryData.length > 0 || otherUsefulData.length > 0;


    return (
        <div className="min-h-screen bg-slate-100">
            <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-16">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Business Profile</h1>
                        <p className="text-xs text-slate-500">Powers AI conversations & customer interactions</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {onPreviewAI && (
                            <button onClick={onPreviewAI} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm flex items-center gap-2">
                                <Eye className="w-4 h-4" /> Preview AI
                            </button>
                        )}
                        {onProcessAI ? (
                            <button onClick={onProcessAI} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-indigo-700">
                                <Cpu className="w-4 h-4" /> Process for AI
                            </button>
                        ) : (
                            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 cursor-default">
                                <Cpu className="w-4 h-4" /> Connected to AI
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8">

                {/* Header Card */}
                <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 rounded-3xl p-8 mb-8 text-white relative overflow-hidden shadow-lg">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative flex flex-col md:flex-row items-start gap-8">
                        <div className="flex-1 w-full">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-3xl font-bold text-indigo-600 shadow-xl">
                                    {name?.[0] || 'B'}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">{name || 'Your Business Name'}</h2>
                                    <p className="text-indigo-200">{tagline || 'Add a tagline to describe your business'}</p>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        {/* Display selected categories as chips */}
                                        {selectedCategories.length > 0 ? (
                                            <>
                                                {selectedCategories.slice(0, 3).map(cat => (
                                                    <span
                                                        key={cat.functionId}
                                                        className="px-2 py-0.5 bg-white/20 rounded text-xs font-medium"
                                                    >
                                                        {cat.label}
                                                    </span>
                                                ))}
                                                {selectedCategories.length > 3 && (
                                                    <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-medium">
                                                        +{selectedCategories.length - 3} more
                                                    </span>
                                                )}
                                            </>
                                        ) : null}
                                        <button
                                            onClick={() => setShowCategoryModal(true)}
                                            className="px-2 py-0.5 bg-white/20 hover:bg-white/30 transition-colors rounded text-xs font-medium flex items-center gap-1"
                                        >
                                            {selectedCategories.length > 0 ? (
                                                <><Edit3 className="w-3 h-3" /> Edit</>
                                            ) : (
                                                <><Plus className="w-3 h-3" /> Select Categories</>
                                            )}
                                        </button>
                                        {reraNumber && (
                                            <span className="px-2 py-0.5 bg-emerald-500/30 text-emerald-200 rounded text-xs font-medium flex items-center gap-1">
                                                <Shield className="w-3 h-3" /> {reraNumber}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Highlight Stats (Dynamic if possible, else placeholder) */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                                <div className="bg-white/10 rounded-xl p-3 backdrop-blur">
                                    <div className="text-2xl font-bold">{productsOrServices?.length || 0}</div>
                                    <div className="text-xs text-indigo-200">Services/Products</div>
                                </div>
                                <div className="bg-white/10 rounded-xl p-3 backdrop-blur">
                                    <div className="text-2xl font-bold">{faqs?.length || 0}</div>
                                    <div className="text-xs text-indigo-200">FAQs</div>
                                </div>

                            </div>
                        </div>

                        <div className="text-center w-full md:w-auto flex flex-col items-center">
                            <ProgressRing value={score} />
                            <div className="mt-3 text-xs text-indigo-200 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> {score < 100 ? 'Complete Profile' : 'AI Ready'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Visibility Control Panel */}
                <div className="mb-8">
                    {/* Published Status Banner */}
                    <div className="mb-6">
                        <PublishedStatusBanner partnerId={partnerId} persona={persona} />
                    </div>

                    <CoreVisibilityPanel partnerId={partnerId} persona={persona} />
                </div>

                {/* Show rest of UI only when categories are selected */}
                {hasSelectedCategories ? (
                    <>
                        {/* Auto-Fill Bar */}
                        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 relative shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Search className="w-5 h-5 text-slate-500" />
                                </div>

                                <div className="flex-1 relative">
                                    {selectedPlace ? (
                                        <div className="flex items-center justify-between px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-lg">
                                            <div>
                                                <div className="font-medium text-indigo-900">{selectedPlace.mainText}</div>
                                                <div className="text-xs text-indigo-600">{selectedPlace.secondaryText}</div>
                                            </div>
                                            <button onClick={() => onSelectPlace(null)} className="p-1 hover:bg-indigo-100 rounded">
                                                <X className="w-4 h-4 text-indigo-500" />
                                            </button>
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            value={autoFillSearch}
                                            onChange={e => onSearchChange(e.target.value)}
                                            placeholder="Search your business on Google..."
                                            className="w-full px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                        />
                                    )}
                                    {autoFillResults.length > 0 && !selectedPlace && (
                                        <div className="absolute z-20 top-12 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl max-h-80 overflow-y-auto">
                                            {autoFillResults.map(r => (
                                                <button
                                                    key={r.placeId}
                                                    onClick={() => onSelectPlace(r)}
                                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                                                >
                                                    <div className="font-medium text-slate-900">{r.mainText}</div>
                                                    <div className="text-xs text-slate-500">{r.secondaryText}</div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={onAutoFill}
                                    disabled={isAutoFilling || !selectedPlace}
                                    className={cn(
                                        "px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 whitespace-nowrap",
                                        selectedPlace ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200" : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                    )}
                                >
                                    {isAutoFilling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    Auto-Fill
                                </button>

                                <button
                                    onClick={onClearProfile}
                                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Clear
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">

                            {/* 1. Brand Identity */}
                            <Section title="Brand Identity" icon={Building2} iconBg="bg-indigo-500" defaultOpen={true}>
                                <div className="grid lg:grid-cols-2 gap-6">
                                    <div>
                                        <Field label="Business Name" value={name} onSave={handleWrapper('identity.name')} badge="Public" />
                                        <Field label="Tagline" value={tagline} onSave={handleWrapper('personality.tagline')} />

                                        <div className="grid grid-cols-2 gap-4">
                                            <Field label="Established" value={foundedYear} onSave={handleWrapper('personality.foundedYear')} placeholder="Year" />
                                            {/* If team size is available, or allow adding it */}
                                            <Field label="Team Size" value={teamSize} onSave={handleWrapper('industrySpecificData.teamSize')} placeholder="Count" />
                                        </div>
                                        {reraNumber && (
                                            <Field label="RERA / Reg Number" value={reraNumber} onSave={handleWrapper('industrySpecificData.reraNumber')} badge="Verified" />
                                        )}
                                    </div>
                                    <div>
                                        <Field
                                            label="About / Elevator Pitch"
                                            value={description}
                                            onSave={handleWrapper('personality.description')}
                                            multiline={true}
                                        />
                                        <div className="p-4 bg-violet-50 rounded-xl border border-violet-200 mt-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Bot className="w-4 h-4 text-violet-600" />
                                                <span className="text-sm font-medium text-violet-900">AI Context</span>
                                            </div>
                                            <p className="text-xs text-violet-700">
                                                {description || "Add a description to give the AI context about your business."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Section>

                            {/* 2. Expertise & Specializations */}
                            <Section title="Expertise & Specializations" icon={Target} iconBg="bg-emerald-500">
                                <div className="space-y-6">
                                    {propertyTypes.length > 0 ? (
                                        <div>
                                            <label className="text-xs font-medium text-slate-500 uppercase mb-3 block">Property Types / Inventory</label>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                                {/* This assumes propertyTypes is array of objects or strings. We handle both */}
                                                {propertyTypes.map((t: any, i: number) => {
                                                    const tName = typeof t === 'string' ? t : t.name;
                                                    return (
                                                        <div key={i} className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-center">
                                                            <Home className="w-5 h-5 mx-auto mb-2 text-slate-400" />
                                                            <div className="text-sm font-medium text-slate-600">{tName}</div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ) : productsOrServices.length > 0 && (
                                        <div>
                                            <label className="text-xs font-medium text-slate-500 uppercase mb-3 block">Products & Services</label>
                                            <Tags items={productsOrServices.map((p: any) => typeof p === 'string' ? p : p.name)}
                                                onAdd={(val: string) => handleTagsAdd('knowledge.productsOrServices', productsOrServices.map((p: any) => typeof p === 'string' ? p : p.name))(val)}
                                                onRemove={(i: number) => handleTagsRemove('knowledge.productsOrServices', productsOrServices.map((p: any) => typeof p === 'string' ? p : p.name))(i)}
                                                color="emerald" />
                                        </div>
                                    )}

                                    <div className="grid lg:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-xs font-medium text-slate-500 uppercase mb-2 block">Transaction Types / Categories</label>
                                            <Tags items={transactionTypes} onAdd={handleTagsAdd('industrySpecificData.transactionTypes', transactionTypes)} onRemove={handleTagsRemove('industrySpecificData.transactionTypes', transactionTypes)} color="indigo" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-500 uppercase mb-2 block">Client Types</label>
                                            <Tags items={clientTypes} onAdd={handleTagsAdd('customerProfile.customerDemographics', clientTypes)} onRemove={handleTagsRemove('customerProfile.customerDemographics', clientTypes)} color="emerald" />
                                        </div>
                                    </div>

                                    <div className="grid lg:grid-cols-2 gap-6">
                                        <div>
                                            <Field label="Pricing / Fee Structure" value={pricingHighlights} onSave={handleWrapper('knowledge.pricingHighlights')} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-500 uppercase mb-2 block">Specializations / USPs</label>
                                            <Tags items={specializations} onAdd={handleTagsAdd('personality.uniqueSellingPoints', specializations)} onRemove={handleTagsRemove('personality.uniqueSellingPoints', specializations)} color="amber" />
                                        </div>
                                    </div>
                                </div>
                            </Section>

                            {/* 3. Coverage Areas */}
                            <Section title="Coverage Areas" icon={MapPin} iconBg="bg-rose-500">
                                <div className="space-y-6">
                                    <Field label="Primary City" value={city} onSave={handleWrapper('identity.address.city')} />
                                    <div>
                                        <label className="text-xs font-medium text-slate-500 uppercase mb-3 block">Localities / Service Areas</label>
                                        {/* We map this to Tags because editing structure is complex. */}
                                        <Tags items={serviceLocalities} onAdd={handleTagsAdd('industrySpecificData.serviceLocalities', serviceLocalities)} onRemove={handleTagsRemove('industrySpecificData.serviceLocalities', serviceLocalities)} />
                                    </div>
                                    <Field label="Office Address" value={addressStr} onSave={handleWrapper('identity.address.street')} />
                                </div>
                            </Section>

                            {/* 4. Contact Channels */}
                            <Section title="Contact Channels" icon={Phone} iconBg="bg-blue-500">
                                <div className="grid lg:grid-cols-2 gap-6">
                                    <div>
                                        <Field label="Phone (Main)" value={phone} onSave={handleWrapper('identity.phone')} />
                                        <Field label="WhatsApp" value={whatsapp} onSave={handleWrapper('identity.whatsAppNumber')} badge="Preferred" />
                                    </div>
                                    <div>
                                        <Field label="Email" value={email} onSave={handleWrapper('identity.email')} />
                                        <Field label="Website" value={website} onSave={handleWrapper('identity.website')} />
                                        <div className="mt-4">
                                            <label className="text-xs font-medium text-slate-500 uppercase mb-2 block">Social Media</label>
                                            <div className="space-y-2">
                                                <Field label="Instagram" value={social?.instagram} onSave={handleWrapper('identity.socialMedia.instagram')} placeholder="@username" />
                                                <Field label="LinkedIn" value={social?.linkedin} onSave={handleWrapper('identity.socialMedia.linkedin')} placeholder="Profile URL" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Section>

                            {/* 5. Operating Hours */}
                            <Section title="Operating Hours" icon={Clock} iconBg="bg-amber-500">
                                <div className="grid lg:grid-cols-2 gap-6">
                                    <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="font-semibold text-slate-700">Schedule</span>
                                            <span className="text-xs text-slate-500">
                                                {operatingHours.isOpen24x7 ? 'Open 24/7' : 'Custom Hours'}
                                            </span>
                                        </div>
                                        {/* Only showing simple unified string for now as complex schedule editor is large */}
                                        <Field label="General Availability" value={operatingHours.specialNote} onSave={handleWrapper('identity.operatingHours.specialNote')} placeholder="e.g. Mon-Fri 9AM-6PM" />
                                    </div>
                                    <div>
                                        <Field label="Typical Response Time" value={responseTime} onSave={handleWrapper('personality.responseTimeExpectation')} />
                                    </div>
                                </div>
                            </Section>

                            {/* 6. Credentials */}
                            <Section title="Credentials & Trust" icon={Award} iconBg="bg-orange-500">
                                <div className="grid lg:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-medium text-slate-500 uppercase mb-3 block">Registrations</label>
                                        {/* Simplified list editor needed? Uses Tags for now if array of strings, or just render */}
                                        <Tags
                                            items={Array.isArray(registrations) ? registrations.map((r: any) => typeof r === 'string' ? r : `${r.type}: ${r.number}`) : []}
                                            onAdd={(val: string) => { /* Complex obj handling omitted for brevity */ }}
                                            onRemove={() => { }}
                                            color="emerald"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-500 uppercase mb-3 block">Awards</label>
                                        <Tags items={awards} onAdd={handleTagsAdd('knowledge.awards', awards)} onRemove={handleTagsRemove('knowledge.awards', awards)} color="amber" />
                                    </div>
                                </div>
                            </Section>

                            {/* 7. FAQs */}
                            <Section title="FAQs" icon={HelpCircle} iconBg="bg-pink-500">
                                <div className="space-y-3">
                                    {faqs.map((faq: any, i: number) => (
                                        <div key={i} className="p-4 bg-slate-50 rounded-xl">
                                            <div className="flex items-start gap-3">
                                                <div className="w-6 h-6 bg-pink-100 rounded flex items-center justify-center text-xs font-bold text-pink-600">{i + 1}</div>
                                                <div className="flex-1">
                                                    <div className="font-medium text-slate-900 mb-1">{faq.question}</div>
                                                    <div className="text-sm text-slate-600">{faq.answer}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex gap-2 mt-4 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-slate-500 justify-center">
                                        Use "Process for AI" or Chat to generate FAQs automatically.
                                    </div>
                                </div>
                            </Section>

                            {/* 8. Unmapped Information - Data imported but not mapped to standard fields */}
                            {hasUnmappedData && (
                                <Section title="Unmapped Information" icon={FileQuestion} iconBg="bg-slate-500">
                                    <div className="space-y-4">
                                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 mb-4">
                                            <p className="text-sm text-amber-800">
                                                This data was imported but couldn't be automatically mapped to standard fields.
                                                The AI assistant can still use this information when helping customers.
                                            </p>
                                        </div>

                                        {/* Imported data from webIntelligence.otherUsefulData */}
                                        {otherUsefulData.length > 0 && (
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide">Imported Data</h4>
                                                {otherUsefulData.map((item, index) => (
                                                    <div key={`imported-${index}`} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="font-medium text-slate-700 text-sm">{item.key}</span>
                                                                    {item.source && (
                                                                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-200 text-slate-600 rounded capitalize">
                                                                            {item.source}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-slate-600 whitespace-pre-wrap break-words">
                                                                    {typeof item.value === 'string'
                                                                        ? item.value
                                                                        : JSON.stringify(item.value, null, 2)}
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={async () => {
                                                                    const updated = otherUsefulData.filter((_, i) => i !== index);
                                                                    await onUpdate('webIntelligence.otherUsefulData', updated);
                                                                }}
                                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                                                title="Remove this item"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* New Managed Other Data */}
                                        <div className="mt-6">
                                            <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Custom & Unmapped Data</h4>
                                            <OtherUsefulDataAccordion
                                                partnerId={partnerId}
                                                items={persona.otherUsefulData || []}
                                            />
                                        </div>

                                        {/* Extra industry-specific data */}
                                        {extraIndustryData.length > 0 && (
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mt-4">Additional Industry Data</h4>
                                                {extraIndustryData.map(([key, value]) => (
                                                    <div key={`industry-${key}`} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1 min-w-0">
                                                                <span className="font-medium text-slate-700 text-sm mb-1 block">
                                                                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                                                                </span>
                                                                <p className="text-sm text-slate-600 whitespace-pre-wrap break-words">
                                                                    {typeof value === 'string'
                                                                        ? value
                                                                        : Array.isArray(value)
                                                                            ? value.join(', ')
                                                                            : JSON.stringify(value, null, 2)}
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={async () => {
                                                                    await onUpdate(`industrySpecificData.${key}`, null);
                                                                }}
                                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                                                title="Remove this item"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Empty state - this shouldn't show since we check hasUnmappedData */}
                                        {otherUsefulData.length === 0 && extraIndustryData.length === 0 && (
                                            <div className="text-center py-6 text-slate-400">
                                                No unmapped data available.
                                            </div>
                                        )}
                                    </div>
                                </Section>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 p-8 mb-6 text-center shadow-sm">
                        <div className="flex flex-col items-center justify-center text-slate-500">
                            <Building2 className="w-12 h-12 mb-4 text-indigo-400" />
                            <p className="text-lg font-semibold mb-2 text-slate-700">Select your business categories to unlock profile editing</p>
                            <p className="text-sm mb-4">This helps us tailor the profile fields and AI suggestions to your industry.</p>
                            <button
                                onClick={() => setShowCategoryModal(true)}
                                className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-indigo-700"
                            >
                                <Plus className="w-4 h-4" />
                                Select Categories
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Category Modal */}
            <BusinessCategoriesModal
                isOpen={showCategoryModal}
                onClose={() => setShowCategoryModal(false)}
                onSave={handleSaveCategories}
                initialSelections={selectedCategories.map(c => c.functionId)}
                initialCountry={selectedCountry}
            />
        </div>
    );
}
