'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Building2, MapPin, Target, Shield, Globe, ChevronDown,
    Edit3, Check, X, Plus, Sparkles, Search, Eye, Award,
    Phone, Clock, HelpCircle, Bot, Zap, Trash2, EyeOff,
    LucideIcon, Landmark, GraduationCap, Heart, Briefcase,
    ShoppingBag, UtensilsCrossed, ShoppingCart, Car, Plane,
    PartyPopper, Wrench, MoreHorizontal, RefreshCw, AlertCircle, Image as ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BusinessPersona, ImportMeta, UnmappedDataItem, FieldSource } from '@/lib/business-persona-types';
import {
    getExpertiseSections,
    BUSINESS_PROFILE_CONFIG,
    type SectionConfig,
    type FieldConfig,
} from '@/lib/schemas';

import {
    getIndustries,
    getResolvedFunctions,
    searchFunctions,
    toSelectedCategories,
    findFunctionInfo,
    getCountriesForDropdown,
    CountryCode,
    ResolvedFunction,
    SelectedBusinessCategory,
} from '@/lib/business-taxonomy';
import { generateModulesFromCategories, type ModulesConfig } from '@/actions/module-generator-actions';
import InventoryManager from './InventoryManager';
import { InventoryConfig, InventoryItem, InventoryCategoryDefinition, InventoryFieldDefinition, generateItemId } from '@/lib/inventory-types';

// ===== ICON MAPPINGS =====
const SECTION_ICONS: Record<string, LucideIcon> = {
    'brand-identity': Building2,
    'location-hours': MapPin,
    'expertise': Target,
    'audience-positioning': Target,
    'trust-support': Shield,
    'from-the-web': Globe,
};

const SECTION_COLORS: Record<string, string> = {
    'brand-identity': 'bg-indigo-500',
    'location-hours': 'bg-blue-500',
    'expertise': 'bg-emerald-500',
    'audience-positioning': 'bg-amber-500',
    'trust-support': 'bg-purple-500',
    'from-the-web': 'bg-pink-500',
};

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
    Building: Building2,
    PartyPopper,
    Wrench,
    MoreHorizontal,
};

// ===== SUBSECTION ICONS (replacing emojis) =====
const SUBSECTION_ICONS: Record<string, LucideIcon> = {
    // Brand Identity
    'basic-info': Building2,
    'unique-value': Sparkles,
    'visual-identity': Eye,

    // Location & Hours
    'address': MapPin,
    'service-coverage': Target,
    'operating-hours': Clock,
    'availability': Phone,

    // Audience & Positioning
    'target-customers': Target,
    'customer-journey': Zap,
    'customer-pain-points': HelpCircle,

    // Trust & Support
    'trust-signals': Award,
    'testimonials': Heart,
    'contact-info': Phone,
    'policies': Shield,

    // From the Web
    'online-presence': Globe,
    'reviews': Award,
    'web-mentions': Globe,

    // Industry-Specific (common)
    'menu': UtensilsCrossed,
    'specialties': Sparkles,
    'services': Briefcase,
    'products': ShoppingBag,
    'pricing': Building2,
    'experience': Award,
    'certifications': Award,
    'team': Target,
};

const EMPTY_CATEGORIES: any[] = [];

// ===== PROPS =====
interface SchemaBusinessProfileProps {
    persona: Partial<BusinessPersona>;
    onUpdate: (path: string, value: any) => Promise<void>;
    onPreviewAI?: () => void;
    onProcessAI?: () => Promise<void>;
    // Module generation callback
    onModulesGenerated?: (config: ModulesConfig) => Promise<void>;
    onImportData?: () => void;
    onClearAll?: () => void;
}

// ===== PROGRESS RING =====
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

// ===== INVENTORY HELPERS =====
function getInventoryDefaults(label: string): { categories: InventoryCategoryDefinition[], fields: InventoryFieldDefinition[] } {
    // Default categories based on label
    let categories: InventoryCategoryDefinition[] = [
        { id: 'general', name: 'General' }
    ];

    if (label.toLowerCase().includes('menu') || label.toLowerCase().includes('dish')) {
        categories = [
            { id: 'starters', name: 'Starters' },
            { id: 'mains', name: 'Main Course' },
            { id: 'desserts', name: 'Desserts' },
            { id: 'beverages', name: 'Beverages' },
        ];
    } else if (label.toLowerCase().includes('room')) {
        categories = [
            { id: 'standard', name: 'Standard Rooms' },
            { id: 'deluxe', name: 'Deluxe Rooms' },
            { id: 'suites', name: 'Suites' },
        ];
    } else if (label.toLowerCase().includes('course')) {
        categories = [
            { id: 'beginner', name: 'Beginner' },
            { id: 'intermediate', name: 'Intermediate' },
            { id: 'advanced', name: 'Advanced' },
        ];
    }

    // Default fields - valid for most items
    const fields: InventoryFieldDefinition[] = [
        { id: 'name', name: 'Name', type: 'text', isRequired: true, placeholder: 'Item name' },
        { id: 'description', name: 'Description', type: 'textarea', isRequired: false, placeholder: 'Describe this item...' },
        { id: 'price', name: 'Price', type: 'number', isRequired: true, placeholder: '0.00' },
        // Additional common fields can be added here
        { id: 'image', name: 'Image URL', type: 'text', isRequired: false, placeholder: 'https://...' },
    ];

    return { categories, fields };
}

// ===== COLLAPSIBLE SECTION (CARD STYLE) =====
function Section({
    title,
    icon: Icon,
    iconBg,
    children,
    defaultOpen = false,
    description
}: {
    title: string;
    icon: LucideIcon;
    iconBg: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    description?: string;
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-5 flex items-start gap-5 hover:bg-slate-50 transition-colors text-left group"
            >
                <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-300",
                    iconBg
                )}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 pt-1">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{title}</h3>
                    {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
                </div>
                <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all mt-2",
                    isOpen ? "bg-indigo-100 text-indigo-600 rotate-180" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                )}>
                    <ChevronDown className="w-5 h-5" />
                </div>
            </button>

            <div className={cn(
                "transition-all duration-300 ease-in-out border-t border-slate-100",
                isOpen ? "max-h-[5000px] opacity-100 block" : "max-h-0 opacity-0 hidden"
            )}>
                <div className="p-6 md:p-8 space-y-8">
                    {children}
                </div>
            </div>
        </div>
    );
}

// ===== EDITABLE FIELD (ENHANCED) =====
function EditableField({
    label,
    value,
    onSave,
    multiline = false,
    placeholder = "Click to add...",
    helpText,
    badge,
    type = 'text'
}: {
    label: string;
    value: string;
    onSave: (val: string) => Promise<void>;
    multiline?: boolean;
    placeholder?: string;
    helpText?: string;
    badge?: string;
    type?: string;
}) {
    const [editing, setEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value || '');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setTempValue(value || '');
    }, [value]);

    const handleSave = async () => {
        if (tempValue === value) {
            setEditing(false);
            return;
        }
        setLoading(true);
        try {
            await onSave(tempValue);
            setEditing(false);
        } catch (error) {
            console.error("Failed to save field", error);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !multiline) {
            e.preventDefault();
            handleSave();
        }
        if (e.key === 'Escape') {
            setTempValue(value || '');
            setEditing(false);
        }
    };

    return (
        <div className="group/field relative">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-slate-700">{label}</label>
                    {badge && (
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider rounded border border-indigo-100">{badge}</span>
                    )}
                </div>
                {/* Focus/Edit indicator */}
                {!editing && (
                    <button
                        onClick={() => setEditing(true)}
                        className="opacity-0 group-hover/field:opacity-100 transition-opacity text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                        <Edit3 className="w-3 h-3" /> Edit
                    </button>
                )}
            </div>

            {helpText && <p className="text-xs text-slate-500 mb-2.5 leading-relaxed">{helpText}</p>}

            {editing ? (
                <div className="relative animate-in fade-in zoom-in-95 duration-200">
                    <div className="relative">
                        {multiline ? (
                            <textarea
                                value={tempValue}
                                onChange={(e) => setTempValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full px-4 py-3 bg-white border-2 border-indigo-500 rounded-xl text-sm focus:outline-none min-h-[100px] shadow-sm resize-y"
                                autoFocus
                                placeholder={placeholder}
                                disabled={loading}
                            />
                        ) : (
                            <input
                                type={type}
                                value={tempValue}
                                onChange={(e) => setTempValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full px-4 py-2.5 bg-white border-2 border-indigo-500 rounded-xl text-sm focus:outline-none shadow-sm"
                                autoFocus
                                placeholder={placeholder}
                                disabled={loading}
                            />
                        )}

                        <div className="absolute bottom-2 right-2 flex items-center gap-1">
                            <div className="text-[10px] text-slate-400 font-medium px-2 py-1 bg-white/80 rounded backdrop-blur-sm pointer-events-none">
                                {multiline ? 'Shift+Enter' : 'Enter'} to save
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2 justify-end">
                        <button
                            onClick={() => { setTempValue(value || ''); setEditing(false); }}
                            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 flex items-center gap-1.5 shadow-sm shadow-indigo-200 transition-all hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            Save
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    onClick={() => setEditing(true)}
                    className={cn(
                        "w-full px-4 py-3 rounded-xl border transition-all cursor-pointer flex items-start group-hover/field:border-indigo-300 group-hover/field:shadow-sm",
                        !value ? "bg-slate-50 border-dashed border-slate-300" : "bg-white border-slate-200"
                    )}
                >
                    <div className="flex-1 min-w-0">
                        {value ? (
                            <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{value}</div>
                        ) : (
                            <div className="flex items-center gap-2 text-sm text-slate-400 italic">
                                <Plus className="w-4 h-4 opacity-50" />
                                {placeholder}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ===== TAGS INPUT =====
function TagsInput({
    items = [],
    onAdd,
    onRemove,
    label,
    helpText
}: {
    items: string[];
    onAdd: (tag: string) => void;
    onRemove: (index: number) => void;
    label: string;
    helpText?: string;
}) {
    const [isAdding, setIsAdding] = useState(false);
    const [newValue, setNewValue] = useState('');

    const handleAdd = () => {
        if (newValue.trim()) {
            onAdd(newValue.trim());
            setNewValue('');
            setIsAdding(false);
        }
    };

    return (
        <div className="mb-4">
            <label className="text-xs font-medium text-slate-500 uppercase mb-2 block">{label}</label>
            {helpText && <p className="text-xs text-slate-400 mb-2">{helpText}</p>}
            <div className="flex flex-wrap gap-2">
                {items.map((item, i) => (
                    <span key={i} className="px-3 py-1 text-sm font-medium rounded-lg bg-indigo-50 text-indigo-700 flex items-center gap-1.5">
                        {item}
                        <button onClick={() => onRemove(i)} className="hover:bg-indigo-100 rounded-full p-0.5">
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
                {isAdding ? (
                    <input
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setIsAdding(false); }}
                        onBlur={handleAdd}
                        className="w-32 px-2 py-1 text-sm border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        autoFocus
                        placeholder="Add..."
                    />
                ) : (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="px-3 py-1 text-sm text-slate-500 hover:bg-slate-100 rounded-lg border border-dashed border-slate-300 flex items-center gap-1"
                    >
                        <Plus className="w-3 h-3" /> Add
                    </button>
                )}
            </div>
        </div>
    );
}

// ===== TOGGLE =====
function Toggle({ value, onChange, label, helpText }: { value: boolean; onChange: (val: boolean) => void; label: string; helpText?: string }) {
    return (
        <div className="flex items-center justify-between py-2 mb-3">
            <div>
                <label className="text-sm font-medium text-slate-700">{label}</label>
                {helpText && <p className="text-xs text-slate-500 mt-0.5">{helpText}</p>}
            </div>
            <button
                onClick={() => onChange(!value)}
                className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    value ? "bg-indigo-600" : "bg-slate-200"
                )}
            >
                <span className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                    value ? "translate-x-6" : "translate-x-1"
                )} />
            </button>
        </div>
    );
}

// ===== SELECT =====
function SelectField({
    label,
    value,
    options,
    onChange,
    helpText,
    placeholder = "Select..."
}: {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (val: string) => void;
    helpText?: string;
    placeholder?: string;
}) {
    return (
        <div className="mb-4">
            <label className="text-xs font-medium text-slate-500 uppercase mb-1 block">{label}</label>
            {helpText && <p className="text-xs text-slate-400 mb-1">{helpText}</p>}
            <div className="relative">
                <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white appearance-none"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                >
                    <option value="">{placeholder}</option>
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
        </div>
    );
}

// ===== MULTI-SELECT =====
function MultiSelectField({
    label,
    values,
    options,
    onChange,
    helpText
}: {
    label: string;
    values: string[];
    options: { value: string; label: string }[];
    onChange: (vals: string[]) => void;
    helpText?: string;
}) {
    const toggleOption = (optValue: string) => {
        const isSelected = values.includes(optValue);
        const next = isSelected
            ? values.filter(v => v !== optValue)
            : [...values, optValue];
        onChange(next);
    };

    return (
        <div className="mb-4">
            <label className="text-xs font-medium text-slate-500 uppercase mb-1 block">{label}</label>
            {helpText && <p className="text-xs text-slate-400 mb-2">{helpText}</p>}
            <div className="flex flex-wrap gap-2">
                {options.map(opt => {
                    const isSelected = values.includes(opt.value);
                    return (
                        <button
                            key={opt.value}
                            onClick={() => toggleOption(opt.value)}
                            className={cn(
                                "px-3 py-1.5 text-sm rounded-lg border transition-colors",
                                isSelected
                                    ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            )}
                        >
                            {opt.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ===== SCHEDULE EDITOR (NEW) =====
function ScheduleEditor({ value, label, onChange }: { value: any; label: string; onChange: (val: any) => void }) {
    const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    // Normalize value to ensure it's a schedule object
    const scheduleData = typeof value === 'object' && value !== null
        ? (value.schedule || value)
        : dayOrder.reduce((acc, day) => ({ ...acc, [day]: { isOpen: false, open: '09:00', close: '17:00' } }), {});

    const generateTimeOptions = () => {
        const times = [];
        for (let i = 0; i < 24; i++) {
            for (let j = 0; j < 60; j += 15) { // 15 min intervals
                const hour = i.toString().padStart(2, '0');
                const min = j.toString().padStart(2, '0');
                times.push(`${hour}:${min}`);
            }
        }
        return times;
    };

    const timeOptions = useMemo(() => generateTimeOptions(), []);

    const handleDayUpdate = (day: string, field: string, val: any) => {
        const currentParams = scheduleData[day] || { isOpen: false, open: '09:00', close: '17:00' };

        // If we're opening a day, ensure defaults are set
        let newItem = { ...currentParams };
        if (field === 'isOpen' && val === true) {
            newItem = {
                ...newItem,
                isOpen: true,
                open: newItem.open || '09:00',
                close: newItem.close || '17:00'
            };
        } else {
            newItem[field] = val;
        }

        const nextSchedule = {
            ...scheduleData,
            [day]: newItem
        };

        // Return full structure if needed, or just schedule part
        // The parent SchemaField handles path 'identity.operatingHours.schedule' typically
        onChange(nextSchedule);
    };

    const copyMondayToAll = () => {
        const monday = scheduleData['monday'];
        if (!monday) return;

        const nextSchedule = { ...scheduleData };
        dayOrder.forEach(day => {
            if (day !== 'monday') {
                nextSchedule[day] = { ...monday };
            }
        });
        onChange(nextSchedule);
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-500" />
                        {label}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">Set your standard operating hours</p>
                </div>

                <button
                    type="button"
                    onClick={copyMondayToAll}
                    className="text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
                >
                    <RefreshCw className="w-3 h-3" />
                    Copy Monday to All
                </button>
            </div>

            <div className="divide-y divide-slate-100">
                {dayOrder.map(day => {
                    const dayData = scheduleData[day] || { isOpen: false, open: '09:00', close: '17:00' };
                    const isOpen = dayData.isOpen !== false && (dayData.isOpen === true || (dayData.open && dayData.close));
                    // Normalize legacy data or new data
                    const openTime = dayData.openTime || dayData.open || '09:00';
                    const closeTime = dayData.closeTime || dayData.close || '17:00';

                    return (
                        <div key={day} className={cn("px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-3 transition-colors", isOpen ? "bg-white" : "bg-slate-50/50")}>
                            {/* Day Toggle */}
                            <div className="w-32 flex items-center gap-3 shrink-0">
                                <button
                                    onClick={() => handleDayUpdate(day, 'isOpen', !isOpen)}
                                    className={cn(
                                        "w-5 h-5 rounded flex items-center justify-center border transition-colors focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500",
                                        isOpen ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-slate-300"
                                    )}
                                >
                                    {isOpen && <Check className="w-3.5 h-3.5" />}
                                </button>
                                <span className={cn("text-sm font-medium capitalize", isOpen ? "text-slate-900" : "text-slate-400")}>{day}</span>
                            </div>

                            {/* Time Selectors */}
                            <div className={cn("flex items-center gap-2 transition-opacity duration-200", isOpen ? "opacity-100" : "opacity-30 pointer-events-none blur-[1px]")}>
                                <div className="relative">
                                    <select
                                        value={openTime}
                                        onChange={(e) => handleDayUpdate(day, 'open', e.target.value)}
                                        className="appearance-none pl-3 pr-8 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-28 text-slate-700"
                                    >
                                        {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                </div>
                                <span className="text-slate-400 text-sm">to</span>
                                <div className="relative">
                                    <select
                                        value={closeTime}
                                        onChange={(e) => handleDayUpdate(day, 'close', e.target.value)}
                                        className="appearance-none pl-3 pr-8 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-28 text-slate-700"
                                    >
                                        {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            {!isOpen && <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide ml-auto sm:ml-4">Closed</span>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ===== FAQ LIST (EDITABLE) =====
function FAQList({
    faqs,
    label,
    onChange,
    editable = true
}: {
    faqs: { question: string; answer: string }[];
    label: string;
    onChange?: (val: { question: string; answer: string }[]) => void;
    editable?: boolean;
}) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [newFaq, setNewFaq] = useState({ question: '', answer: '' });

    const items = Array.isArray(faqs) ? faqs : [];

    const handleAdd = () => {
        if (newFaq.question.trim() && newFaq.answer.trim() && onChange) {
            onChange([...items, newFaq]);
            setNewFaq({ question: '', answer: '' });
            setIsAdding(false);
        }
    };

    const handleUpdate = (index: number, updates: Partial<typeof newFaq>) => {
        if (onChange) {
            const updated = [...items];
            updated[index] = { ...updated[index], ...updates };
            onChange(updated);
        }
    };

    const handleDelete = (index: number) => {
        if (onChange) {
            onChange(items.filter((_, i) => i !== index));
        }
    };

    return (
        <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-500 uppercase">{label}</label>
                {editable && onChange && !isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                        <Plus className="w-3 h-3" /> Add FAQ
                    </button>
                )}
            </div>

            {items.length > 0 ? (
                <div className="space-y-2">
                    {items.map((faq, i) => (
                        <div key={i} className="group">
                            {editingIndex === i ? (
                                <div className="p-4 bg-teal-50 rounded-xl border-2 border-teal-200 space-y-3 animate-in fade-in duration-200">
                                    <div>
                                        <label className="text-xs font-medium text-slate-600 mb-1 block">Question</label>
                                        <input
                                            type="text"
                                            value={faq.question}
                                            onChange={(e) => handleUpdate(i, { question: e.target.value })}
                                            className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                            placeholder="What question do customers frequently ask?"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-600 mb-1 block">Answer</label>
                                        <textarea
                                            value={faq.answer}
                                            onChange={(e) => handleUpdate(i, { answer: e.target.value })}
                                            className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[80px]"
                                            placeholder="Provide a helpful answer..."
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <button onClick={() => setEditingIndex(null)} className="px-3 py-1.5 text-xs bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-1">
                                            <Check className="w-3 h-3" /> Done
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-slate-50 rounded-xl text-sm border border-slate-200 hover:border-teal-300 transition-colors">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-start gap-2 flex-1">
                                            <HelpCircle className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" />
                                            <div className="font-semibold text-slate-900">{faq.question}</div>
                                        </div>
                                        {editable && onChange && (
                                            <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity shrink-0">
                                                <button onClick={() => setEditingIndex(i)} className="p-1 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded">
                                                    <Edit3 className="w-3 h-3" />
                                                </button>
                                                <button onClick={() => handleDelete(i)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-slate-600 mt-2 pl-6 leading-relaxed">{faq.answer}</div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : !isAdding && (
                <div className="text-center p-4 border border-dashed border-slate-300 rounded-lg text-sm text-slate-400">
                    No FAQs configured yet. Click "Add FAQ" to help customers find answers quickly.
                </div>
            )}

            {/* Add New FAQ Form */}
            {isAdding && (
                <div className="p-4 bg-teal-50 rounded-xl border-2 border-dashed border-teal-200 space-y-3 animate-in fade-in duration-200 mt-2">
                    <div>
                        <label className="text-xs font-medium text-slate-600 mb-1 block">Question</label>
                        <input
                            type="text"
                            value={newFaq.question}
                            onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="What question do customers frequently ask?"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-600 mb-1 block">Answer</label>
                        <textarea
                            value={newFaq.answer}
                            onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[80px]"
                            placeholder="Provide a helpful answer..."
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => { setIsAdding(false); setNewFaq({ question: '', answer: '' }); }} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg">
                            Cancel
                        </button>
                        <button onClick={handleAdd} disabled={!newFaq.question.trim() || !newFaq.answer.trim()} className="px-3 py-1.5 text-xs bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
                            <Check className="w-3 h-3" /> Add FAQ
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ===== FROM THE WEB SECTION =====
function FromTheWebSection({
    items,
    onDelete,
    onToggleAI,
    onImportData,
}: {
    items: UnmappedDataItem[];
    onDelete: (id: string) => void;
    onToggleAI: (id: string, enabled: boolean) => void;
    onImportData?: () => void;
}) {
    const [filter, setFilter] = useState<'all' | 'google' | 'website'>('all');

    const filtered = items.filter(item =>
        filter === 'all' || item.source === filter
    );

    if (items.length === 0) {
        return (
            <div className="text-center py-8">
                <Globe className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500 text-sm">No additional data found</p>
                <p className="text-slate-400 text-xs mt-1">
                    Use Import Center to fetch from Google or your website
                </p>
                {onImportData && (
                    <button
                        onClick={onImportData}
                        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                    >
                        Go to Import Center
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    {(['all', 'google', 'website'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                filter === f
                                    ? "bg-pink-100 text-pink-700"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            )}
                        >
                            {f === 'all' ? `All (${items.length})` : f === 'google' ? `Google (${items.filter(i => i.source === 'google').length})` : `Website (${items.filter(i => i.source === 'website').length})`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
                {filtered.map(item => (
                    <div
                        key={item.id}
                        className="p-4 bg-slate-50 rounded-xl border border-slate-200 group hover:border-pink-300 transition-colors"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="font-medium text-sm text-slate-900">{item.key}</span>
                                    <span className={cn(
                                        "text-xs px-1.5 py-0.5 rounded",
                                        item.source === 'google' ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                                    )}>
                                        {item.source === 'google' ? 'Google' : 'Website'}
                                    </span>
                                    {item.usedByAI && (
                                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                                            <Check className="w-3 h-3" /> AI Context
                                        </span>
                                    )}
                                    {item.suggestedMapping && (
                                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                                            Mapping suggested
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-700">{item.value}</p>
                                <p className="text-xs text-slate-400 mt-1">
                                    Imported {new Date(item.importedAt).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => onToggleAI(item.id, !item.usedByAI)}
                                    className={cn(
                                        "p-1.5 rounded transition-colors",
                                        item.usedByAI
                                            ? "text-green-600 bg-green-50 hover:bg-green-100"
                                            : "text-slate-400 hover:text-green-600 hover:bg-green-50"
                                    )}
                                    title={item.usedByAI ? "Disable AI usage" : "Enable AI usage"}
                                >
                                    {item.usedByAI ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => onDelete(item.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Delete"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Info Banner */}
            <div className="p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-200">
                <p className="text-xs text-pink-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Items marked "AI Context" are used by AI agents when responding to customers.
                </p>
            </div>
        </div>
    );
}

// ===== SOURCE BADGE =====
function SourceBadge({ source }: { source?: FieldSource }) {
    if (!source) return null;

    return (
        <span className={cn(
            "ml-2 text-[10px] px-1.5 py-0.5 rounded inline-flex items-center gap-0.5",
            source.source === 'google'
                ? "bg-blue-100 text-blue-700"
                : source.source === 'website'
                    ? "bg-purple-100 text-purple-700"
                    : "bg-slate-100 text-slate-600"
        )}>
            {source.source === 'google' ? 'Google' : source.source === 'website' ? 'Website' : 'Manual'}
        </span>
    );
}

// ===== KEY-VALUE LIST (EDITABLE) =====
function KeyValueList({
    value,
    label,
    onChange,
    editable = true,
    helpText
}: {
    value: any[];
    label: string;
    onChange?: (val: any[]) => void;
    editable?: boolean;
    helpText?: string;
}) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');

    const items = Array.isArray(value) ? value : [];

    const handleAdd = () => {
        if (newKey.trim() && newValue.trim() && onChange) {
            onChange([...items, { key: newKey.trim(), value: newValue.trim(), source: 'manual' }]);
            setNewKey('');
            setNewValue('');
            setIsAdding(false);
        }
    };

    const handleUpdate = (index: number, key: string, val: string) => {
        if (onChange) {
            const updated = [...items];
            updated[index] = { ...updated[index], key, value: val };
            onChange(updated);
            setEditingIndex(null);
        }
    };

    const handleDelete = (index: number) => {
        if (onChange) {
            const updated = items.filter((_, i) => i !== index);
            onChange(updated);
        }
    };

    if (items.length === 0 && !editable) {
        return (
            <div className="mb-4">
                <label className="text-xs font-medium text-slate-500 uppercase mb-1 block">{label}</label>
                <div className="text-sm text-slate-400 italic">No items found</div>
            </div>
        );
    }

    return (
        <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-500 uppercase">{label}</label>
                {editable && onChange && !isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                        <Plus className="w-3 h-3" /> Add
                    </button>
                )}
            </div>
            {helpText && <p className="text-xs text-slate-400 mb-2">{helpText}</p>}

            <div className="space-y-2">
                {items.map((item: any, i: number) => (
                    <div key={i} className="group p-3 bg-slate-50 rounded-lg text-sm border border-slate-200 hover:border-slate-300 transition-colors">
                        {editingIndex === i ? (
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={item.key}
                                    onChange={(e) => {
                                        const updated = [...items];
                                        updated[i] = { ...updated[i], key: e.target.value };
                                        onChange?.(updated);
                                    }}
                                    className="w-full px-2 py-1 text-sm border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    placeholder="Label"
                                />
                                <textarea
                                    value={item.value}
                                    onChange={(e) => {
                                        const updated = [...items];
                                        updated[i] = { ...updated[i], value: e.target.value };
                                        onChange?.(updated);
                                    }}
                                    className="w-full px-2 py-1 text-sm border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[60px]"
                                    placeholder="Value"
                                />
                                <div className="flex justify-end gap-1">
                                    <button onClick={() => setEditingIndex(null)} className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded">Done</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-start">
                                    <span className="font-medium text-slate-900">{item.key || 'Unknown'}</span>
                                    <div className="flex items-center gap-1">
                                        {item.source && (
                                            <span className={cn(
                                                "text-[10px] px-1.5 py-0.5 rounded",
                                                item.source === 'google' ? "bg-blue-100 text-blue-700" :
                                                item.source === 'website' ? "bg-purple-100 text-purple-700" :
                                                "bg-slate-100 text-slate-600"
                                            )}>
                                                {item.source === 'google' ? 'Google' : item.source === 'website' ? 'Website' : 'Manual'}
                                            </span>
                                        )}
                                        {editable && onChange && (
                                            <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                                <button onClick={() => setEditingIndex(i)} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                                                    <Edit3 className="w-3 h-3" />
                                                </button>
                                                <button onClick={() => handleDelete(i)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-slate-600 mt-1 whitespace-pre-wrap">{item.value}</div>
                            </>
                        )}
                    </div>
                ))}

                {/* Add New Item Form */}
                {isAdding && (
                    <div className="p-3 bg-indigo-50 rounded-lg border-2 border-dashed border-indigo-200 space-y-2 animate-in fade-in duration-200">
                        <input
                            type="text"
                            value={newKey}
                            onChange={(e) => setNewKey(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Label (e.g., Award Name, Stat)"
                            autoFocus
                        />
                        <textarea
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[60px]"
                            placeholder="Value or description..."
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => { setIsAdding(false); setNewKey(''); setNewValue(''); }} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg">
                                Cancel
                            </button>
                            <button onClick={handleAdd} disabled={!newKey.trim() || !newValue.trim()} className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
                                <Check className="w-3 h-3" /> Add
                            </button>
                        </div>
                    </div>
                )}

                {items.length === 0 && !isAdding && (
                    <div className="text-center p-4 border border-dashed border-slate-300 rounded-lg text-sm text-slate-400">
                        No items yet. Click "Add" to create one.
                    </div>
                )}
            </div>
        </div>
    );
}

// ===== IMAGE GALLERY EDITOR =====
function ImageGalleryEditor({ value, label, onChange }: { value: string[]; label: string; onChange: (val: string[]) => void }) {
    const images = Array.isArray(value) ? value : [];
    const [isAdding, setIsAdding] = useState(false);
    const [newUrl, setNewUrl] = useState('');

    const handleAdd = () => {
        if (newUrl) {
            onChange([...images, newUrl]);
            setNewUrl('');
            setIsAdding(false);
        }
    };

    const handleRemove = (index: number) => {
        const next = [...images];
        next.splice(index, 1);
        onChange(next);
    };

    return (
        <div className="mb-6">
            <label className="text-sm font-semibold text-slate-700 mb-3 block flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-500" />
                {label}
            </label>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((url, i) => (
                    <div key={i} className="group relative aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all">
                        <img src={url} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <button
                                onClick={() => handleRemove(i)}
                                className="p-2 bg-white text-red-600 rounded-full shadow-lg hover:scale-110 transition-transform"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}

                {/* Add New Card */}
                {isAdding ? (
                    <div className="aspect-square bg-slate-50 rounded-xl border-2 border-dashed border-indigo-300 p-4 flex flex-col justify-center gap-2 animate-in fade-in duration-200">
                        <input
                            autoFocus
                            type="text"
                            placeholder="Image URL..."
                            className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded focus:border-indigo-500 focus:outline-none"
                            value={newUrl}
                            onChange={(e) => setNewUrl(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        />
                        <div className="flex justify-end gap-1">
                            <button onClick={() => setIsAdding(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                            <button onClick={handleAdd} className="p-1 text-indigo-600 hover:text-indigo-700"><Check className="w-4 h-4" /></button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="aspect-square bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-slate-100 transition-all group"
                    >
                        <div className="w-10 h-10 rounded-full bg-slate-200 group-hover:bg-indigo-100 flex items-center justify-center transition-colors mb-2">
                            <Plus className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-medium">Add Image</span>
                    </button>
                )}
            </div>
            {images.length === 0 && !isAdding && (
                <div className="mt-2 text-xs text-slate-400 italic text-center py-4 bg-slate-50/50 rounded-lg border border-slate-100 border-dashed">
                    No images added yet. Add some to showcase your business!
                </div>
            )}
        </div>
    );
}

// ===== REVIEW LIST (EDITABLE) =====
function ReviewList({
    value,
    label,
    onChange,
    editable = true
}: {
    value: any[];
    label: string;
    onChange?: (val: any[]) => void;
    editable?: boolean;
}) {
    const [isAdding, setIsAdding] = useState(false);
    const [newReview, setNewReview] = useState({ author: '', rating: 5, text: '', date: '', source: 'manual' });

    const reviews = Array.isArray(value) ? value : [];

    const handleAdd = () => {
        if (newReview.text.trim() && onChange) {
            onChange([...reviews, { ...newReview, date: newReview.date || new Date().toISOString().split('T')[0] }]);
            setNewReview({ author: '', rating: 5, text: '', date: '', source: 'manual' });
            setIsAdding(false);
        }
    };

    const handleDelete = (index: number) => {
        if (onChange) {
            onChange(reviews.filter((_, i) => i !== index));
        }
    };

    const StarRating = ({ rating, onRate, interactive = false }: { rating: number; onRate?: (r: number) => void; interactive?: boolean }) => (
        <div className="flex text-amber-400">
            {Array(5).fill(0).map((_, idx) => (
                <button
                    key={idx}
                    type="button"
                    onClick={() => interactive && onRate?.(idx + 1)}
                    className={cn(
                        "text-lg transition-transform",
                        interactive && "hover:scale-110 cursor-pointer",
                        idx < rating ? "opacity-100" : "opacity-30"
                    )}
                    disabled={!interactive}
                >
                    ★
                </button>
            ))}
        </div>
    );

    if (reviews.length === 0 && !editable) {
        return (
            <div className="mb-4">
                <label className="text-xs font-medium text-slate-500 uppercase mb-1 block">{label}</label>
                <div className="text-sm text-slate-400 italic">No reviews found</div>
            </div>
        );
    }

    return (
        <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-500 uppercase">{label}</label>
                {editable && onChange && !isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                        <Plus className="w-3 h-3" /> Add Review
                    </button>
                )}
            </div>

            <div className="space-y-3">
                {reviews.map((review: any, i: number) => (
                    <div key={i} className="group p-3 bg-slate-50 rounded-lg text-sm border border-slate-200 hover:border-slate-300 transition-colors">
                        <div className="flex items-center gap-2 mb-1">
                            <StarRating rating={review.rating || 0} />
                            <span className="font-medium text-slate-900">{review.author || 'Anonymous'}</span>
                            <div className="ml-auto flex items-center gap-2">
                                {review.source && (
                                    <span className={cn(
                                        "text-[10px] px-1.5 py-0.5 rounded",
                                        review.source === 'google' ? "bg-blue-100 text-blue-700" :
                                        review.source === 'website' ? "bg-purple-100 text-purple-700" :
                                        "bg-slate-100 text-slate-600"
                                    )}>
                                        {review.source === 'google' ? 'Google' : review.source === 'website' ? 'Website' : 'Manual'}
                                    </span>
                                )}
                                <span className="text-xs text-slate-500">{review.date}</span>
                                {editable && onChange && (
                                    <button
                                        onClick={() => handleDelete(i)}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-opacity"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                        <p className="text-slate-600 text-xs leading-relaxed">{review.text}</p>
                    </div>
                ))}

                {/* Add New Review Form */}
                {isAdding && (
                    <div className="p-4 bg-amber-50 rounded-xl border-2 border-dashed border-amber-200 space-y-3 animate-in fade-in duration-200">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-slate-700">Rating:</span>
                            <StarRating rating={newReview.rating} onRate={(r) => setNewReview({ ...newReview, rating: r })} interactive />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="text"
                                value={newReview.author}
                                onChange={(e) => setNewReview({ ...newReview, author: e.target.value })}
                                className="px-3 py-2 text-sm border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                placeholder="Reviewer name"
                            />
                            <input
                                type="date"
                                value={newReview.date}
                                onChange={(e) => setNewReview({ ...newReview, date: e.target.value })}
                                className="px-3 py-2 text-sm border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                        </div>
                        <textarea
                            value={newReview.text}
                            onChange={(e) => setNewReview({ ...newReview, text: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[80px]"
                            placeholder="Review text..."
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => { setIsAdding(false); setNewReview({ author: '', rating: 5, text: '', date: '', source: 'manual' }); }} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg">
                                Cancel
                            </button>
                            <button onClick={handleAdd} disabled={!newReview.text.trim()} className="px-3 py-1.5 text-xs bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
                                <Check className="w-3 h-3" /> Add Review
                            </button>
                        </div>
                    </div>
                )}

                {reviews.length === 0 && !isAdding && (
                    <div className="text-center p-4 border border-dashed border-slate-300 rounded-lg text-sm text-slate-400">
                        No reviews yet. Click "Add Review" to add customer feedback.
                    </div>
                )}
            </div>
        </div>
    );
}

// ===== TESTIMONIAL LIST (EDITABLE) =====
function TestimonialList({
    value,
    label,
    onChange,
    editable = true
}: {
    value: any[];
    label: string;
    onChange?: (val: any[]) => void;
    editable?: boolean;
}) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [newTestimonial, setNewTestimonial] = useState({ author: '', text: '', role: '', source: 'manual' });

    const testimonials = Array.isArray(value) ? value : [];

    const handleAdd = () => {
        if (newTestimonial.text.trim() && onChange) {
            onChange([...testimonials, newTestimonial]);
            setNewTestimonial({ author: '', text: '', role: '', source: 'manual' });
            setIsAdding(false);
        }
    };

    const handleUpdate = (index: number, updates: Partial<typeof newTestimonial>) => {
        if (onChange) {
            const updated = [...testimonials];
            updated[index] = { ...updated[index], ...updates };
            onChange(updated);
        }
    };

    const handleDelete = (index: number) => {
        if (onChange) {
            onChange(testimonials.filter((_, i) => i !== index));
        }
    };

    if (testimonials.length === 0 && !editable) {
        return (
            <div className="mb-4">
                <label className="text-xs font-medium text-slate-500 uppercase mb-1 block">{label}</label>
                <div className="text-sm text-slate-400 italic">No testimonials found</div>
            </div>
        );
    }

    return (
        <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-500 uppercase">{label}</label>
                {editable && onChange && !isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                        <Plus className="w-3 h-3" /> Add Testimonial
                    </button>
                )}
            </div>

            <div className="space-y-3">
                {testimonials.map((item: any, i: number) => (
                    <div key={i} className="group relative">
                        {editingIndex === i ? (
                            <div className="p-4 bg-purple-50 rounded-xl border-2 border-purple-200 space-y-3 animate-in fade-in duration-200">
                                <textarea
                                    value={item.text}
                                    onChange={(e) => handleUpdate(i, { text: e.target.value })}
                                    className="w-full px-3 py-2 text-sm border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[80px]"
                                    placeholder="Testimonial text..."
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        value={item.author || ''}
                                        onChange={(e) => handleUpdate(i, { author: e.target.value })}
                                        className="px-3 py-2 text-sm border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="Customer name"
                                    />
                                    <input
                                        type="text"
                                        value={item.role || ''}
                                        onChange={(e) => handleUpdate(i, { role: e.target.value })}
                                        className="px-3 py-2 text-sm border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="Role/Title (optional)"
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <button onClick={() => setEditingIndex(null)} className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Done
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-gradient-to-br from-slate-50 to-purple-50/30 rounded-xl border border-slate-100 relative hover:border-purple-200 transition-colors">
                                <span className="absolute top-2 left-3 text-3xl text-purple-200 leading-none font-serif">"</span>
                                <p className="text-slate-700 text-sm relative z-10 pl-4 pr-8 italic leading-relaxed">{item.text}</p>
                                <div className="mt-3 pl-4 flex items-center justify-between">
                                    <div>
                                        <span className="text-sm font-semibold text-slate-900">— {item.author || 'Customer'}</span>
                                        {item.role && <span className="text-xs text-slate-500 ml-1">, {item.role}</span>}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {item.source && (
                                            <span className={cn(
                                                "text-[10px] px-1.5 py-0.5 rounded",
                                                item.source === 'google' ? "bg-blue-100 text-blue-700" :
                                                item.source === 'website' ? "bg-purple-100 text-purple-700" :
                                                "bg-slate-100 text-slate-600"
                                            )}>
                                                {item.source === 'google' ? 'Google' : item.source === 'website' ? 'Website' : 'Manual'}
                                            </span>
                                        )}
                                        {editable && onChange && (
                                            <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                                <button onClick={() => setEditingIndex(i)} className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded">
                                                    <Edit3 className="w-3 h-3" />
                                                </button>
                                                <button onClick={() => handleDelete(i)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {/* Add New Testimonial Form */}
                {isAdding && (
                    <div className="p-4 bg-purple-50 rounded-xl border-2 border-dashed border-purple-200 space-y-3 animate-in fade-in duration-200">
                        <textarea
                            value={newTestimonial.text}
                            onChange={(e) => setNewTestimonial({ ...newTestimonial, text: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[80px]"
                            placeholder="What did your customer say about you?"
                            autoFocus
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="text"
                                value={newTestimonial.author}
                                onChange={(e) => setNewTestimonial({ ...newTestimonial, author: e.target.value })}
                                className="px-3 py-2 text-sm border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Customer name"
                            />
                            <input
                                type="text"
                                value={newTestimonial.role}
                                onChange={(e) => setNewTestimonial({ ...newTestimonial, role: e.target.value })}
                                className="px-3 py-2 text-sm border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Role/Title (optional)"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => { setIsAdding(false); setNewTestimonial({ author: '', text: '', role: '', source: 'manual' }); }} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg">
                                Cancel
                            </button>
                            <button onClick={handleAdd} disabled={!newTestimonial.text.trim()} className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
                                <Check className="w-3 h-3" /> Add Testimonial
                            </button>
                        </div>
                    </div>
                )}

                {testimonials.length === 0 && !isAdding && (
                    <div className="text-center p-4 border border-dashed border-slate-300 rounded-lg text-sm text-slate-400">
                        No testimonials yet. Click "Add Testimonial" to add customer quotes.
                    </div>
                )}
            </div>
        </div>
    );
}

// ===== SCHEMA FIELD RENDERER =====
function SchemaField({
    field,
    value,
    onChange,
    onTagsAdd,
    onTagsRemove,
    suggestedValue
}: {
    field: FieldConfig;
    value: any;
    onChange: (val: any) => Promise<void>;
    onTagsAdd: (tag: string) => void;
    onTagsRemove: (idx: number) => void;
    suggestedValue?: any;
}) {
    switch (field.type) {
        case 'toggle':
            return <Toggle value={!!value} onChange={onChange} label={field.label} helpText={field.helpText} />;

        case 'tags':
            return (
                <TagsInput
                    items={Array.isArray(value) ? value : []}
                    onAdd={onTagsAdd}
                    onRemove={onTagsRemove}
                    label={field.label}
                    helpText={field.helpText}
                />
            );

        case 'select':
            return (
                <SelectField
                    label={field.label}
                    value={value || ''}
                    options={field.options || []}
                    onChange={onChange}
                    helpText={field.helpText}
                    placeholder={field.placeholder}
                />
            );

        case 'inventory':
            if (!field.inventoryConfig) return null;

            // Construct config for InventoryManager
            const defaults = getInventoryDefaults(field.inventoryConfig.itemLabel);

            // Normalize items to ensure they meet InventoryItem interface
            // AND migrate legacy flat fields to 'fields' object if needed
            const rawItems = Array.isArray(value) ? value : [];
            const normalizedItems: InventoryItem[] = rawItems.map((item: any) => {
                const existingFields = item.fields || {};

                // Migrate legacy properties that match defined fields
                const migratedFields = { ...existingFields };
                defaults.fields.forEach(def => {
                    // If field exists on root but not in fields object, move it
                    if (item[def.id] !== undefined && existingFields[def.id] === undefined) {
                        migratedFields[def.id] = item[def.id];
                    }
                });

                return {
                    ...item,
                    id: item.id || generateItemId(),
                    fields: migratedFields,
                    isActive: item.isActive !== false,
                };
            });

            const invConfig: InventoryConfig = {
                itemLabel: field.inventoryConfig.itemLabel,
                itemLabelPlural: field.inventoryConfig.itemLabelPlural,
                priceLabel: field.inventoryConfig.priceLabel,
                currency: 'INR', // Default currency
                source: 'manual',
                categories: defaults.categories,
                fields: defaults.fields,
                items: normalizedItems,
                lastModifiedAt: new Date().toISOString(),
            };

            return (
                <div className="mb-6 border border-slate-200 rounded-xl overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-200">
                        <h4 className="font-semibold text-slate-900">{field.inventoryConfig.itemLabelPlural} Management</h4>
                        {field.helpText && <p className="text-sm text-slate-500 mt-1">{field.helpText}</p>}
                    </div>
                    <div className="p-4">
                        <InventoryManager
                            config={invConfig}
                            onConfigChange={(newConfig) => onChange(newConfig.items)}
                        />
                    </div>
                </div>
            );

        case 'multi-select':
        case 'checkbox-group':
            return (
                <MultiSelectField
                    label={field.label}
                    values={Array.isArray(value) ? value : []}
                    options={field.options || []}
                    onChange={onChange}
                    helpText={field.helpText}
                />
            );

        case 'schedule':
            return <ScheduleEditor value={value} label={field.label} onChange={onChange} />;

        case 'key-value-list':
            return <KeyValueList value={value} label={field.label} onChange={onChange} helpText={field.helpText} editable={true} />;

        case 'review-list':
            return <ReviewList value={value} label={field.label} onChange={onChange} editable={true} />;

        case 'testimonial-list':
            return <TestimonialList value={value} label={field.label} onChange={onChange} editable={true} />;

        case 'faq-list':
            return <FAQList faqs={Array.isArray(value) ? value : []} label={field.label} onChange={onChange} editable={true} />;

        case 'image-gallery':
            return <ImageGalleryEditor value={value} label={field.label} onChange={onChange} />;

        default:
            return (
                <div className="relative">
                    <EditableField
                        label={field.label}
                        value={value}
                        onSave={onChange}
                        multiline={field.type === 'textarea'}
                        placeholder={field.placeholder}
                        helpText={field.helpText}
                        badge={field.badge}
                    />
                    {/* SUGGESTION BADGE */}
                    {suggestedValue && suggestedValue !== value && (
                        <div
                            onClick={() => onChange(suggestedValue)}
                            className="mt-1.5 flex items-center gap-2 px-2 py-1 bg-amber-50 border border-amber-200 rounded-md cursor-pointer hover:bg-amber-100 group/suggestion shadow-sm w-fit"
                        >
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            <span className="text-xs text-amber-700">
                                Use imported: <span className="font-medium">{String(suggestedValue)}</span>
                            </span>
                            <Check className="w-3 h-3 text-amber-600 opacity-0 group-hover/suggestion:opacity-100 ml-auto" />
                        </div>
                    )}
                </div>
            );
    }
}



// ===== AI STRATEGY SECTION (ENHANCED) =====
function AIStrategySection({
    persona,
    onUpdate
}: {
    persona: Partial<BusinessPersona>;
    onUpdate: (path: string, value: any) => Promise<void>;
}) {
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [newTag, setNewTag] = useState('');

    // Get AI configuration from persona or use defaults
    const tags = persona.tags || [];
    const aiConfig = (persona as any).aiConfig || {};

    const toneOptions = [
        { value: 'professional', label: 'Professional', description: 'Formal and business-like' },
        { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
        { value: 'casual', label: 'Casual', description: 'Relaxed and conversational' },
        { value: 'enthusiastic', label: 'Enthusiastic', description: 'Energetic and positive' },
        { value: 'empathetic', label: 'Empathetic', description: 'Understanding and supportive' },
    ];

    const responseStyleOptions = [
        { value: 'concise', label: 'Concise', description: 'Short, direct answers' },
        { value: 'detailed', label: 'Detailed', description: 'Comprehensive explanations' },
        { value: 'balanced', label: 'Balanced', description: 'Mix of brevity and detail' },
    ];

    const escalationOptions = [
        { value: 'complaints', label: 'Complaints' },
        { value: 'refunds', label: 'Refund Requests' },
        { value: 'pricing', label: 'Pricing Questions' },
        { value: 'custom_orders', label: 'Custom Orders' },
        { value: 'partnerships', label: 'Partnership Inquiries' },
        { value: 'legal', label: 'Legal Questions' },
    ];

    const handleAddTag = () => {
        if (newTag.trim() && !tags.includes(newTag.trim())) {
            onUpdate('tags', [...tags, newTag.trim()]);
            setNewTag('');
            setIsAddingTag(false);
        }
    };

    const handleRemoveTag = (index: number) => {
        const updated = tags.filter((_, i) => i !== index);
        onUpdate('tags', updated);
    };

    const handleToneChange = (tone: string) => {
        onUpdate('aiConfig.tone', tone);
    };

    const handleResponseStyleChange = (style: string) => {
        onUpdate('aiConfig.responseStyle', style);
    };

    const handleEscalationToggle = (topic: string) => {
        const current = aiConfig.escalationTopics || [];
        const updated = current.includes(topic)
            ? current.filter((t: string) => t !== topic)
            : [...current, topic];
        onUpdate('aiConfig.escalationTopics', updated);
    };

    return (
        <Section
            title="AI Strategy"
            icon={Bot}
            iconBg="bg-violet-600"
            description="Configure how your AI agent communicates and behaves"
            defaultOpen={false}
        >
            <div className="space-y-8">
                {/* AI Persona Tags */}
                <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-5 border border-violet-100">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-white rounded-lg shadow-sm text-violet-600">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <h4 className="font-semibold text-slate-900">AI Persona Tags</h4>
                                {!isAddingTag && (
                                    <button
                                        onClick={() => setIsAddingTag(true)}
                                        className="text-xs font-medium text-violet-600 hover:text-violet-700 flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" /> Add Tag
                                    </button>
                                )}
                            </div>
                            <p className="text-sm text-slate-600 mb-4">
                                Tags help your AI agent understand your business identity, style, and unique characteristics.
                            </p>

                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag, i) => (
                                    <span
                                        key={i}
                                        className="group px-3 py-1.5 bg-white border border-violet-200 text-violet-700 rounded-lg text-sm font-medium shadow-sm flex items-center gap-1.5 hover:border-violet-300 transition-colors"
                                    >
                                        # {tag}
                                        <button
                                            onClick={() => handleRemoveTag(i)}
                                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-violet-100 rounded transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}

                                {isAddingTag && (
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="text"
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleAddTag();
                                                if (e.key === 'Escape') { setIsAddingTag(false); setNewTag(''); }
                                            }}
                                            className="w-32 px-2 py-1 text-sm border border-violet-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                            placeholder="New tag..."
                                            autoFocus
                                        />
                                        <button onClick={handleAddTag} className="p-1 text-violet-600 hover:bg-violet-100 rounded">
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => { setIsAddingTag(false); setNewTag(''); }} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                {tags.length === 0 && !isAddingTag && (
                                    <span className="text-sm text-slate-400 italic">No tags yet. Add tags to define your AI's personality.</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Tone & Communication Style */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Tone Selection */}
                    <div className="bg-white rounded-xl p-5 border border-slate-200">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                                <Heart className="w-4 h-4 text-indigo-600" />
                            </div>
                            <h4 className="font-semibold text-slate-900">AI Tone</h4>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">How should your AI communicate with customers?</p>

                        <div className="space-y-2">
                            {toneOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => handleToneChange(option.value)}
                                    className={cn(
                                        "w-full p-3 rounded-lg border text-left transition-all",
                                        aiConfig.tone === option.value
                                            ? "border-indigo-500 bg-indigo-50"
                                            : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className={cn(
                                            "font-medium text-sm",
                                            aiConfig.tone === option.value ? "text-indigo-700" : "text-slate-700"
                                        )}>
                                            {option.label}
                                        </span>
                                        {aiConfig.tone === option.value && (
                                            <Check className="w-4 h-4 text-indigo-600" />
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">{option.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Response Style */}
                    <div className="bg-white rounded-xl p-5 border border-slate-200">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                <Target className="w-4 h-4 text-emerald-600" />
                            </div>
                            <h4 className="font-semibold text-slate-900">Response Style</h4>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">How detailed should AI responses be?</p>

                        <div className="space-y-2">
                            {responseStyleOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => handleResponseStyleChange(option.value)}
                                    className={cn(
                                        "w-full p-3 rounded-lg border text-left transition-all",
                                        aiConfig.responseStyle === option.value
                                            ? "border-emerald-500 bg-emerald-50"
                                            : "border-slate-200 hover:border-emerald-300 hover:bg-slate-50"
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className={cn(
                                            "font-medium text-sm",
                                            aiConfig.responseStyle === option.value ? "text-emerald-700" : "text-slate-700"
                                        )}>
                                            {option.label}
                                        </span>
                                        {aiConfig.responseStyle === option.value && (
                                            <Check className="w-4 h-4 text-emerald-600" />
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">{option.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Escalation Rules */}
                <div className="bg-white rounded-xl p-5 border border-slate-200">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                        </div>
                        <h4 className="font-semibold text-slate-900">Escalation Topics</h4>
                    </div>
                    <p className="text-sm text-slate-500 mb-4">
                        Select topics that should be escalated to a human instead of being handled by AI.
                    </p>

                    <div className="flex flex-wrap gap-2">
                        {escalationOptions.map((option) => {
                            const isSelected = (aiConfig.escalationTopics || []).includes(option.value);
                            return (
                                <button
                                    key={option.value}
                                    onClick={() => handleEscalationToggle(option.value)}
                                    className={cn(
                                        "px-3 py-2 rounded-lg border text-sm font-medium transition-all",
                                        isSelected
                                            ? "border-amber-500 bg-amber-50 text-amber-700"
                                            : "border-slate-200 text-slate-600 hover:border-amber-300 hover:bg-slate-50"
                                    )}
                                >
                                    {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-xs text-slate-400 mt-3">
                        When customers ask about these topics, AI will offer to connect them with a team member.
                    </p>
                </div>

                {/* Custom Instructions */}
                <div className="bg-white rounded-xl p-5 border border-slate-200">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Edit3 className="w-4 h-4 text-purple-600" />
                        </div>
                        <h4 className="font-semibold text-slate-900">Custom AI Instructions</h4>
                    </div>
                    <p className="text-sm text-slate-500 mb-4">
                        Add specific instructions or guidelines for your AI agent.
                    </p>

                    <EditableField
                        label="Custom Instructions"
                        value={aiConfig.customInstructions || ''}
                        onSave={(val) => onUpdate('aiConfig.customInstructions', val)}
                        multiline={true}
                        placeholder="e.g., Always mention our free delivery offer, never discuss competitor pricing, emphasize our 30-day return policy..."
                        helpText="These instructions help fine-tune how your AI responds to customers."
                    />
                </div>

                {/* Topics to Avoid */}
                <div className="bg-white rounded-xl p-5 border border-slate-200">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                            <Shield className="w-4 h-4 text-red-600" />
                        </div>
                        <h4 className="font-semibold text-slate-900">Topics to Avoid</h4>
                    </div>
                    <p className="text-sm text-slate-500 mb-4">
                        Add topics your AI should not discuss or be cautious about.
                    </p>

                    <TagsInput
                        items={aiConfig.topicsToAvoid || []}
                        onAdd={(tag) => onUpdate('aiConfig.topicsToAvoid', [...(aiConfig.topicsToAvoid || []), tag])}
                        onRemove={(idx) => {
                            const updated = (aiConfig.topicsToAvoid || []).filter((_: string, i: number) => i !== idx);
                            onUpdate('aiConfig.topicsToAvoid', updated);
                        }}
                        label="Avoided Topics"
                        helpText="AI will politely redirect conversations away from these topics"
                    />
                </div>

                {/* AI Insights Banner */}
                <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl p-5 text-white">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Zap className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-semibold mb-1">AI Performance Insights</h4>
                            <p className="text-sm text-violet-100 mb-3">
                                Track how your AI is performing and get suggestions for improvement.
                            </p>
                            <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">
                                View AI Analytics
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Section>
    );
}

// ===== MAIN COMPONENT =====
export default function SchemaBusinessProfile({
    persona,
    onUpdate,
    onPreviewAI,
    onProcessAI,
    onModulesGenerated,
    onImportData,
    onClearAll
}: SchemaBusinessProfileProps) {

    // Country selection for localized labels
    const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
        (persona.identity as any)?.country || 'GLOBAL'
    );

    // UI State for category modal
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
    const [categorySearch, setCategorySearch] = useState('');

    // Get currently selected categories from persona
    const selectedCategories: SelectedBusinessCategory[] = useMemo(() =>
        (persona.identity as any)?.businessCategories || EMPTY_CATEGORIES,
        [(persona.identity as any)?.businessCategories]
    );

    const [pendingSelections, setPendingSelections] = useState<string[]>(
        selectedCategories.map(c => c.functionId)
    );

    // Check if user has selected at least one category
    const hasSelectedCategories = selectedCategories.length > 0;

    // Get industries from taxonomy
    const industries = getIndustries();

    // Get the primary industry ID for schema sections
    const primaryIndustryId = useMemo(() => {
        if (selectedCategories.length > 0) {
            return selectedCategories[0].industryId;
        }
        // Fallback to persona industry category
        const category = (persona.identity as any)?.industry?.category;
        if (Array.isArray(category)) return category[0] || 'services';
        return category || 'services';
    }, [selectedCategories, persona.identity]);

    // Get profile sections based on industry/functions
    const sections = useMemo(() => {
        const baseSections = [...BUSINESS_PROFILE_CONFIG.sections];

        // Resolve expertise schema based on selected categories
        const expertiseSchema = getExpertiseSections(selectedCategories, selectedCountry);

        if (expertiseSchema.sections.length > 0) {
            const expertiseSection: SectionConfig = {
                id: 'expertise',
                title: 'Expertise & Specializations',
                icon: '⭐',
                description: 'Function-specific details across your business categories',
                industrySpecific: true,
                subSections: expertiseSchema.sections,
            };
            // Insert at position 2 (after Brand Identity and Location/Hours)
            baseSections.splice(2, 0, expertiseSection);
        }

        return baseSections;
    }, [selectedCategories, selectedCountry]);


    // Sync pending selections ONLY when modal opens
    useEffect(() => {
        if (showCategoryModal) {
            setPendingSelections(selectedCategories.map(c => c.functionId));
            setCategorySearch('');
        }
    }, [showCategoryModal]); // Only run when modal visibility changes

    // ===== IMPORT METADATA =====
    const importMeta = useMemo(() => {
        return (persona as any)?._importMeta as ImportMeta | undefined;
    }, [persona]);

    const unmappedData = useMemo(() => {
        return importMeta?.unmappedData || [];
    }, [importMeta]);

    const fieldSources = useMemo(() => {
        return importMeta?.fieldSources || {};
    }, [importMeta]);

    // Helper to check if a field was imported
    const getFieldSource = (path: string): FieldSource | undefined => {
        return fieldSources[path];
    };

    // Handlers for unmapped data
    const handleDeleteUnmappedItem = async (itemId: string) => {
        const updated = unmappedData.filter(d => d.id !== itemId);
        await onUpdate('_importMeta.unmappedData', updated);
    };

    const handleToggleAIUsage = async (itemId: string, enabled: boolean) => {
        const updated = unmappedData.map(d =>
            d.id === itemId ? { ...d, usedByAI: enabled } : d
        );
        await onUpdate('_importMeta.unmappedData', updated);
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

    // Handler for tags operations
    const handleTagsAdd = (path: string, currentTags: string[]) => async (tag: string) => {
        await onUpdate(path, [...currentTags, tag]);
    };

    const handleTagsRemove = (path: string, currentTags: string[]) => async (index: number) => {
        const next = [...currentTags];
        next.splice(index, 1);
        await onUpdate(path, next);
    };

    // Data mapping
    const name = get('identity.name');
    const tagline = get('personality.tagline');
    const score = get('setupProgress.overallPercentage', 0);

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Header Bar */}
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
                        {onProcessAI && (
                            <button onClick={onProcessAI} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-indigo-700">
                                <Zap className="w-4 h-4" /> Process for AI
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8">

                {/* Hero Header Card */}
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
                                    </div>
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
                        {/* Business Type Display Banner - Read Only */}
                        {selectedCategories.length > 0 && (
                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4 mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-indigo-600" />
                                        <span className="text-sm font-medium text-indigo-900">Business Type</span>
                                    </div>
                                    {onClearAll && (
                                        <button
                                            onClick={onClearAll}
                                            className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 flex items-center gap-1.5"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Clear All
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {selectedCategories.map((cat, idx) => (
                                        <span
                                            key={cat.functionId}
                                            className={cn(
                                                "px-3 py-1.5 rounded-lg text-sm font-medium",
                                                idx === 0
                                                    ? "bg-indigo-600 text-white"
                                                    : "bg-white border border-indigo-200 text-indigo-700"
                                            )}
                                        >
                                            {cat.label}
                                            {idx === 0 && <span className="ml-1 text-indigo-200">(Primary)</span>}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-xs text-indigo-600 mt-2">
                                    Change your business type in the Business Category section above
                                </p>
                            </div>
                        )}

                        {/* Import Data Section - Only shown after categories selected */}
                        {onImportData && (
                            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100 rounded-xl p-4 mb-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                                            <Globe className="w-5 h-5 text-teal-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-teal-900">Import Business Data</h3>
                                            <p className="text-xs text-teal-600">Import from Google Business, website, or other sources</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onImportData}
                                        className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Import Data
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Schema-Driven Sections */}
                        <div className="space-y-4">
                            {sections.map((section: SectionConfig, idx: number) => {
                                const Icon = SECTION_ICONS[section.id] || Building2;
                                const bg = SECTION_COLORS[section.id] || 'bg-slate-500';

                                // Standard section rendering
                                return (
                                    <Section
                                        key={section.id}
                                        title={section.title}
                                        icon={Icon}
                                        iconBg={bg}
                                        defaultOpen={idx === 0}
                                        description={section.description}
                                    >
                                        {/* Info Banner for Unmapped Data section */}
                                        {section.id === 'from-the-web' && (
                                            <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                                                        <AlertCircle className="w-4 h-4 text-amber-600" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-slate-800 text-sm">Unmapped Data</h4>
                                                        <p className="text-xs text-slate-600 mt-1">
                                                            This section contains data imported from Google or your website that could not be automatically
                                                            mapped to a specific field. You can edit, delete, or manually move this data to the appropriate sections above.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-6">
                                            {section.subSections.map((subSection: any) => {
                                                const SubIcon = SUBSECTION_ICONS[subSection.id] || Building2;
                                                return (
                                                    <div key={subSection.id} className="space-y-4">
                                                        {/* SubSection Header - Enhanced with Lucide Icons */}
                                                        <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                                                <SubIcon className="w-4 h-4 text-slate-600" />
                                                            </div>
                                                            <h4 className="font-semibold text-slate-800">{subSection.title}</h4>
                                                        </div>

                                                        {/* Fields */}
                                                        <div className={cn(
                                                            "grid gap-4",
                                                            subSection.fields.length > 2 ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
                                                        )}>
                                                            {subSection.fields.map((field: FieldConfig) => {
                                                                const value = get(field.schemaPath);
                                                                const currentTags = Array.isArray(value) ? value : [];
                                                                const fieldSource = getFieldSource(field.schemaPath);

                                                                // Resolve Suggested Value
                                                                let suggestedValue = undefined;
                                                                if ((persona as any)._importMeta?.mappedData) {
                                                                    const md = (persona as any)._importMeta.mappedData;
                                                                    console.log('Suggestions MappedData:', md);
                                                                    const p = field.schemaPath;

                                                                    if (p === 'identity.description') suggestedValue = md.identity?.description;
                                                                    else if (p === 'identity.companyName') suggestedValue = md.identity?.name;
                                                                    else if (p === 'identity.phone') suggestedValue = md.identity?.phone;
                                                                    else if (p === 'identity.website') suggestedValue = md.identity?.website;
                                                                    else if (p === 'identity.yearFounded') suggestedValue = md.identity?.foundedYear;
                                                                    else if (p === 'location.address.street') suggestedValue = md.location?.address;
                                                                    else if (p === 'location.address.city') suggestedValue = md.location?.city;
                                                                    else if (p === 'location.address.postalCode') suggestedValue = md.location?.zip;
                                                                    else if (p === 'personality.tagline') suggestedValue = md.personality?.tagline;
                                                                    else if (p === 'personality.uniqueSellingPoints') suggestedValue = md.personality?.uniqueSellingPoints;
                                                                }

                                                                return (
                                                                    <div
                                                                        key={field.key}
                                                                        className={cn(field.gridSpan === 2 && "lg:col-span-2")}
                                                                    >
                                                                        {/* Show source badge if field was imported */}
                                                                        {fieldSource && (
                                                                            <div className="mb-1 flex items-center">
                                                                                <SourceBadge source={fieldSource} />
                                                                            </div>
                                                                        )}
                                                                        <SchemaField
                                                                            field={field}
                                                                            value={value}
                                                                            suggestedValue={suggestedValue}
                                                                            onChange={(val) => onUpdate(field.schemaPath, val)}
                                                                            onTagsAdd={handleTagsAdd(field.schemaPath, currentTags)}
                                                                            onTagsRemove={handleTagsRemove(field.schemaPath, currentTags)}
                                                                        />
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>


                                        {/* Legacy support for unmapped "From the Web" items */}
                                        {
                                            section.id === 'from-the-web' && unmappedData.length > 0 && (
                                                <div className="mt-8 border-t border-slate-100 pt-6">
                                                    <h4 className="flex items-center gap-2 font-semibold text-slate-800 mb-4">
                                                        <Globe className="w-4 h-4 text-slate-400" />
                                                        Unmapped Data (Legacy)
                                                    </h4>
                                                    <FromTheWebSection
                                                        items={unmappedData}
                                                        onDelete={handleDeleteUnmappedItem}
                                                        onToggleAI={handleToggleAIUsage}
                                                        onImportData={onImportData}
                                                    />
                                                </div>
                                            )
                                        }
                                    </Section>
                                );
                            })}
                        </div>

                        {/* 7. AI Strategy (Enhanced) */}
                        <AIStrategySection
                            persona={persona}
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
            {
                showCategoryModal && (
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
                                        let functionsToShow: ResolvedFunction[] = [];

                                        if (categorySearch.trim()) {
                                            functionsToShow = searchFunctions(categorySearch, selectedCountry);
                                        } else if (selectedIndustry) {
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
                                            const categories = toSelectedCategories(pendingSelections, selectedCountry);

                                            await onUpdate('identity.businessCategories', categories);
                                            await onUpdate('identity.country', selectedCountry);

                                            if (categories.length > 0) {
                                                const firstInfo = findFunctionInfo(categories[0].functionId, selectedCountry);
                                                if (firstInfo.function && firstInfo.industry) {
                                                    await onUpdate('identity.industry', {
                                                        name: firstInfo.displayLabel,
                                                        category: firstInfo.industry.industryId
                                                    });
                                                }

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
                )
            }
        </div >
    );
}
