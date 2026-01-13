'use client';

import React, { useState } from 'react';
import {
    Building2, MapPin, Target, Shield, Globe, ChevronDown,
    Edit3, Check, X, Plus, Sparkles, LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BusinessPersona } from '@/lib/business-persona-types';
import {
    getProfileSections,
    type SectionConfig,
    type SubSectionConfig,
    type FieldConfig,
} from '@/lib/schemas';

// ===== SECTION ICON & COLOR MAPPINGS =====
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

// ===== COLLAPSIBLE SECTION COMPONENT =====
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
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors"
            >
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconBg)}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                    <h3 className="font-semibold text-slate-900">{title}</h3>
                    {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
                </div>
                <ChevronDown className={cn(
                    "w-5 h-5 text-slate-400 transition-transform",
                    isOpen && "rotate-180"
                )} />
            </button>
            {isOpen && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-100">
                    {children}
                </div>
            )}
        </div>
    );
}

// ===== EDITABLE FIELD COMPONENT =====
function EditableField({
    label,
    value,
    onSave,
    multiline = false,
    placeholder = "Click to add...",
    helpText,
    badge
}: {
    label: string;
    value: string;
    onSave: (val: string) => Promise<void>;
    multiline?: boolean;
    placeholder?: string;
    helpText?: string;
    badge?: string;
}) {
    const [editing, setEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value || '');

    const handleSave = async () => {
        await onSave(tempValue);
        setEditing(false);
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
        <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
                <label className="text-xs font-medium text-slate-500 uppercase">{label}</label>
                {badge && <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-600 text-[10px] font-medium rounded">{badge}</span>}
            </div>
            {helpText && <p className="text-xs text-slate-400 mb-1">{helpText}</p>}

            {editing ? (
                <div className="flex items-start gap-2">
                    {multiline ? (
                        <textarea
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="flex-1 px-3 py-2 border border-indigo-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                            autoFocus
                        />
                    ) : (
                        <input
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="flex-1 px-3 py-2 border border-indigo-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            autoFocus
                        />
                    )}
                    <button onClick={handleSave} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                        <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setTempValue(value || ''); setEditing(false); }} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <div
                    onClick={() => setEditing(true)}
                    className="px-3 py-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 flex items-center justify-between group min-h-[38px]"
                >
                    <span className={cn("text-sm whitespace-pre-wrap", value ? 'text-slate-700' : 'text-slate-400 italic')}>
                        {value || placeholder}
                    </span>
                    <Edit3 className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 flex-shrink-0 ml-2" />
                </div>
            )}
        </div>
    );
}

// ===== TAGS INPUT COMPONENT =====
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

// ===== TOGGLE COMPONENT =====
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

// ===== SELECT COMPONENT =====
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

// ===== MULTI-SELECT COMPONENT =====
function MultiSelectField({
    label,
    values,
    options,
    onChange,
    helpText
}: {
    label: string;
    values: string[];
    options: { value: string; label: string; icon?: string; description?: string }[];
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

    // Check if any option has icons - if so, use grid layout
    const hasIcons = options.some(opt => opt.icon);

    return (
        <div className="mb-4">
            <label className="text-xs font-medium text-slate-500 uppercase mb-1 block">{label}</label>
            {helpText && <p className="text-xs text-slate-400 mb-2">{helpText}</p>}
            <div className={cn(
                hasIcons
                    ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2"
                    : "flex flex-wrap gap-2"
            )}>
                {options.map(opt => {
                    const isSelected = values.includes(opt.value);
                    return (
                        <button
                            key={opt.value}
                            onClick={() => toggleOption(opt.value)}
                            className={cn(
                                "text-sm rounded-lg border transition-all",
                                hasIcons ? "p-2.5 flex flex-col items-center gap-1 min-h-[60px]" : "px-3 py-1.5",
                                isSelected
                                    ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm"
                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                            )}
                            title={opt.description}
                        >
                            {opt.icon && <span className="text-lg">{opt.icon}</span>}
                            <span className={cn(hasIcons && "text-xs text-center leading-tight")}>{opt.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ===== SCHEDULE DISPLAY COMPONENT =====
function ScheduleDisplay({ value, label }: { value: any; label: string }) {
    const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const isStructured = value && typeof value === 'object' && !Array.isArray(value);

    return (
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-4">
            <div className="flex justify-between items-start mb-2">
                <label className="text-xs font-medium text-slate-500 uppercase block">{label}</label>
                <button className="text-xs font-medium text-indigo-600 hover:text-indigo-700">Edit</button>
            </div>
            {isStructured ? (
                <div className="space-y-1">
                    {dayOrder.map(day => {
                        const schedule = value[day];
                        if (!schedule) return null;
                        const isOpen = schedule.isOpen !== false && (schedule.open || schedule.openTime);
                        const openTime = schedule.openTime || schedule.open || '';
                        const closeTime = schedule.closeTime || schedule.close || '';
                        return (
                            <div key={day} className="flex justify-between text-sm">
                                <span className="text-slate-600 capitalize w-24">{day}</span>
                                <span className={isOpen ? 'text-slate-700 font-medium' : 'text-slate-400'}>
                                    {isOpen ? `${openTime} - ${closeTime}` : 'Closed'}
                                </span>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-sm text-slate-500 italic">
                    {typeof value === 'string' ? value : 'No schedule configured'}
                </div>
            )}
        </div>
    );
}

// ===== FAQ LIST COMPONENT =====
function FAQList({ faqs, label }: { faqs: { question: string; answer: string }[]; label: string }) {
    return (
        <div className="mb-4">
            <label className="text-xs font-medium text-slate-500 uppercase mb-2 block">{label}</label>
            {faqs.length > 0 ? (
                <div className="space-y-2">
                    {faqs.map((faq, i) => (
                        <div key={i} className="p-3 bg-slate-50 rounded-lg text-sm border border-slate-200">
                            <div className="font-medium text-slate-900">{faq.question}</div>
                            <div className="text-slate-600 mt-1">{faq.answer}</div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center p-4 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500">
                    No FAQs configured yet
                </div>
            )}
        </div>
    );
}

// ===== SCHEMA FIELD RENDERER =====
function SchemaField({
    field,
    value,
    onChange,
    onTagsAdd,
    onTagsRemove
}: {
    field: FieldConfig;
    value: any;
    onChange: (val: any) => Promise<void>;
    onTagsAdd: (tag: string) => void;
    onTagsRemove: (idx: number) => void;
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
            return <ScheduleDisplay value={value} label={field.label} />;

        case 'faq-list':
            return <FAQList faqs={Array.isArray(value) ? value : []} label={field.label} />;

        case 'textarea':
            return (
                <EditableField
                    label={field.label}
                    value={typeof value === 'string' ? value : ''}
                    onSave={onChange}
                    multiline={true}
                    placeholder={field.placeholder}
                    helpText={field.helpText}
                    badge={field.validation?.required ? 'Required' : undefined}
                />
            );

        default:
            return (
                <EditableField
                    label={field.label}
                    value={typeof value === 'string' ? value : (value?.toString() || '')}
                    onSave={onChange}
                    placeholder={field.placeholder}
                    helpText={field.helpText}
                    badge={field.validation?.required ? 'Required' : undefined}
                />
            );
    }
}

// ===== MAIN SCHEMA PROFILE RENDERER =====
interface SchemaProfileRendererProps {
    persona: Partial<BusinessPersona>;
    industryId: string;
    onUpdate: (path: string, value: any) => Promise<void>;
}

export function SchemaProfileRenderer({ persona, industryId, onUpdate }: SchemaProfileRendererProps) {
    // Get sections from schema
    const sections = getProfileSections(industryId);

    // Helper to get nested value from persona
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

    return (
        <div className="space-y-4">
            {sections.map((section, idx) => {
                const Icon = SECTION_ICONS[section.id] || Building2;
                const bg = SECTION_COLORS[section.id] || 'bg-slate-500';

                return (
                    <Section
                        key={section.id}
                        title={section.title}
                        icon={Icon}
                        iconBg={bg}
                        defaultOpen={idx === 0}
                        description={section.description}
                    >
                        <div className="space-y-6">
                            {section.subSections.map(subSection => (
                                <div key={subSection.id} className="space-y-3">
                                    {/* SubSection Header */}
                                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                        {subSection.icon && <span className="text-lg">{subSection.icon}</span>}
                                        <h4 className="font-medium text-slate-800">{subSection.title}</h4>
                                    </div>

                                    {/* Fields */}
                                    <div className={cn(
                                        "grid gap-4",
                                        subSection.fields.length > 2 ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
                                    )}>
                                        {subSection.fields.map(field => {
                                            const value = get(field.schemaPath);
                                            const currentTags = Array.isArray(value) ? value : [];

                                            return (
                                                <div
                                                    key={field.key}
                                                    className={cn(field.gridSpan === 2 && "lg:col-span-2")}
                                                >
                                                    <SchemaField
                                                        field={field}
                                                        value={value}
                                                        onChange={(val) => onUpdate(field.schemaPath, val)}
                                                        onTagsAdd={handleTagsAdd(field.schemaPath, currentTags)}
                                                        onTagsRemove={handleTagsRemove(field.schemaPath, currentTags)}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Section>
                );
            })}
        </div>
    );
}

export default SchemaProfileRenderer;
