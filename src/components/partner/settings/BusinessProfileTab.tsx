import React, { useState, useEffect, useMemo } from 'react';
import {
    Building2, Phone, MapPin, Clock, ChevronDown, Edit3, Check, X, Plus,
    Sparkles, Search, Eye, Award, Target, Shield, Bot, Home, Receipt,
    HelpCircle, Trophy, ArrowRight, Cpu, Loader2, Trash2, Globe,
    Landmark, GraduationCap, Heart, Briefcase, ShoppingBag, UtensilsCrossed,
    ShoppingCart, Car, Plane, Building, PartyPopper, Wrench, MoreHorizontal,
    LucideIcon, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BusinessPersona } from '@/lib/business-persona-types';
import {
    getIndustries,
    getResolvedFunctions,
    searchFunctions,
    toSelectedCategories,
    findFunctionInfo,
    getCountriesForDropdown,
    CountryCode,
    Industry,
    ResolvedFunction,
    SelectedBusinessCategory,
} from '@/lib/business-taxonomy';
import { generateModulesFromCategories, type ModulesConfig } from '@/actions/module-generator-actions';
import { SchemaProfileRenderer } from '@/components/partner/settings/SchemaProfileRenderer';

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
    persona: Partial<BusinessPersona>;
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
    const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
    const [categorySearch, setCategorySearch] = useState('');

    // Multi-select state for business functions
    // Get currently selected categories from persona
    const selectedCategories: SelectedBusinessCategory[] =
        (persona.identity as any)?.businessCategories || [];
    const [pendingSelections, setPendingSelections] = useState<string[]>(
        selectedCategories.map(c => c.functionId)
    );

    // Check if user has selected at least one category
    const hasSelectedCategories = selectedCategories.length > 0;

    // Get industries and functions from new taxonomy
    const industries = getIndustries();

    // Get primary industry ID for schema sections
    const primaryIndustryId = useMemo(() => {
        if (selectedCategories.length > 0) {
            return selectedCategories[0].industryId;
        }
        // Fallback to persona industry category
        const category = (persona.identity as any)?.industry?.category;
        if (Array.isArray(category)) return category[0] || 'services';
        return category || 'services';
    }, [selectedCategories, persona.identity]);

    // Sync pending selections when modal opens
    useEffect(() => {
        if (showCategoryModal) {
            setPendingSelections(selectedCategories.map(c => c.functionId));
            setCategorySearch('');
        }
    }, [showCategoryModal]);

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
    const extraData = Object.entries(industryData).filter(([key]) => !knownKeys.includes(key));


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

                        {/* Schema-Driven Profile Sections */}
                        <SchemaProfileRenderer
                            persona={persona}
                            industryId={primaryIndustryId}
                            onUpdate={onUpdate}
                        />

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

            {/* Category Modal - Multi-Select with Country Localization */}
            {showCategoryModal && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-4 border-b border-slate-100 bg-slate-50">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">Select Business Categories</h3>
                                    <p className="text-xs text-slate-500">
                                        Choose one or more categories that describe your business
                                        {pendingSelections.length > 0 && (
                                            <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                                                {pendingSelections.length} selected
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <button onClick={() => setShowCategoryModal(false)} className="p-2 hover:bg-slate-200 rounded-full">
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>
                            {/* Country selector and Search */}
                            <div className="flex gap-3">
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <select
                                        value={selectedCountry}
                                        onChange={(e) => setSelectedCountry(e.target.value as CountryCode)}
                                        className="pl-10 pr-8 py-2 rounded-lg bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 appearance-none cursor-pointer"
                                    >
                                        {getCountriesForDropdown().map(c => (
                                            <option key={c.code} value={c.code}>
                                                {c.flag} {c.name}{c.hasOverrides ? ' ✦' : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search categories..."
                                        value={categorySearch}
                                        onChange={(e) => setCategorySearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    />
                                    {categorySearch && (
                                        <button
                                            onClick={() => setCategorySearch('')}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                        >
                                            <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                            {/* Left: Industries */}
                            <div className="w-full md:w-1/3 border-r border-slate-100 overflow-y-auto bg-slate-50/50 p-2">
                                {industries.map(industry => {
                                    // Count selected functions in this industry
                                    const functionsInIndustry = getResolvedFunctions(industry.industryId, selectedCountry);
                                    const selectedInIndustry = functionsInIndustry.filter(f =>
                                        pendingSelections.includes(f.functionId)
                                    ).length;

                                    const IconComponent = CATEGORY_ICONS[industry.iconName] || Building2;

                                    return (
                                        <button
                                            key={industry.industryId}
                                            onClick={() => setSelectedIndustry(industry.industryId)}
                                            className={cn(
                                                "w-full text-left px-3 py-3 rounded-xl text-sm font-medium transition-all mb-1.5 flex items-center justify-between",
                                                selectedIndustry === industry.industryId
                                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                                                    : "text-slate-700 hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100"
                                            )}
                                        >
                                            <span className="flex items-center gap-3">
                                                <span className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center",
                                                    selectedIndustry === industry.industryId
                                                        ? "bg-white/20"
                                                        : "bg-slate-100"
                                                )}>
                                                    <IconComponent className={cn(
                                                        "w-4 h-4",
                                                        selectedIndustry === industry.industryId
                                                            ? "text-white"
                                                            : "text-slate-500"
                                                    )} />
                                                </span>
                                                <span className="truncate">{industry.name}</span>
                                            </span>
                                            {selectedInIndustry > 0 && (
                                                <span className={cn(
                                                    "text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0",
                                                    selectedIndustry === industry.industryId
                                                        ? "bg-white/20 text-white"
                                                        : "bg-indigo-100 text-indigo-700"
                                                )}>
                                                    {selectedInIndustry}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Right: Business Functions with Checkboxes */}
                            <div className="w-full md:w-2/3 overflow-y-auto p-4 bg-white">
                                {(() => {
                                    // Get functions to display
                                    let functionsToShow: ResolvedFunction[] = [];

                                    if (categorySearch.trim()) {
                                        // Search across ALL functions
                                        functionsToShow = searchFunctions(categorySearch, selectedCountry);
                                    } else if (selectedIndustry) {
                                        // Show selected industry's functions
                                        functionsToShow = getResolvedFunctions(selectedIndustry, selectedCountry);
                                    }

                                    if (functionsToShow.length > 0) {
                                        return (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {functionsToShow.map((func) => {
                                                    const isSelected = pendingSelections.includes(func.functionId);

                                                    return (
                                                        <button
                                                            key={func.functionId}
                                                            onClick={() => {
                                                                if (isSelected) {
                                                                    setPendingSelections(prev => prev.filter(id => id !== func.functionId));
                                                                } else {
                                                                    setPendingSelections(prev => [...prev, func.functionId]);
                                                                }
                                                            }}
                                                            className={cn(
                                                                "text-left p-3 rounded-xl border transition-all flex items-center gap-3",
                                                                isSelected
                                                                    ? "border-indigo-500 bg-indigo-50"
                                                                    : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0",
                                                                isSelected
                                                                    ? "bg-indigo-600 border-indigo-600"
                                                                    : "border-slate-300"
                                                            )}>
                                                                {isSelected && <Check className="w-3 h-3 text-white" />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className={cn(
                                                                    "text-sm font-medium",
                                                                    isSelected ? "text-indigo-700" : "text-slate-700"
                                                                )}>
                                                                    {func.displayLabel}
                                                                    {func.isLocalized && (
                                                                        <span className="ml-1.5 text-xs text-indigo-400">✦</span>
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-slate-400 truncate">
                                                                    {categorySearch ? func.industryName : (func.isLocalized ? func.name : func.googlePlacesTypes[0])}
                                                                </div>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        );
                                    } else if (categorySearch) {
                                        return (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                                <Search className="w-12 h-12 mb-4 opacity-20" />
                                                <p>No categories found for "{categorySearch}"</p>
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                                <Building2 className="w-12 h-12 mb-4 opacity-20" />
                                                <p>Select an industry or search to see options</p>
                                            </div>
                                        );
                                    }
                                })()}
                            </div>
                        </div>

                        {/* Footer with Save Button */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                            <div className="text-sm text-slate-500">
                                {pendingSelections.length > 0 ? (
                                    <span>{pendingSelections.length} categor{pendingSelections.length === 1 ? 'y' : 'ies'} selected</span>
                                ) : (
                                    <span>Select at least one category</span>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCategoryModal(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        // Convert selected IDs to full category objects
                                        const categories = toSelectedCategories(pendingSelections, selectedCountry);

                                        // Save to persona
                                        await onUpdate('identity.businessCategories', categories);

                                        // Save the selected country
                                        await onUpdate('identity.country', selectedCountry);

                                        // Also update the primary industry based on first selection
                                        if (categories.length > 0) {
                                            const firstInfo = findFunctionInfo(categories[0].functionId, selectedCountry);
                                            if (firstInfo.function && firstInfo.industry) {
                                                await onUpdate('identity.industry', {
                                                    name: firstInfo.displayLabel,
                                                    category: firstInfo.industry.industryId
                                                });
                                            }

                                            // Auto-generate modules based on selected categories
                                            if (onModulesGenerated) {
                                                generateModulesFromCategories(categories, selectedCountry).then(result => {
                                                    if (result.success && result.config) {
                                                        onModulesGenerated(result.config);
                                                    }
                                                }).catch(console.error);
                                            }
                                        }

                                        setShowCategoryModal(false);
                                    }}
                                    disabled={pendingSelections.length === 0}
                                    className={cn(
                                        "px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors",
                                        pendingSelections.length > 0
                                            ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                            : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                    )}
                                >
                                    <Check className="w-4 h-4" />
                                    Save Categories
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
