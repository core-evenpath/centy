// src/components/partner/settings/BusinessPersonaBuilder.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Building2,
    Phone,
    Mail,
    MapPin,
    Clock,
    MessageSquare,
    Globe,
    Sparkles,
    ChevronRight,
    ChevronLeft,
    Check,
    Plus,
    Trash2,
    Lightbulb,
    Save,
    AlertCircle,
    RefreshCw,
    Zap,
    ExternalLink,
    HelpCircle,
    Package,
    FileText,
    Users,
    Target,
    Instagram,
    Facebook,
    Linkedin,
    Youtube,
    Twitter,
    CreditCard,
    Languages,
    Star,
    Copy,
    Wand2,
    ArrowRight,
    CheckCircle2,
    Timer,
    Heart,
    Shield,
    Award,
    Smile,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    getBusinessPersonaAction,
    saveBusinessPersonaAction,
    generateAISuggestionsAction,
} from '@/actions/business-persona-actions';
import {
    BusinessPersona,
    BusinessIdentity,
    BusinessPersonality,
    SetupProgress,
    INDUSTRY_PRESETS,
    IndustryCategory,
    ProductService,
    FrequentlyAskedQuestion,
    DaySchedule,
    VoiceTone,
    SUPPORTED_REGIONS,
    getPaymentMethodsForRegion,
    SUPPORTED_LANGUAGES,
    COMMON_PAYMENT_METHODS,
    SUPPORTED_CURRENCIES,
    getCurrencySymbol,
} from '@/lib/business-persona-types';

interface BusinessPersonaBuilderProps {
    partnerId: string;
    onComplete?: () => void;
    mode?: 'onboarding' | 'settings';
}

// Step definitions
const BUILDER_STEPS = [
    { id: 'basics', title: 'Business Basics', icon: Building2, required: true, description: 'What does your business do?' },
    { id: 'contact', title: 'Contact & Location', icon: Phone, required: true, description: 'How can customers reach you?' },
    { id: 'hours', title: 'Availability', icon: Clock, required: true, description: 'When are you open?' },
    { id: 'voice', title: 'Brand Personality', icon: Heart, required: false, description: 'Your unique voice' },
    { id: 'products', title: 'Offerings', icon: Package, required: false, description: 'Products & services' },
    { id: 'faqs', title: 'FAQs & Policies', icon: HelpCircle, required: false, description: 'Common questions' },
];

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_LABELS: Record<string, string> = {
    monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
    friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

const VOICE_TONES: { id: VoiceTone; label: string; emoji: string; description: string }[] = [
    { id: 'professional', label: 'Professional', emoji: '💼', description: 'Formal & business-like' },
    { id: 'friendly', label: 'Friendly', emoji: '😊', description: 'Warm & approachable' },
    { id: 'casual', label: 'Casual', emoji: '👋', description: 'Relaxed & informal' },
    { id: 'formal', label: 'Formal', emoji: '🎩', description: 'Traditional & respectful' },
    { id: 'playful', label: 'Playful', emoji: '🎉', description: 'Fun & lighthearted' },
    { id: 'empathetic', label: 'Empathetic', emoji: '💗', description: 'Understanding & caring' },
    { id: 'authoritative', label: 'Authoritative', emoji: '📚', description: 'Expert & confident' },
    { id: 'warm', label: 'Warm', emoji: '☀️', description: 'Welcoming & comforting' },
    { id: 'energetic', label: 'Energetic', emoji: '⚡', description: 'Dynamic & enthusiastic' },
    { id: 'calm', label: 'Calm', emoji: '🌊', description: 'Peaceful & reassuring' },
];

// Common time options for dropdowns (user-friendly format)
const TIME_OPTIONS = [
    { value: '06:00', label: '6:00 AM' },
    { value: '07:00', label: '7:00 AM' },
    { value: '08:00', label: '8:00 AM' },
    { value: '08:30', label: '8:30 AM' },
    { value: '09:00', label: '9:00 AM' },
    { value: '09:30', label: '9:30 AM' },
    { value: '10:00', label: '10:00 AM' },
    { value: '10:30', label: '10:30 AM' },
    { value: '11:00', label: '11:00 AM' },
    { value: '11:30', label: '11:30 AM' },
    { value: '12:00', label: '12:00 PM' },
    { value: '12:30', label: '12:30 PM' },
    { value: '13:00', label: '1:00 PM' },
    { value: '13:30', label: '1:30 PM' },
    { value: '14:00', label: '2:00 PM' },
    { value: '14:30', label: '2:30 PM' },
    { value: '15:00', label: '3:00 PM' },
    { value: '15:30', label: '3:30 PM' },
    { value: '16:00', label: '4:00 PM' },
    { value: '16:30', label: '4:30 PM' },
    { value: '17:00', label: '5:00 PM' },
    { value: '17:30', label: '5:30 PM' },
    { value: '18:00', label: '6:00 PM' },
    { value: '18:30', label: '6:30 PM' },
    { value: '19:00', label: '7:00 PM' },
    { value: '19:30', label: '7:30 PM' },
    { value: '20:00', label: '8:00 PM' },
    { value: '20:30', label: '8:30 PM' },
    { value: '21:00', label: '9:00 PM' },
    { value: '21:30', label: '9:30 PM' },
    { value: '22:00', label: '10:00 PM' },
    { value: '23:00', label: '11:00 PM' },
    { value: '00:00', label: '12:00 AM' },
];

// Hour presets for one-click setup
const HOUR_PRESETS = [
    {
        id: 'standard',
        label: 'Standard 9-5',
        emoji: '🏢',
        description: 'Mon-Fri 9am-5pm',
        schedule: {
            monday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
            tuesday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
            wednesday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
            thursday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
            friday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
            saturday: { isOpen: false },
            sunday: { isOpen: false },
        },
    },
    {
        id: 'extended',
        label: 'Extended Hours',
        emoji: '🌆',
        description: 'Mon-Fri 8am-8pm',
        schedule: {
            monday: { isOpen: true, openTime: '08:00', closeTime: '20:00' },
            tuesday: { isOpen: true, openTime: '08:00', closeTime: '20:00' },
            wednesday: { isOpen: true, openTime: '08:00', closeTime: '20:00' },
            thursday: { isOpen: true, openTime: '08:00', closeTime: '20:00' },
            friday: { isOpen: true, openTime: '08:00', closeTime: '20:00' },
            saturday: { isOpen: false },
            sunday: { isOpen: false },
        },
    },
    {
        id: 'retail',
        label: 'Retail Hours',
        emoji: '🛍️',
        description: 'Mon-Sat 10am-9pm',
        schedule: {
            monday: { isOpen: true, openTime: '10:00', closeTime: '21:00' },
            tuesday: { isOpen: true, openTime: '10:00', closeTime: '21:00' },
            wednesday: { isOpen: true, openTime: '10:00', closeTime: '21:00' },
            thursday: { isOpen: true, openTime: '10:00', closeTime: '21:00' },
            friday: { isOpen: true, openTime: '10:00', closeTime: '21:00' },
            saturday: { isOpen: true, openTime: '10:00', closeTime: '21:00' },
            sunday: { isOpen: false },
        },
    },
    {
        id: 'restaurant',
        label: 'Restaurant',
        emoji: '🍽️',
        description: 'Tue-Sun 11am-10pm',
        schedule: {
            monday: { isOpen: false },
            tuesday: { isOpen: true, openTime: '11:00', closeTime: '22:00' },
            wednesday: { isOpen: true, openTime: '11:00', closeTime: '22:00' },
            thursday: { isOpen: true, openTime: '11:00', closeTime: '22:00' },
            friday: { isOpen: true, openTime: '11:00', closeTime: '23:00' },
            saturday: { isOpen: true, openTime: '11:00', closeTime: '23:00' },
            sunday: { isOpen: true, openTime: '11:00', closeTime: '21:00' },
        },
    },
    {
        id: 'weekend',
        label: 'Weekends Only',
        emoji: '🎉',
        description: 'Sat-Sun 10am-6pm',
        schedule: {
            monday: { isOpen: false },
            tuesday: { isOpen: false },
            wednesday: { isOpen: false },
            thursday: { isOpen: false },
            friday: { isOpen: false },
            saturday: { isOpen: true, openTime: '10:00', closeTime: '18:00' },
            sunday: { isOpen: true, openTime: '10:00', closeTime: '18:00' },
        },
    },
];

export default function BusinessPersonaBuilder({
    partnerId,
    onComplete,
    mode = 'settings',
}: BusinessPersonaBuilderProps) {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [persona, setPersona] = useState<Partial<BusinessPersona>>({});
    const [progress, setProgress] = useState<SetupProgress | null>(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [selectedIndustryCategory, setSelectedIndustryCategory] = useState<IndustryCategory | null>(null);
    const [suggestedFAQs, setSuggestedFAQs] = useState<FrequentlyAskedQuestion[]>([]);
    const [showQuickSetup, setShowQuickSetup] = useState(false);

    // Load existing persona
    useEffect(() => {
        loadPersona();
    }, [partnerId]);

    const loadPersona = async () => {
        setLoading(true);
        try {
            const result = await getBusinessPersonaAction(partnerId);
            if (result.success) {
                if (result.persona) {
                    setPersona(result.persona);

                    // Find industry category from the persona's industry
                    const industry = result.persona.identity?.industry;
                    if (industry) {
                        // Check if industry has a category property
                        if (industry.category) {
                            setSelectedIndustryCategory(industry.category as IndustryCategory);
                        } else if (industry.id) {
                            // Find by industry ID
                            for (const [cat, preset] of Object.entries(INDUSTRY_PRESETS)) {
                                if (preset.industries.some(i => i.id === industry.id)) {
                                    setSelectedIndustryCategory(cat as IndustryCategory);
                                    break;
                                }
                            }
                        } else if (industry.name) {
                            // Try to match by name
                            for (const [cat, preset] of Object.entries(INDUSTRY_PRESETS)) {
                                const matchingIndustry = preset.industries.find(i =>
                                    i.name.toLowerCase().includes(industry.name.toLowerCase()) ||
                                    industry.name.toLowerCase().includes(i.name.toLowerCase())
                                );
                                if (matchingIndustry) {
                                    setSelectedIndustryCategory(cat as IndustryCategory);
                                    break;
                                }
                            }
                        }
                    }

                    // Only show quick setup if the persona has no meaningful data
                    const hasData = result.persona.identity?.name ||
                        result.persona.identity?.phone ||
                        result.persona.identity?.email ||
                        result.persona.identity?.industry;

                    if (!hasData && result.isNewPersona) {
                        setShowQuickSetup(true);
                    }
                } else {
                    setShowQuickSetup(true);
                }

                if (result.setupProgress) {
                    setProgress(result.setupProgress);
                }
            }
        } catch (error) {
            console.error('Failed to load persona:', error);
        } finally {
            setLoading(false);
        }
    };

    // Update persona field
    const updateField = useCallback((path: string, value: any) => {
        setPersona(prev => {
            const keys = path.split('.');
            const newObj = { ...prev };
            let current: any = newObj;

            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) {
                    current[keys[i]] = {};
                } else {
                    current[keys[i]] = { ...current[keys[i]] };
                }
                current = current[keys[i]];
            }

            current[keys[keys.length - 1]] = value;
            return newObj;
        });
        setHasChanges(true);
    }, []);

    // Save persona
    const savePersona = async (showToast = true) => {
        setSaving(true);
        try {
            const result = await saveBusinessPersonaAction(partnerId, persona);
            if (result.success && result.setupProgress) {
                setProgress(result.setupProgress);
                setHasChanges(false);
            }
            return result.success;
        } catch (error) {
            console.error('Failed to save:', error);
            return false;
        } finally {
            setSaving(false);
        }
    };

    // Navigation
    const goToStep = async (index: number) => {
        if (hasChanges) {
            await savePersona(false);
        }
        setCurrentStep(index);
    };

    const nextStep = async () => {
        if (hasChanges) {
            await savePersona(false);
        }
        if (currentStep < BUILDER_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            await savePersona();
            onComplete?.();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    // Generate suggestions
    const handleGenerateSuggestions = async () => {
        if (!selectedIndustryCategory) return;

        const result = await generateAISuggestionsAction(partnerId, selectedIndustryCategory);
        if (result.success && result.suggestions) {
            setSuggestedFAQs(result.suggestions.faqs);
            if (!persona.personality?.voiceTone?.length) {
                updateField('personality.voiceTone', result.suggestions.voiceTones);
            }
        }
    };

    // Select industry
    const selectIndustry = (category: IndustryCategory, industry: { id: string; name: string; icon: string }) => {
        const preset = INDUSTRY_PRESETS[category];
        setSelectedIndustryCategory(category);
        updateField('identity.industry', {
            id: industry.id,
            name: industry.name,
            category,
            icon: industry.icon,
            suggestedQuestions: preset.typicalQuestions,
            typicalPolicies: preset.suggestedPolicies,
        });

        // Auto-fill suggestions if empty
        if (!persona.personality?.voiceTone?.length) {
            updateField('personality.voiceTone', preset.voiceSuggestion);
        }
        if (!persona.personality?.description) {
            updateField('personality.description', preset.exampleDescription);
        }
        if (!persona.personality?.uniqueSellingPoints?.length) {
            updateField('personality.uniqueSellingPoints', preset.suggestedUSPs.slice(0, 3));
        }
        if (!persona.knowledge?.acceptedPayments?.length) {
            updateField('knowledge.acceptedPayments', preset.suggestedPayments);
        }

        // Generate FAQs
        setSuggestedFAQs(preset.typicalQuestions.map((q, i) => ({
            id: `suggested-${i}`,
            question: q,
            answer: '',
            isAutoGenerated: true,
        })));
    };

    const handleRegionChange = (regionId: string) => {
        const region = SUPPORTED_REGIONS.find(r => r.id === regionId);
        if (!region) return;

        // Customize persona based on region
        updateField('identity.address.country', region.name); // Store country name
        updateField('identity.currency', region.currency);    // Set currency
        updateField('identity.timezone', region.timezone);    // Set default timezone

        // Optional: Trigger a recalculation of suggestions if needed, 
        // but often suggestions are dynamic based on this state.
    };

    // Quick setup with template
    const applyQuickSetup = (category: IndustryCategory, industryId: string) => {
        const preset = INDUSTRY_PRESETS[category];
        const industry = preset.industries.find(i => i.id === industryId);
        if (!industry) return;

        selectIndustry(category, industry);
        setShowQuickSetup(false);
        setCurrentStep(0);
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="py-12">
                    <div className="flex flex-col items-center justify-center text-center">
                        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
                        <p className="text-muted-foreground">Loading your business profile...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Quick Setup Screen (for new users)
    if (showQuickSetup && !persona.identity?.industry) {
        return (
            <div className="space-y-6">
                <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0">
                    <CardContent className="py-8 text-center">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Wand2 className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Welcome! Let's set up your business</h2>
                        <p className="text-indigo-100 max-w-md mx-auto">
                            Select your industry to get started with smart defaults and suggestions tailored for your business.
                        </p>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Object.entries(INDUSTRY_PRESETS).map(([category, preset]) => (
                        <button
                            key={category}
                            onClick={() => {
                                setSelectedIndustryCategory(category as IndustryCategory);
                            }}
                            className={cn(
                                'p-4 rounded-xl border-2 text-left transition-all hover:shadow-lg',
                                selectedIndustryCategory === category
                                    ? 'bg-indigo-50 border-indigo-400 shadow-md'
                                    : 'bg-white border-gray-200 hover:border-indigo-200'
                            )}
                        >
                            <div className="text-3xl mb-2">{preset.emoji}</div>
                            <div className="font-semibold text-gray-900">{preset.name}</div>
                            <div className="text-xs text-gray-500 mt-1">{preset.description}</div>
                        </button>
                    ))}
                </div>

                {/* Sub-categories when selected */}
                {selectedIndustryCategory && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <span className="text-2xl">{INDUSTRY_PRESETS[selectedIndustryCategory].emoji}</span>
                                Select your specific business type
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {INDUSTRY_PRESETS[selectedIndustryCategory].industries.map((industry) => (
                                    <button
                                        key={industry.id}
                                        onClick={() => applyQuickSetup(selectedIndustryCategory, industry.id)}
                                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left"
                                    >
                                        <span className="text-xl">{industry.icon}</span>
                                        <span className="text-sm font-medium">{industry.name}</span>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="text-center">
                    <Button
                        variant="ghost"
                        onClick={() => {
                            setShowQuickSetup(false);
                            setCurrentStep(0);
                        }}
                    >
                        Skip and set up manually
                        <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Progress Header */}
            <Card className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-0 overflow-hidden">
                <CardContent className="py-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                                <Zap className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Business Profile</h3>
                                <p className="text-xs text-muted-foreground">
                                    {progress?.overallPercentage === 100
                                        ? 'Complete! Your AI is ready to represent you.'
                                        : 'Complete your profile for better AI responses'
                                    }
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                {progress?.overallPercentage || 0}%
                            </div>
                            <div className="text-xs text-muted-foreground">complete</div>
                        </div>
                    </div>
                    <Progress value={progress?.overallPercentage || 0} className="h-2" />
                </CardContent>
            </Card>

            {/* Step Navigation - Horizontal Scroll on Mobile */}
            <div className="relative">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {BUILDER_STEPS.map((step, index) => {
                        const StepIcon = step.icon;
                        const isActive = index === currentStep;
                        const isCompleted = (progress && progress[step.id as keyof SetupProgress] === true) || index < currentStep;

                        return (
                            <button
                                key={step.id}
                                onClick={() => goToStep(index)}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all whitespace-nowrap min-w-max',
                                    isActive
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200'
                                        : isCompleted
                                            ? 'bg-green-50 text-green-700 border-green-200'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                )}
                            >
                                {isCompleted && !isActive ? (
                                    <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                    <StepIcon className="w-4 h-4" />
                                )}
                                <span className="text-sm font-medium">{step.title}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Step Content */}
            <Card className="border-2">
                <CardContent className="pt-6">
                    {/* Step Header */}
                    <div className="flex items-center gap-4 mb-6 pb-4 border-b">
                        <div className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center',
                            currentStep === 0 && 'bg-indigo-100 text-indigo-600',
                            currentStep === 1 && 'bg-green-100 text-green-600',
                            currentStep === 2 && 'bg-amber-100 text-amber-600',
                            currentStep === 3 && 'bg-purple-100 text-purple-600',
                            currentStep === 4 && 'bg-blue-100 text-blue-600',
                            currentStep === 5 && 'bg-orange-100 text-orange-600',
                        )}>
                            {React.createElement(BUILDER_STEPS[currentStep].icon, { className: 'w-6 h-6' })}
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold">{BUILDER_STEPS[currentStep].title}</h3>
                            <p className="text-sm text-muted-foreground">{BUILDER_STEPS[currentStep].description}</p>
                        </div>
                    </div>

                    {/* Step 1: Business Basics */}
                    {currentStep === 0 && (
                        <div className="space-y-6">
                            <div>
                                <Label className="text-base">Business Name *</Label>
                                <Input
                                    value={persona.identity?.name || ''}
                                    onChange={(e) => updateField('identity.name', e.target.value)}
                                    placeholder="Enter your business name"
                                    className="mt-2 text-lg h-12"
                                />
                            </div>

                            {/* Region Selection */}
                            <div>
                                <Label className="text-base">Business Location (Region) *</Label>
                                <p className="text-sm text-muted-foreground mb-2">
                                    We'll customize currency, payments, and suggestions based on this.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Select
                                        value={SUPPORTED_REGIONS.find(r => r.name === persona.identity?.address?.country)?.id || 'IN'}
                                        onValueChange={handleRegionChange}
                                    >
                                        <SelectTrigger className="w-full h-12 text-base">
                                            <SelectValue placeholder="Select your region" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SUPPORTED_REGIONS.map((region) => (
                                                <SelectItem key={region.id} value={region.id}>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xl">{region.flag}</span>
                                                        <span>{region.name}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>

                                    </Select>
                                </div>
                            </div>

                            {/* Industry Selection */}
                            <div>
                                <Label className="text-base">What type of business are you?</Label>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Choose your industry for tailored AI suggestions
                                </p>

                                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                                    {Object.entries(INDUSTRY_PRESETS).slice(0, 10).map(([category, preset]) => (
                                        <button
                                            key={category}
                                            onClick={() => setSelectedIndustryCategory(
                                                selectedIndustryCategory === category ? null : category as IndustryCategory
                                            )}
                                            className={cn(
                                                'p-3 rounded-lg border-2 text-center transition-all',
                                                selectedIndustryCategory === category
                                                    ? 'bg-indigo-50 border-indigo-400 shadow-sm'
                                                    : 'bg-white border-gray-200 hover:border-gray-300'
                                            )}
                                        >
                                            <div className="text-2xl mb-1">{preset.emoji}</div>
                                            <div className="text-xs font-medium truncate">{preset.name.split(' ')[0]}</div>
                                        </button>
                                    ))}
                                </div>

                                {/* Show more industries */}
                                {Object.keys(INDUSTRY_PRESETS).length > 10 && (
                                    <div className="mt-3">
                                        <button
                                            onClick={() => {/* Toggle more */ }}
                                            className="text-sm text-indigo-600 hover:underline"
                                        >
                                            Show more industries...
                                        </button>
                                    </div>
                                )}

                                {/* Sub-industries */}
                                {selectedIndustryCategory && (
                                    <div className="mt-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                                        <p className="text-sm font-medium mb-3 text-indigo-900">
                                            Select your specific type:
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {INDUSTRY_PRESETS[selectedIndustryCategory].industries.map((industry) => (
                                                <button
                                                    key={industry.id}
                                                    onClick={() => selectIndustry(selectedIndustryCategory, industry)}
                                                    className={cn(
                                                        'px-3 py-1.5 rounded-full text-sm transition-all flex items-center gap-2',
                                                        persona.identity?.industry?.id === industry.id
                                                            ? 'bg-indigo-600 text-white shadow-md'
                                                            : 'bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                                                    )}
                                                >
                                                    <span>{industry.icon}</span>
                                                    <span>{industry.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Business Description */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <Label className="text-base">About Your Business</Label>
                                    {selectedIndustryCategory && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                updateField('personality.description', INDUSTRY_PRESETS[selectedIndustryCategory].exampleDescription);
                                            }}
                                            className="text-xs text-indigo-600"
                                        >
                                            <Lightbulb className="w-3 h-3 mr-1" />
                                            Use example
                                        </Button>
                                    )}
                                </div>
                                <Textarea
                                    value={persona.personality?.description || ''}
                                    onChange={(e) => updateField('personality.description', e.target.value)}
                                    placeholder="Describe what your business does, what makes you special, and why customers should choose you..."
                                    rows={4}
                                    className="resize-none"
                                />
                                <p className="text-xs text-muted-foreground mt-2">
                                    💡 Tip: This helps AI introduce your business accurately to customers
                                </p>
                            </div>

                            {/* Tagline */}
                            <div>
                                <Label className="text-base">Tagline (Optional)</Label>
                                <Input
                                    value={persona.personality?.tagline || ''}
                                    onChange={(e) => updateField('personality.tagline', e.target.value)}
                                    placeholder="e.g., Quality you can trust, Service with a smile"
                                    className="mt-2"
                                />
                            </div>

                            {/* Unique Selling Points */}
                            <div>
                                <Label className="text-base">What Makes You Special?</Label>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Select or add your unique selling points
                                </p>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {(selectedIndustryCategory ? INDUSTRY_PRESETS[selectedIndustryCategory].suggestedUSPs : [
                                        'Quality products', 'Great service', 'Competitive prices', 'Expert team', 'Quick delivery'
                                    ]).map((usp) => {
                                        const isSelected = persona.personality?.uniqueSellingPoints?.includes(usp);
                                        return (
                                            <button
                                                key={usp}
                                                onClick={() => {
                                                    const current = persona.personality?.uniqueSellingPoints || [];
                                                    if (isSelected) {
                                                        updateField('personality.uniqueSellingPoints', current.filter(u => u !== usp));
                                                    } else {
                                                        updateField('personality.uniqueSellingPoints', [...current, usp]);
                                                    }
                                                }}
                                                className={cn(
                                                    'px-3 py-1.5 rounded-full text-sm transition-all',
                                                    isSelected
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                )}
                                            >
                                                {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                                                {usp}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Contact Info */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label className="text-base">Phone Number *</Label>
                                    <div className="relative mt-2">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            value={persona.identity?.phone || ''}
                                            onChange={(e) => updateField('identity.phone', e.target.value)}
                                            placeholder="+91 9876543210"
                                            className="pl-10 h-11"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-base">WhatsApp Number</Label>
                                    <div className="relative mt-2">
                                        <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            value={persona.identity?.whatsAppNumber || ''}
                                            onChange={(e) => updateField('identity.whatsAppNumber', e.target.value)}
                                            placeholder="Same as phone or different"
                                            className="pl-10 h-11"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Leave blank if same as phone
                                    </p>
                                </div>

                                <div>
                                    <Label className="text-base">Email Address *</Label>
                                    <div className="relative mt-2">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            type="email"
                                            value={persona.identity?.email || ''}
                                            onChange={(e) => updateField('identity.email', e.target.value)}
                                            placeholder="hello@yourbusiness.com"
                                            className="pl-10 h-11"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-base">Website</Label>
                                    <div className="relative mt-2">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            type="url"
                                            value={persona.identity?.website || ''}
                                            onChange={(e) => updateField('identity.website', e.target.value)}
                                            placeholder="https://yourbusiness.com"
                                            className="pl-10 h-11"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Social Media */}
                            <div>
                                <Label className="text-base">Social Media (Optional)</Label>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Add your social media handles
                                </p>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="relative">
                                        <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-500" />
                                        <Input
                                            value={persona.identity?.socialMedia?.instagram || ''}
                                            onChange={(e) => updateField('identity.socialMedia.instagram', e.target.value)}
                                            placeholder="Instagram username"
                                            className="pl-10"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
                                        <Input
                                            value={persona.identity?.socialMedia?.facebook || ''}
                                            onChange={(e) => updateField('identity.socialMedia.facebook', e.target.value)}
                                            placeholder="Facebook page"
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Address */}
                            <div className="border-t pt-6">
                                <Label className="text-base">Business Location</Label>
                                <p className="text-sm text-muted-foreground mb-4">
                                    For customers who want to visit or for delivery
                                </p>

                                <div className="grid gap-3 md:grid-cols-2">
                                    <Input
                                        value={persona.identity?.address?.city || ''}
                                        onChange={(e) => updateField('identity.address.city', e.target.value)}
                                        placeholder="City *"
                                    />
                                    <Input
                                        value={persona.identity?.address?.state || ''}
                                        onChange={(e) => updateField('identity.address.state', e.target.value)}
                                        placeholder="State *"
                                    />
                                    <Input
                                        value={persona.identity?.address?.area || ''}
                                        onChange={(e) => updateField('identity.address.area', e.target.value)}
                                        placeholder="Area/Locality"
                                        className="md:col-span-2"
                                    />
                                    <Input
                                        value={persona.identity?.address?.landmark || ''}
                                        onChange={(e) => updateField('identity.address.landmark', e.target.value)}
                                        placeholder="Landmark (e.g., Near XYZ Circle)"
                                        className="md:col-span-2"
                                    />
                                </div>
                            </div>

                            {/* Service Area */}
                            <div>
                                <Label className="text-base">Service Area</Label>
                                <Input
                                    value={persona.identity?.serviceArea || ''}
                                    onChange={(e) => updateField('identity.serviceArea', e.target.value)}
                                    placeholder="e.g., Greater Mumbai, Pan India, Within 10km"
                                    className="mt-2"
                                />
                            </div>

                            {/* Currency */}
                            <div className="border-t pt-6">
                                <Label className="text-base flex items-center gap-2">
                                    <CreditCard className="w-4 h-4" />
                                    Default Currency *
                                </Label>
                                <p className="text-sm text-muted-foreground mb-3">
                                    This will be used for pricing display and invoices
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {SUPPORTED_CURRENCIES.slice(0, 8).map((currency) => (
                                        <button
                                            key={currency.code}
                                            onClick={() => updateField('identity.currency', currency.code)}
                                            className={cn(
                                                'p-3 rounded-lg border-2 text-left transition-all flex items-center gap-2',
                                                persona.identity?.currency === currency.code
                                                    ? 'bg-indigo-50 border-indigo-400 shadow-sm'
                                                    : 'bg-white border-gray-200 hover:border-gray-300'
                                            )}
                                        >
                                            <span className="text-lg">{currency.flag}</span>
                                            <div>
                                                <div className="font-medium text-sm">{currency.code}</div>
                                                <div className="text-xs text-muted-foreground">{currency.symbol}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                {/* Show more currencies */}
                                <details className="mt-3">
                                    <summary className="text-sm text-indigo-600 cursor-pointer hover:underline">
                                        More currencies...
                                    </summary>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                                        {SUPPORTED_CURRENCIES.slice(8).map((currency) => (
                                            <button
                                                key={currency.code}
                                                onClick={() => updateField('identity.currency', currency.code)}
                                                className={cn(
                                                    'p-3 rounded-lg border-2 text-left transition-all flex items-center gap-2',
                                                    persona.identity?.currency === currency.code
                                                        ? 'bg-indigo-50 border-indigo-400 shadow-sm'
                                                        : 'bg-white border-gray-200 hover:border-gray-300'
                                                )}
                                            >
                                                <span className="text-lg">{currency.flag}</span>
                                                <div>
                                                    <div className="font-medium text-sm">{currency.code}</div>
                                                    <div className="text-xs text-muted-foreground">{currency.symbol}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </details>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Operating Hours */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            {/* Quick Options - Always Available */}
                            <div>
                                <Label className="text-base mb-3 block">Quick Options</Label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <button
                                        onClick={() => {
                                            updateField('identity.operatingHours.isOpen24x7', true);
                                            updateField('identity.operatingHours.appointmentOnly', false);
                                            updateField('identity.operatingHours.onlineAlways', false);
                                        }}
                                        className={cn(
                                            'p-4 rounded-xl border-2 text-center transition-all',
                                            persona.identity?.operatingHours?.isOpen24x7
                                                ? 'bg-green-50 border-green-400'
                                                : 'bg-white border-gray-200 hover:border-gray-300'
                                        )}
                                    >
                                        <div className="text-2xl mb-1">🌐</div>
                                        <div className="text-sm font-medium">Open 24/7</div>
                                    </button>

                                    <button
                                        onClick={() => {
                                            updateField('identity.operatingHours.isOpen24x7', false);
                                            updateField('identity.operatingHours.appointmentOnly', true);
                                            updateField('identity.operatingHours.onlineAlways', false);
                                        }}
                                        className={cn(
                                            'p-4 rounded-xl border-2 text-center transition-all',
                                            persona.identity?.operatingHours?.appointmentOnly
                                                ? 'bg-purple-50 border-purple-400'
                                                : 'bg-white border-gray-200 hover:border-gray-300'
                                        )}
                                    >
                                        <div className="text-2xl mb-1">📅</div>
                                        <div className="text-sm font-medium">By Appointment</div>
                                    </button>

                                    <button
                                        onClick={() => {
                                            updateField('identity.operatingHours.isOpen24x7', false);
                                            updateField('identity.operatingHours.appointmentOnly', false);
                                            updateField('identity.operatingHours.onlineAlways', true);
                                        }}
                                        className={cn(
                                            'p-4 rounded-xl border-2 text-center transition-all',
                                            persona.identity?.operatingHours?.onlineAlways
                                                ? 'bg-blue-50 border-blue-400'
                                                : 'bg-white border-gray-200 hover:border-gray-300'
                                        )}
                                    >
                                        <div className="text-2xl mb-1">💻</div>
                                        <div className="text-sm font-medium">Online 24/7</div>
                                    </button>

                                    <button
                                        onClick={() => {
                                            updateField('identity.operatingHours.isOpen24x7', false);
                                            updateField('identity.operatingHours.appointmentOnly', false);
                                            updateField('identity.operatingHours.onlineAlways', false);
                                        }}
                                        className={cn(
                                            'p-4 rounded-xl border-2 text-center transition-all',
                                            !persona.identity?.operatingHours?.isOpen24x7 &&
                                                !persona.identity?.operatingHours?.appointmentOnly &&
                                                !persona.identity?.operatingHours?.onlineAlways
                                                ? 'bg-amber-50 border-amber-400'
                                                : 'bg-white border-gray-200 hover:border-gray-300'
                                        )}
                                    >
                                        <div className="text-2xl mb-1">⏰</div>
                                        <div className="text-sm font-medium">Set Hours</div>
                                    </button>
                                </div>
                            </div>

                            {/* Hour Presets - Show when "Set Hours" is selected */}
                            {!persona.identity?.operatingHours?.isOpen24x7 &&
                                !persona.identity?.operatingHours?.appointmentOnly &&
                                !persona.identity?.operatingHours?.onlineAlways && (
                                    <>
                                        {/* Common Presets */}
                                        <div>
                                            <Label className="text-base mb-3 block">Start with a template</Label>
                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                                {HOUR_PRESETS.map((preset) => (
                                                    <button
                                                        key={preset.id}
                                                        onClick={() => {
                                                            updateField('identity.operatingHours.schedule', preset.schedule);
                                                        }}
                                                        className="p-3 rounded-xl border-2 border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 text-center transition-all"
                                                    >
                                                        <div className="text-xl mb-1">{preset.emoji}</div>
                                                        <div className="text-xs font-medium">{preset.label}</div>
                                                        <div className="text-[10px] text-muted-foreground">{preset.description}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Detailed Schedule */}
                                        <div className="space-y-3 bg-gray-50 p-4 rounded-xl">
                                            <div className="flex items-center justify-between mb-4">
                                                <p className="text-sm font-medium">Your weekly schedule</p>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        // Get Monday's hours and apply to all weekdays
                                                        const mondaySchedule = persona.identity?.operatingHours?.schedule?.monday as DaySchedule | undefined;
                                                        const openTime = mondaySchedule?.openTime || '09:00';
                                                        const closeTime = mondaySchedule?.closeTime || '17:00';
                                                        const weekdaySchedule = { isOpen: true, openTime, closeTime };

                                                        updateField('identity.operatingHours.schedule.monday', weekdaySchedule);
                                                        updateField('identity.operatingHours.schedule.tuesday', weekdaySchedule);
                                                        updateField('identity.operatingHours.schedule.wednesday', weekdaySchedule);
                                                        updateField('identity.operatingHours.schedule.thursday', weekdaySchedule);
                                                        updateField('identity.operatingHours.schedule.friday', weekdaySchedule);
                                                    }}
                                                    className="text-xs"
                                                >
                                                    <Copy className="h-3 w-3 mr-1" />
                                                    Copy Mon to all weekdays
                                                </Button>
                                            </div>

                                            {DAYS_OF_WEEK.map((day) => {
                                                const schedule = persona.identity?.operatingHours?.schedule?.[day] as DaySchedule | undefined;
                                                const isOpen = schedule?.isOpen ?? (day !== 'sunday');
                                                const openTime = schedule?.openTime || '09:00';
                                                const closeTime = schedule?.closeTime || '17:00';

                                                return (
                                                    <div
                                                        key={day}
                                                        className="flex items-center gap-3 p-3 rounded-lg bg-white border"
                                                    >
                                                        <div className="w-12">
                                                            <span className="font-medium text-sm">{DAY_LABELS[day]}</span>
                                                        </div>

                                                        <Switch
                                                            checked={isOpen}
                                                            onCheckedChange={(checked) => {
                                                                updateField(`identity.operatingHours.schedule.${day}.isOpen`, checked);
                                                                if (checked) {
                                                                    updateField(`identity.operatingHours.schedule.${day}.openTime`, '09:00');
                                                                    updateField(`identity.operatingHours.schedule.${day}.closeTime`, '17:00');
                                                                }
                                                            }}
                                                        />

                                                        {isOpen ? (
                                                            <div className="flex items-center gap-2 flex-1">
                                                                <Select
                                                                    value={openTime}
                                                                    onValueChange={(value) => updateField(
                                                                        `identity.operatingHours.schedule.${day}.openTime`,
                                                                        value
                                                                    )}
                                                                >
                                                                    <SelectTrigger className="w-[110px]">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {TIME_OPTIONS.map((time) => (
                                                                            <SelectItem key={time.value} value={time.value}>
                                                                                {time.label}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                <span className="text-muted-foreground text-sm">to</span>
                                                                <Select
                                                                    value={closeTime}
                                                                    onValueChange={(value) => updateField(
                                                                        `identity.operatingHours.schedule.${day}.closeTime`,
                                                                        value
                                                                    )}
                                                                >
                                                                    <SelectTrigger className="w-[110px]">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {TIME_OPTIONS.map((time) => (
                                                                            <SelectItem key={time.value} value={time.value}>
                                                                                {time.label}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground italic">Closed</span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}

                            {/* Special Notes */}
                            <div>
                                <Label className="text-base">Special Notes (Optional)</Label>
                                <Input
                                    value={persona.identity?.operatingHours?.specialNote || ''}
                                    onChange={(e) => updateField('identity.operatingHours.specialNote', e.target.value)}
                                    placeholder="e.g., Closed on 2nd Saturdays, Lunch break 1-2pm"
                                    className="mt-2"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 4: Brand Voice */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            {/* Voice Tones */}
                            <div>
                                <Label className="text-base">How should AI communicate for you?</Label>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Select 1-3 tones that match your brand
                                </p>

                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    {VOICE_TONES.map((tone) => {
                                        const isSelected = persona.personality?.voiceTone?.includes(tone.id);
                                        return (
                                            <button
                                                key={tone.id}
                                                onClick={() => {
                                                    const current = persona.personality?.voiceTone || [];
                                                    if (isSelected) {
                                                        updateField('personality.voiceTone', current.filter(t => t !== tone.id));
                                                    } else if (current.length < 3) {
                                                        updateField('personality.voiceTone', [...current, tone.id]);
                                                    }
                                                }}
                                                className={cn(
                                                    'p-3 rounded-xl border-2 text-center transition-all',
                                                    isSelected
                                                        ? 'bg-purple-50 border-purple-400 shadow-sm'
                                                        : 'bg-white border-gray-200 hover:border-purple-200'
                                                )}
                                            >
                                                <div className="text-2xl mb-1">{tone.emoji}</div>
                                                <div className="text-sm font-medium">{tone.label}</div>
                                                <div className="text-[10px] text-muted-foreground">{tone.description}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Response Style */}
                            <div>
                                <Label className="text-base">Response Style</Label>
                                <div className="grid grid-cols-3 gap-3 mt-3">
                                    {[
                                        { id: 'concise', label: 'Concise', emoji: '⚡', desc: 'Short & quick' },
                                        { id: 'conversational', label: 'Conversational', emoji: '💬', desc: 'Natural & friendly' },
                                        { id: 'detailed', label: 'Detailed', emoji: '📝', desc: 'Comprehensive' },
                                    ].map((style) => (
                                        <button
                                            key={style.id}
                                            onClick={() => updateField('personality.communicationStyle', style.id)}
                                            className={cn(
                                                'p-4 rounded-xl border-2 text-center transition-all',
                                                persona.personality?.communicationStyle === style.id
                                                    ? 'bg-purple-50 border-purple-400'
                                                    : 'bg-white border-gray-200 hover:border-gray-300'
                                            )}
                                        >
                                            <div className="text-2xl mb-1">{style.emoji}</div>
                                            <div className="font-medium text-sm">{style.label}</div>
                                            <div className="text-xs text-muted-foreground">{style.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Languages */}
                            <div>
                                <Label className="text-base">Languages</Label>
                                <p className="text-sm text-muted-foreground mb-3">
                                    What languages can your business communicate in?
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {SUPPORTED_LANGUAGES.map((lang) => {
                                        const isSelected = persona.personality?.languagePreference?.includes(lang.name);
                                        return (
                                            <button
                                                key={lang.code}
                                                onClick={() => {
                                                    const current = persona.personality?.languagePreference || ['English'];
                                                    if (isSelected) {
                                                        updateField('personality.languagePreference', current.filter(l => l !== lang.name));
                                                    } else {
                                                        updateField('personality.languagePreference', [...current, lang.name]);
                                                    }
                                                }}
                                                className={cn(
                                                    'px-3 py-1.5 rounded-full text-sm transition-all',
                                                    isSelected
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                )}
                                            >
                                                {lang.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Payment Methods */}
                            <div>
                                <Label className="text-base">Accepted Payment Methods</Label>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {getPaymentMethodsForRegion(
                                        SUPPORTED_REGIONS.find(r => r.name === persona.identity?.address?.country)?.id
                                    ).map((method) => {
                                        const current = persona.knowledge?.acceptedPayments || [];
                                        const isSelected = current.includes(method.name);
                                        return (
                                            <button
                                                key={method.id}
                                                onClick={() => {
                                                    if (isSelected) {
                                                        updateField('knowledge.acceptedPayments', current.filter((p: string) => p !== method.name));
                                                    } else {
                                                        updateField('knowledge.acceptedPayments', [...current, method.name]);
                                                    }
                                                }}
                                                className={cn(
                                                    'px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2',
                                                    isSelected
                                                        ? 'bg-green-100 text-green-800 border-green-300 border'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                )}
                                            >
                                                <span>{method.icon}</span>
                                                <span>{method.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Products & Services */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                {(persona.knowledge?.productsOrServices || []).map((product, index) => (
                                    <div key={product.id} className="p-4 border-2 rounded-xl bg-gray-50">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-bold">
                                                    {index + 1}
                                                </div>
                                                <span className="text-sm font-medium text-gray-600">
                                                    {product.name || 'New Item'}
                                                </span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    const updated = persona.knowledge?.productsOrServices?.filter(p => p.id !== product.id) || [];
                                                    updateField('knowledge.productsOrServices', updated);
                                                }}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <div className="grid gap-3">
                                            <Input
                                                value={product.name}
                                                onChange={(e) => {
                                                    const updated = (persona.knowledge?.productsOrServices || []).map(p =>
                                                        p.id === product.id ? { ...p, name: e.target.value } : p
                                                    );
                                                    updateField('knowledge.productsOrServices', updated);
                                                }}
                                                placeholder="Product/Service Name *"
                                            />
                                            <Textarea
                                                value={product.description}
                                                onChange={(e) => {
                                                    const updated = (persona.knowledge?.productsOrServices || []).map(p =>
                                                        p.id === product.id ? { ...p, description: e.target.value } : p
                                                    );
                                                    updateField('knowledge.productsOrServices', updated);
                                                }}
                                                placeholder="Brief description of this product/service..."
                                                rows={2}
                                            />
                                            <div className="grid grid-cols-2 gap-3">
                                                <Input
                                                    value={product.priceRange || ''}
                                                    onChange={(e) => {
                                                        const updated = (persona.knowledge?.productsOrServices || []).map(p =>
                                                            p.id === product.id ? { ...p, priceRange: e.target.value } : p
                                                        );
                                                        updateField('knowledge.productsOrServices', updated);
                                                    }}
                                                    placeholder={`Price (e.g., ${getCurrencySymbol(persona.identity?.currency || '')}999)`}
                                                />
                                                <Input
                                                    value={product.duration || ''}
                                                    onChange={(e) => {
                                                        const updated = (persona.knowledge?.productsOrServices || []).map(p =>
                                                            p.id === product.id ? { ...p, duration: e.target.value } : p
                                                        );
                                                        updateField('knowledge.productsOrServices', updated);
                                                    }}
                                                    placeholder="Duration (e.g., 1 hour)"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <Button
                                    variant="outline"
                                    className="w-full h-14 border-dashed border-2"
                                    onClick={() => {
                                        const newProduct: ProductService = {
                                            id: Date.now().toString(),
                                            name: '',
                                            description: '',
                                        };
                                        updateField('knowledge.productsOrServices', [
                                            ...(persona.knowledge?.productsOrServices || []),
                                            newProduct,
                                        ]);
                                    }}
                                >
                                    <Plus className="w-5 h-5 mr-2" />
                                    Add Product or Service
                                </Button>
                            </div>

                            {/* Pricing Info */}
                            <div className="pt-4 border-t">
                                <Label className="text-base">Pricing Information</Label>
                                <Input
                                    value={persona.knowledge?.pricingHighlights || ''}
                                    onChange={(e) => updateField('knowledge.pricingHighlights', e.target.value)}
                                    placeholder={`e.g., Starting from ${getCurrencySymbol(persona.identity?.currency || '')}999, Free consultation, Custom quotes available`}
                                    className="mt-2"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 6: FAQs & Policies */}
                    {currentStep === 5 && (
                        <div className="space-y-6">
                            {/* Suggested FAQs */}
                            {suggestedFAQs.length > 0 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Lightbulb className="w-5 h-5 text-amber-600" />
                                        <span className="font-medium text-amber-900">
                                            Suggested questions for your industry
                                        </span>
                                    </div>
                                    <div className="grid gap-2">
                                        {suggestedFAQs.slice(0, 4).map((faq) => (
                                            <button
                                                key={faq.id}
                                                onClick={() => {
                                                    const newFaq: FrequentlyAskedQuestion = {
                                                        id: Date.now().toString(),
                                                        question: faq.question,
                                                        answer: '',
                                                        isAutoGenerated: true,
                                                    };
                                                    updateField('knowledge.faqs', [
                                                        ...(persona.knowledge?.faqs || []),
                                                        newFaq,
                                                    ]);
                                                    setSuggestedFAQs(prev => prev.filter(f => f.id !== faq.id));
                                                }}
                                                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white border border-amber-100 text-left hover:bg-amber-100 transition-colors"
                                            >
                                                <Plus className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                                <span className="text-sm">{faq.question}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Current FAQs */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base">Your FAQs</Label>
                                    {selectedIndustryCategory && suggestedFAQs.length === 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleGenerateSuggestions}
                                            className="text-indigo-600"
                                        >
                                            <Sparkles className="w-4 h-4 mr-1" />
                                            Get suggestions
                                        </Button>
                                    )}
                                </div>

                                {(persona.knowledge?.faqs || []).map((faq, index) => (
                                    <div key={faq.id} className="p-4 border-2 rounded-xl bg-gray-50">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <HelpCircle className="w-4 h-4 text-orange-500" />
                                                <span className="text-sm font-medium">Question {index + 1}</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    const updated = persona.knowledge?.faqs?.filter(f => f.id !== faq.id) || [];
                                                    updateField('knowledge.faqs', updated);
                                                }}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <div className="space-y-3">
                                            <Input
                                                value={faq.question}
                                                onChange={(e) => {
                                                    const updated = (persona.knowledge?.faqs || []).map(f =>
                                                        f.id === faq.id ? { ...f, question: e.target.value } : f
                                                    );
                                                    updateField('knowledge.faqs', updated);
                                                }}
                                                placeholder="Customer's question..."
                                                className="font-medium"
                                            />
                                            <Textarea
                                                value={faq.answer}
                                                onChange={(e) => {
                                                    const updated = (persona.knowledge?.faqs || []).map(f =>
                                                        f.id === faq.id ? { ...f, answer: e.target.value } : f
                                                    );
                                                    updateField('knowledge.faqs', updated);
                                                }}
                                                placeholder="Your answer to this question..."
                                                rows={2}
                                            />
                                        </div>
                                    </div>
                                ))}

                                <Button
                                    variant="outline"
                                    className="w-full h-14 border-dashed border-2"
                                    onClick={() => {
                                        const newFaq: FrequentlyAskedQuestion = {
                                            id: Date.now().toString(),
                                            question: '',
                                            answer: '',
                                        };
                                        updateField('knowledge.faqs', [
                                            ...(persona.knowledge?.faqs || []),
                                            newFaq,
                                        ]);
                                    }}
                                >
                                    <Plus className="w-5 h-5 mr-2" />
                                    Add FAQ
                                </Button>
                            </div>

                            {/* Policies */}
                            <div className="pt-4 border-t">
                                <Label className="text-base mb-4 block">Business Policies (Optional)</Label>
                                <div className="grid gap-4">
                                    <div>
                                        <Label className="text-sm text-muted-foreground">Return/Refund Policy</Label>
                                        <Textarea
                                            value={persona.knowledge?.policies?.returnPolicy || ''}
                                            onChange={(e) => updateField('knowledge.policies.returnPolicy', e.target.value)}
                                            placeholder="Describe your return and refund policy..."
                                            rows={2}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-sm text-muted-foreground">Cancellation Policy</Label>
                                        <Textarea
                                            value={persona.knowledge?.policies?.cancellationPolicy || ''}
                                            onChange={(e) => updateField('knowledge.policies.cancellationPolicy', e.target.value)}
                                            placeholder="Describe your cancellation policy..."
                                            rows={2}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>

                {/* Navigation Footer */}
                <div className="border-t p-4 flex items-center justify-between bg-gray-50/50">
                    <Button
                        variant="ghost"
                        onClick={prevStep}
                        disabled={currentStep === 0}
                        className="gap-2"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                    </Button>

                    <div className="flex items-center gap-3">
                        {hasChanges && (
                            <span className="text-xs text-muted-foreground">Unsaved changes</span>
                        )}
                        <Button
                            onClick={nextStep}
                            disabled={saving}
                            className="gap-2 min-w-32"
                        >
                            {saving ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : currentStep === BUILDER_STEPS.length - 1 ? (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    Complete
                                </>
                            ) : (
                                <>
                                    Continue
                                    <ChevronRight className="w-4 h-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </Card>
        </div >
    );
}
