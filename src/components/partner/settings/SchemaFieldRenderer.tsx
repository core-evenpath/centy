'use client';

import React, { useState, useMemo } from 'react';
import {
    ChevronDown, ChevronRight, Check, X, Plus, Trash2, Info,
    Tag, ToggleLeft, ToggleRight, Calendar, Clock, Image, HelpCircle,
    Building2, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCategorySchema, type CategorySchema } from '@/lib/business-schemas';

interface SchemaFieldRendererProps {
    schema: CategorySchema;
    data: Record<string, any>;
    onUpdate: (path: string, value: any) => Promise<void>;
    readOnly?: boolean;
}

interface FieldOption {
    value: string;
    label: string;
}

interface FieldSchema {
    type: string;
    required?: boolean;
    label: string;
    options?: FieldOption[];
    placeholder?: string;
    properties?: Record<string, any>;
    item_schema?: Record<string, any>;
    condition?: { field: string; includes?: string[] };
}

// ===== INDIVIDUAL FIELD COMPONENTS =====

const TextField = ({
    value, onChange, placeholder, label, required
}: {
    value: string; onChange: (v: string) => void; placeholder?: string; label: string; required?: boolean;
}) => (
    <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
    />
);

const TextAreaField = ({
    value, onChange, placeholder, label
}: {
    value: string; onChange: (v: string) => void; placeholder?: string; label: string;
}) => (
    <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
        rows={3}
        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
    />
);

const SelectField = ({
    value, onChange, options, label, placeholder
}: {
    value: string; onChange: (v: string) => void; options: FieldOption[]; label: string; placeholder?: string;
}) => (
    <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
    >
        <option value="">{placeholder || `Select ${label.toLowerCase()}...`}</option>
        {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
    </select>
);

const MultiSelectField = ({
    value = [], onChange, options, label
}: {
    value: string[]; onChange: (v: string[]) => void; options: FieldOption[]; label: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const selected = Array.isArray(value) ? value : [];

    const toggle = (optValue: string) => {
        if (selected.includes(optValue)) {
            onChange(selected.filter(v => v !== optValue));
        } else {
            onChange([...selected, optValue]);
        }
    };

    const selectedLabels = selected
        .map(v => options.find(o => o.value === v)?.label || v)
        .join(', ');

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-left flex items-center justify-between bg-white hover:border-slate-300"
            >
                <span className={cn("truncate", !selectedLabels && "text-slate-400")}>
                    {selectedLabels || `Select ${label.toLowerCase()}...`}
                </span>
                <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", isOpen && "rotate-180")} />
            </button>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg py-1">
                        {options.map((opt) => (
                            <label
                                key={opt.value}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={selected.includes(opt.value)}
                                    onChange={() => toggle(opt.value)}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-slate-700">{opt.label}</span>
                            </label>
                        ))}
                    </div>
                </>
            )}
            {selected.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                    {selected.map(v => {
                        const opt = options.find(o => o.value === v);
                        return (
                            <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">
                                {opt?.label || v}
                                <button onClick={() => toggle(v)} className="hover:text-indigo-900">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const BooleanField = ({
    value, onChange, label
}: {
    value: boolean; onChange: (v: boolean) => void; label: string;
}) => (
    <button
        type="button"
        onClick={() => onChange(!value)}
        className="flex items-center gap-3"
    >
        <div className={cn(
            "w-12 h-6 rounded-full transition-colors relative",
            value ? "bg-indigo-600" : "bg-slate-200"
        )}>
            <span className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow",
                value ? "left-7" : "left-1"
            )} />
        </div>
        <span className="text-sm text-slate-600">{value ? 'Yes' : 'No'}</span>
    </button>
);

const CurrencyField = ({
    value, onChange, label
}: {
    value: number | string; onChange: (v: number) => void; label: string;
}) => (
    <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
        <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(Number(e.target.value))}
            placeholder="0"
            className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
    </div>
);

const NumberField = ({
    value, onChange, label, placeholder
}: {
    value: number | string; onChange: (v: number) => void; label: string; placeholder?: string;
}) => (
    <input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(Number(e.target.value))}
        placeholder={placeholder || '0'}
        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
);

const ObjectField = ({
    value = {}, onChange, properties, label
}: {
    value: Record<string, any>; onChange: (v: Record<string, any>) => void; properties: Record<string, any>; label: string;
}) => {
    const updateProperty = (key: string, val: any) => {
        onChange({ ...value, [key]: val });
    };

    return (
        <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50/50">
            {Object.entries(properties).map(([key, propSchema]: [string, any]) => (
                <div key={key}>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                        {propSchema.label}
                    </label>
                    <TextField
                        value={value[key] || ''}
                        onChange={(v) => updateProperty(key, v)}
                        label={propSchema.label}
                    />
                </div>
            ))}
        </div>
    );
};

// ===== FIELD WRAPPER =====

const FieldWrapper = ({
    field,
    fieldKey,
    fieldSchema,
    value,
    onChange,
}: {
    field: string;
    fieldKey: string;
    fieldSchema: FieldSchema;
    value: any;
    onChange: (v: any) => void;
}) => {
    const renderField = () => {
        switch (fieldSchema.type) {
            case 'string':
            case 'text':
                return <TextField value={value} onChange={onChange} label={fieldSchema.label} placeholder={fieldSchema.placeholder} required={fieldSchema.required} />;
            case 'textarea':
                return <TextAreaField value={value} onChange={onChange} label={fieldSchema.label} placeholder={fieldSchema.placeholder} />;
            case 'enum':
                return <SelectField value={value} onChange={onChange} options={fieldSchema.options || []} label={fieldSchema.label} />;
            case 'multi_select':
                return <MultiSelectField value={value} onChange={onChange} options={fieldSchema.options || []} label={fieldSchema.label} />;
            case 'boolean':
                return <BooleanField value={!!value} onChange={onChange} label={fieldSchema.label} />;
            case 'number':
                return <NumberField value={value} onChange={onChange} label={fieldSchema.label} />;
            case 'currency':
                return <CurrencyField value={value} onChange={onChange} label={fieldSchema.label} />;
            case 'object':
                return <ObjectField value={value || {}} onChange={onChange} properties={fieldSchema.properties || {}} label={fieldSchema.label} />;
            default:
                return <TextField value={value} onChange={onChange} label={fieldSchema.label} />;
        }
    };

    return (
        <div className="space-y-1">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                {fieldSchema.label}
                {fieldSchema.required && <span className="text-red-500">*</span>}
            </label>
            {renderField()}
        </div>
    );
};

// ===== SECTION COMPONENT =====

const SchemaSection = ({
    sectionKey,
    sectionSchema,
    data,
    onUpdate,
    allData,
}: {
    sectionKey: string;
    sectionSchema: Record<string, FieldSchema>;
    data: Record<string, any>;
    onUpdate: (fieldKey: string, value: any) => void;
    allData: Record<string, any>;
}) => {
    const [isOpen, setIsOpen] = useState(sectionKey === 'core_identity');

    // Calculate completion
    const fields = Object.entries(sectionSchema);
    const filledFields = fields.filter(([key, schema]) => {
        const value = data?.[key];
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'object') return Object.keys(value || {}).length > 0;
        return value !== undefined && value !== null && value !== '';
    });
    const completion = fields.length > 0 ? Math.round((filledFields.length / fields.length) * 100) : 0;

    // Section title from key
    const sectionTitle = sectionKey
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    // Check field visibility based on conditions
    const isFieldVisible = (schema: FieldSchema) => {
        if (!schema.condition) return true;
        const { field, includes } = schema.condition;
        const [section, key] = field.split('.');
        const fieldValue = allData?.[section]?.[key];
        if (includes && Array.isArray(includes)) {
            return includes.includes(fieldValue);
        }
        return true;
    };

    const visibleFields = fields.filter(([_, schema]) => isFieldVisible(schema));

    if (visibleFields.length === 0) return null;

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        completion === 100 ? "bg-emerald-100" : "bg-indigo-100"
                    )}>
                        {completion === 100 ? (
                            <Check className="w-5 h-5 text-emerald-600" />
                        ) : (
                            <Building2 className="w-5 h-5 text-indigo-600" />
                        )}
                    </div>
                    <div className="text-left">
                        <h3 className="font-semibold text-slate-900">{sectionTitle}</h3>
                        <p className="text-xs text-slate-500">
                            {filledFields.length}/{fields.length} fields • {completion}% complete
                        </p>
                    </div>
                </div>
                <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="px-5 pb-5 border-t border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        {visibleFields.map(([fieldKey, fieldSchema]) => (
                            <div key={fieldKey} className={cn(
                                fieldSchema.type === 'textarea' || fieldSchema.type === 'object' || fieldSchema.type === 'multi_select'
                                    ? 'md:col-span-2'
                                    : ''
                            )}>
                                <FieldWrapper
                                    field={fieldKey}
                                    fieldKey={fieldKey}
                                    fieldSchema={fieldSchema}
                                    value={data?.[fieldKey]}
                                    onChange={(value) => onUpdate(fieldKey, value)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ===== MAIN COMPONENT =====

export default function SchemaFieldRenderer({
    schema,
    data,
    onUpdate,
    readOnly = false,
}: SchemaFieldRendererProps) {
    // Get sections from schema
    const sections = useMemo(() => {
        return Object.entries(schema.expertise_schema || {});
    }, [schema]);

    // Handle field update
    const handleFieldUpdate = async (sectionKey: string, fieldKey: string, value: any) => {
        const path = `industrySpecificData.${schema.category_id}.${sectionKey}.${fieldKey}`;
        await onUpdate(path, value);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900">{schema.category_label} Profile</h2>
                    <p className="text-sm text-slate-500">Complete your business profile with industry-specific details</p>
                </div>
            </div>

            {/* Sections */}
            {sections.map(([sectionKey, sectionSchema]) => {
                // Skip LLM usage context (internal config)
                if (sectionKey === 'llm_usage_context') return null;

                return (
                    <SchemaSection
                        key={sectionKey}
                        sectionKey={sectionKey}
                        sectionSchema={sectionSchema as Record<string, FieldSchema>}
                        data={data?.[sectionKey] || {}}
                        allData={data}
                        onUpdate={(fieldKey, value) => handleFieldUpdate(sectionKey, fieldKey, value)}
                    />
                );
            })}
        </div>
    );
}
