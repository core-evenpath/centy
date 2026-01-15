'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    Building2, MapPin, Target, Shield, Globe, ChevronDown,
    Edit3, Check, X, Plus, Sparkles, LucideIcon, Clock, HelpCircle
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
    'brand-identity': 'bg-gradient-to-br from-indigo-500 to-indigo-600',
    'location-hours': 'bg-gradient-to-br from-blue-500 to-blue-600',
    'expertise': 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    'audience-positioning': 'bg-gradient-to-br from-amber-500 to-amber-600',
    'trust-support': 'bg-gradient-to-br from-purple-500 to-purple-600',
    'from-the-web': 'bg-gradient-to-br from-pink-500 to-pink-600',
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
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-5 flex items-center gap-4 hover:bg-slate-50/50 transition-all duration-150"
            >
                <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shadow-lg", iconBg)}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                    <h3 className="font-semibold text-slate-900 text-[15px]">{title}</h3>
                    {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
                </div>
                <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200",
                    isOpen ? "bg-slate-100 rotate-180" : "bg-transparent"
                )}>
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                </div>
            </button>
            <div className={cn(
                "overflow-hidden transition-all duration-300 ease-out",
                isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
            )}>
                <div className="px-6 pb-6 pt-2 border-t border-slate-100">
                    {children}
                </div>
            </div>
        </div>
    );
}

// ===== FIELD LABEL COMPONENT =====
function FieldLabel({
    label,
    helpText,
    badge,
    required
}: {
    label: string;
    helpText?: string;
    badge?: string;
    required?: boolean;
}) {
    return (
        <div className="mb-2">
            <div className="flex items-center gap-2">
                <label className="text-[13px] font-semibold text-slate-700">{label}</label>
                {required && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                {badge && (
                    <span className="px-2 py-0.5 bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-600 text-[10px] font-semibold rounded-full border border-indigo-100">
                        {badge}
                    </span>
                )}
            </div>
            {helpText && (
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{helpText}</p>
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
    const [saving, setSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

    useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [editing]);

    const handleSave = async () => {
        setSaving(true);
        await onSave(tempValue);
        setSaving(false);
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
        <div className="group">
            <FieldLabel label={label} helpText={helpText} badge={badge} />

            <div className={cn(
                "relative rounded-xl transition-all duration-200",
                editing ? "ring-2 ring-indigo-500/20" : ""
            )}>
                {editing ? (
                    <div className="flex items-start gap-2">
                        {multiline ? (
                            <textarea
                                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                                value={tempValue}
                                onChange={(e) => setTempValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="flex-1 px-4 py-3 bg-white border border-indigo-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 min-h-[100px] resize-none transition-all duration-150"
                                placeholder={placeholder}
                            />
                        ) : (
                            <input
                                ref={inputRef as React.RefObject<HTMLInputElement>}
                                value={tempValue}
                                onChange={(e) => setTempValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="flex-1 px-4 py-3 bg-white border border-indigo-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-150"
                                placeholder={placeholder}
                            />
                        )}
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="p-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-200/50 transition-all duration-150 disabled:opacity-50"
                        >
                            <Check className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => { setTempValue(value || ''); setEditing(false); }}
                            className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all duration-150"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div
                        onClick={() => setEditing(true)}
                        className={cn(
                            "px-4 py-3 rounded-xl cursor-pointer flex items-center justify-between transition-all duration-150",
                            "bg-slate-50/80 hover:bg-slate-100 border border-transparent hover:border-slate-200",
                            value ? "" : "border-dashed border-slate-200"
                        )}
                    >
                        <span className={cn(
                            "text-sm whitespace-pre-wrap leading-relaxed",
                            value ? 'text-slate-700' : 'text-slate-400'
                        )}>
                            {value || placeholder}
                        </span>
                        <Edit3 className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 flex-shrink-0 ml-3 transition-opacity duration-150" />
                    </div>
                )}
            </div>
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
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isAdding && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isAdding]);

    const handleAdd = () => {
        if (newValue.trim()) {
            onAdd(newValue.trim());
            setNewValue('');
            // Keep adding mode active
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
        }
        if (e.key === 'Escape') {
            setIsAdding(false);
            setNewValue('');
        }
        if (e.key === 'Backspace' && !newValue && items.length > 0) {
            onRemove(items.length - 1);
        }
    };

    return (
        <div>
            <FieldLabel label={label} helpText={helpText} />

            <div className={cn(
                "flex flex-wrap gap-2 p-3 rounded-xl border transition-all duration-150 min-h-[50px]",
                isAdding
                    ? "bg-white border-indigo-200 ring-4 ring-indigo-500/10"
                    : "bg-slate-50/80 border-transparent hover:border-slate-200"
            )}>
                {items.map((item, i) => (
                    <span
                        key={i}
                        className="group/tag px-3 py-1.5 text-sm font-medium rounded-lg bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 border border-indigo-100 flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200"
                    >
                        {item}
                        <button
                            onClick={() => onRemove(i)}
                            className="w-4 h-4 rounded-full bg-indigo-200/50 hover:bg-indigo-300 flex items-center justify-center transition-colors"
                        >
                            <X className="w-2.5 h-2.5 text-indigo-600" />
                        </button>
                    </span>
                ))}
                {isAdding ? (
                    <input
                        ref={inputRef}
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={() => {
                            if (newValue.trim()) handleAdd();
                            else setIsAdding(false);
                        }}
                        className="flex-1 min-w-[120px] px-2 py-1 text-sm bg-transparent focus:outline-none placeholder:text-slate-400"
                        placeholder="Type and press Enter..."
                    />
                ) : (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="px-3 py-1.5 text-sm text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-dashed border-slate-300 hover:border-indigo-300 flex items-center gap-1.5 transition-all duration-150"
                    >
                        <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                )}
            </div>
        </div>
    );
}

// ===== TOGGLE COMPONENT =====
function Toggle({
    value,
    onChange,
    label,
    helpText
}: {
    value: boolean;
    onChange: (val: boolean) => void;
    label: string;
    helpText?: string
}) {
    return (
        <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50/80 hover:bg-slate-100 transition-colors duration-150 group">
            <div className="flex-1">
                <label className="text-sm font-medium text-slate-700 cursor-pointer" onClick={() => onChange(!value)}>
                    {label}
                </label>
                {helpText && <p className="text-xs text-slate-400 mt-0.5">{helpText}</p>}
            </div>
            <button
                onClick={() => onChange(!value)}
                className={cn(
                    "relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ease-out",
                    value
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 shadow-lg shadow-indigo-200/50"
                        : "bg-slate-200"
                )}
            >
                <span className={cn(
                    "inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-all duration-300 ease-out",
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
    placeholder = "Select an option..."
}: {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (val: string) => void;
    helpText?: string;
    placeholder?: string;
}) {
    return (
        <div>
            <FieldLabel label={label} helpText={helpText} />
            <div className="relative group">
                <select
                    className={cn(
                        "w-full px-4 py-3 rounded-xl text-sm appearance-none cursor-pointer transition-all duration-150",
                        "border bg-slate-50/80 hover:bg-slate-100 focus:bg-white",
                        "focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10",
                        value ? "border-slate-200 text-slate-700" : "border-dashed border-slate-300 text-slate-400"
                    )}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                >
                    <option value="" disabled>{placeholder}</option>
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center pointer-events-none shadow-sm">
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
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
        <div>
            <FieldLabel label={label} helpText={helpText} />
            <div className="flex flex-wrap gap-2">
                {options.map(opt => {
                    const isSelected = values.includes(opt.value);
                    return (
                        <button
                            key={opt.value}
                            onClick={() => toggleOption(opt.value)}
                            className={cn(
                                "px-4 py-2 text-sm rounded-xl border-2 transition-all duration-200 flex items-center gap-2",
                                isSelected
                                    ? "bg-gradient-to-r from-indigo-50 to-violet-50 border-indigo-300 text-indigo-700 shadow-sm"
                                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                            )}
                        >
                            <div className={cn(
                                "w-4 h-4 rounded-md flex items-center justify-center transition-all duration-200",
                                isSelected
                                    ? "bg-indigo-600"
                                    : "border-2 border-slate-300"
                            )}>
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            {opt.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ===== SCHEDULE DISPLAY COMPONENT =====
function ScheduleDisplay({ value, label }: { value: any; label: string }) {
    const days = [
        { key: 'monday', short: 'Mon' },
        { key: 'tuesday', short: 'Tue' },
        { key: 'wednesday', short: 'Wed' },
        { key: 'thursday', short: 'Thu' },
        { key: 'friday', short: 'Fri' },
        { key: 'saturday', short: 'Sat' },
        { key: 'sunday', short: 'Sun' },
    ];
    const isStructured = value && typeof value === 'object' && !Array.isArray(value);

    return (
        <div>
            <FieldLabel label={label} />
            <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl p-4 border border-slate-200/80">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2 text-slate-500">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">Business Hours</span>
                    </div>
                    <button className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors">
                        Edit Schedule
                    </button>
                </div>
                {isStructured ? (
                    <div className="space-y-1.5">
                        {days.map(({ key, short }) => {
                            const schedule = value[key];
                            if (!schedule) return null;
                            const isOpen = schedule.isOpen !== false && (schedule.open || schedule.openTime);
                            const openTime = schedule.openTime || schedule.open || '';
                            const closeTime = schedule.closeTime || schedule.close || '';
                            return (
                                <div key={key} className={cn(
                                    "flex justify-between items-center py-2 px-3 rounded-lg text-sm transition-colors",
                                    isOpen ? "bg-white" : "bg-transparent"
                                )}>
                                    <span className={cn(
                                        "font-medium w-12",
                                        isOpen ? "text-slate-700" : "text-slate-400"
                                    )}>{short}</span>
                                    <span className={cn(
                                        "font-mono text-xs",
                                        isOpen ? "text-emerald-600" : "text-slate-400"
                                    )}>
                                        {isOpen ? `${openTime} – ${closeTime}` : 'Closed'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-6 text-slate-400">
                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No schedule configured</p>
                        <button className="mt-2 text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                            + Add Hours
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ===== FAQ LIST COMPONENT =====
function FAQList({ faqs, label }: { faqs: { question: string; answer: string }[]; label: string }) {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    return (
        <div>
            <FieldLabel label={label} />
            {faqs.length > 0 ? (
                <div className="space-y-2">
                    {faqs.map((faq, i) => (
                        <div
                            key={i}
                            className="rounded-xl border border-slate-200 overflow-hidden bg-white hover:shadow-sm transition-shadow"
                        >
                            <button
                                onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors"
                            >
                                <span className="text-sm font-medium text-slate-800">{faq.question}</span>
                                <ChevronDown className={cn(
                                    "w-4 h-4 text-slate-400 transition-transform duration-200",
                                    expandedIndex === i && "rotate-180"
                                )} />
                            </button>
                            <div className={cn(
                                "overflow-hidden transition-all duration-200",
                                expandedIndex === i ? "max-h-40" : "max-h-0"
                            )}>
                                <div className="px-4 pb-3 text-sm text-slate-600 border-t border-slate-100 pt-3">
                                    {faq.answer}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                    <HelpCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm text-slate-500 mb-2">No FAQs added yet</p>
                    <button className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors">
                        + Add Your First FAQ
                    </button>
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
                        <div className="space-y-8">
                            {section.subSections.map(subSection => (
                                <div key={subSection.id} className="space-y-4">
                                    {/* SubSection Header */}
                                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                                        {subSection.icon && (
                                            <span className="text-xl">{subSection.icon}</span>
                                        )}
                                        <h4 className="font-semibold text-slate-800">{subSection.title}</h4>
                                    </div>

                                    {/* Fields Grid */}
                                    <div className={cn(
                                        "grid gap-5",
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
