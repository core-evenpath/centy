"use client";

import React, { useState, useEffect } from 'react';
import { getPartnerModulesAction, getModuleItemsAction } from '@/actions/modules-actions';

interface AIFieldAssistProps {
    partnerId: string;
    moduleSlug?: string;
    field?: string;
    aiPrompt?: string;
    value: string;
    onChange: (value: string) => void;
    label: string;
    placeholder?: string;
}

interface ModuleItem {
    id: string;
    [key: string]: any;
}

export function AIFieldAssist({
    partnerId,
    moduleSlug,
    field,
    aiPrompt,
    value,
    onChange,
    label,
    placeholder = 'Type a value...',
}: AIFieldAssistProps) {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        if (!moduleSlug || !field) return;

        const fetchSuggestions = async () => {
            setLoading(true);
            try {
                const modulesRes = await getPartnerModulesAction(partnerId);
                if (!modulesRes.success) return;

                const mod = modulesRes.modules?.find(
                    (m: any) => m.slug === moduleSlug || m.name?.toLowerCase().replace(/\s+/g, '-') === moduleSlug
                );
                if (!mod) return;

                const itemsRes = await getModuleItemsAction(partnerId, mod.id);
                if (!itemsRes.success || !itemsRes.items) return;

                const values = (itemsRes.items as ModuleItem[])
                    .map(item => item[field] || item.name || '')
                    .filter(Boolean)
                    .slice(0, 10);

                setSuggestions([...new Set(values)]);
            } catch (err) {
                console.error('AIFieldAssist fetch error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSuggestions();
    }, [partnerId, moduleSlug, field]);

    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">{label}</label>
            {aiPrompt && (
                <p className="text-[10px] text-indigo-500 italic">{aiPrompt}</p>
            )}
            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 pr-9 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                />
                {moduleSlug && (
                    <button
                        type="button"
                        onClick={() => setShowSuggestions(!showSuggestions)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-base hover:scale-110 transition-transform"
                        title="Show suggestions from inventory"
                    >
                        {loading ? '⏳' : '🤖'}
                    </button>
                )}

                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {suggestions.map((s, i) => (
                            <button
                                key={i}
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    onChange(s);
                                    setShowSuggestions(false);
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2"
                            >
                                <span className="text-xs text-indigo-400">🤖</span> {s}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
