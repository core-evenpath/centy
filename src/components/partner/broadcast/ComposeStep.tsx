"use client";

import React, { useState } from 'react';
import { VariableMapping } from '@/lib/template-variable-engine';
import { VariableDefinition, Contact } from '@/lib/types';
import { PhonePreview } from './PhonePreview';
import { EnhancementToggles } from './EnhancementToggles';
import { AIFieldAssist } from './AIFieldAssist';
import { CSVVariableUpload } from './CSVVariableUpload';
import { SlidePanel } from './SlidePanel';

interface Enhancements {
    image: boolean;
    buttons: boolean;
    link: boolean;
    personalize: boolean;
}

interface ComposeStepProps {
    message: string;
    setMessage: (msg: string) => void;
    mappings: VariableMapping[];
    variableMap?: VariableDefinition[];
    staticValues: Record<string, string>;
    onStaticValueChange: (variable: string, value: string) => void;
    csvVariableData: Map<string, Record<string, string>> | null;
    onCsvDataChange: (data: Map<string, Record<string, string>>) => void;
    channel: 'whatsapp' | 'telegram';
    headerImage: string | null;
    setHeaderImage: (url: string | null) => void;
    quickReplies: string[];
    setQuickReplies: (btns: string[]) => void;
    ctaButtons: { type: string; text: string; value: string }[];
    setCtaButtons: (btns: { type: string; text: string; value: string }[]) => void;
    footerText: string;
    setFooterText: (text: string) => void;
    businessName: string;
    partnerId: string;
    contacts: Contact[];
    enhancements: Enhancements;
    setEnhancements: (e: Enhancements) => void;
}

export function ComposeStep({
    message,
    setMessage,
    mappings,
    variableMap,
    staticValues,
    onStaticValueChange,
    csvVariableData,
    onCsvDataChange,
    channel,
    headerImage,
    setHeaderImage,
    quickReplies,
    setQuickReplies,
    ctaButtons,
    setCtaButtons,
    footerText,
    setFooterText,
    businessName,
    partnerId,
    contacts,
    enhancements,
    setEnhancements,
}: ComposeStepProps) {
    const [activePanel, setActivePanel] = useState<string | null>(null);
    const [showCsvUpload, setShowCsvUpload] = useState(false);

    const staticMappings = mappings.filter(m => m.source === 'static' || m.source === 'module');
    const autoMappings = mappings.filter(m => m.source === 'contact' || m.source === 'business');
    const variableTokens = staticMappings.map(m => m.variable);

    const handleEnhancementOpen = (key: string) => {
        if (key === 'personalize') {
            setActivePanel('personalize');
        } else if (key === 'image') {
            setActivePanel('image');
        } else if (key === 'buttons') {
            setActivePanel('buttons');
        } else if (key === 'link') {
            setActivePanel('link');
        }
    };

    return (
        <div className="flex gap-6 h-full">
            {/* Left: Editor */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-4">
                {/* Message Body */}
                <div>
                    <label className="text-sm font-semibold text-gray-900 mb-2 block">Message Body</label>
                    <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        rows={8}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 resize-none"
                        placeholder="Type your broadcast message here..."
                    />
                    <div className="flex items-center justify-between mt-1.5 px-1">
                        <span className="text-[11px] text-gray-400">{message.length} characters</span>
                        {mappings.length > 0 && (
                            <span className="text-[11px] text-indigo-500 font-medium">
                                {mappings.length} variable{mappings.length > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                </div>

                {/* Auto-mapped variables */}
                {autoMappings.length > 0 && (
                    <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4">
                        <div className="text-xs font-semibold text-emerald-700 mb-2 flex items-center gap-1.5">
                            ✅ Auto-filled Variables
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {autoMappings.map(m => (
                                <div key={m.variable} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs">
                                    <span className="font-mono text-[10px] text-emerald-600 font-bold">{m.variable}</span>
                                    <span className="text-gray-500">{m.label}</span>
                                    <span className="text-[10px] text-emerald-500">→ {m.previewValue}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Static / Module variables that need input */}
                {staticMappings.length > 0 && (
                    <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                                ✏️ Variables You Fill In
                            </span>
                            <button
                                onClick={() => setShowCsvUpload(true)}
                                className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                            >
                                📄 Upload CSV
                            </button>
                        </div>
                        {csvVariableData && csvVariableData.size > 0 && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-700">
                                ✅ CSV data loaded for {csvVariableData.size} contacts
                            </div>
                        )}
                        {staticMappings.map(m => {
                            const varDef = variableMap?.find(v => v.token === m.variable);
                            return (
                                <AIFieldAssist
                                    key={m.variable}
                                    partnerId={partnerId}
                                    moduleSlug={m.moduleRef?.moduleSlug || varDef?.moduleRef?.moduleSlug}
                                    field={m.moduleRef?.field || varDef?.moduleRef?.field}
                                    aiPrompt={m.moduleRef?.aiSuggestionPrompt || varDef?.moduleRef?.aiSuggestionPrompt}
                                    value={staticValues[m.variable] || ''}
                                    onChange={val => onStaticValueChange(m.variable, val)}
                                    label={`${m.variable} — ${m.label}`}
                                    placeholder={m.fallback || `Enter ${m.label.toLowerCase()}`}
                                />
                            );
                        })}
                    </div>
                )}

                {/* Enhancement Toggles */}
                <div>
                    <label className="text-sm font-semibold text-gray-900 mb-2 block">Enhancements</label>
                    <EnhancementToggles
                        enhancements={enhancements}
                        onOpen={handleEnhancementOpen}
                    />
                </div>

                {/* CSV Upload Inline */}
                {showCsvUpload && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <CSVVariableUpload
                            variableTokens={variableTokens}
                            contacts={contacts}
                            onComplete={data => onCsvDataChange(data)}
                            onClose={() => setShowCsvUpload(false)}
                        />
                    </div>
                )}
            </div>

            {/* Right: Phone Preview */}
            <div className="w-full max-w-[320px] flex-shrink-0 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                <PhonePreview
                    message={message}
                    mappings={mappings}
                    staticValues={staticValues}
                    csvVariableData={csvVariableData}
                    channel={channel}
                    headerImage={headerImage}
                    quickReplies={quickReplies}
                    ctaButtons={ctaButtons}
                    footerText={footerText}
                    businessName={businessName}
                />
            </div>

            {/* Slide Panels */}
            <SlidePanel
                show={activePanel === 'image'}
                onClose={() => setActivePanel(null)}
                title="Header Image"
            >
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-medium text-gray-600 mb-1.5 block">Image URL</label>
                        <input
                            type="url"
                            value={headerImage || ''}
                            onChange={e => {
                                setHeaderImage(e.target.value || null);
                                setEnhancements({ ...enhancements, image: !!e.target.value });
                            }}
                            placeholder="https://example.com/image.jpg"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                        />
                    </div>
                    {headerImage && (
                        <div className="rounded-lg border overflow-hidden">
                            <img src={headerImage} alt="Preview" className="w-full h-32 object-cover" />
                        </div>
                    )}
                    <button
                        onClick={() => { setHeaderImage(null); setEnhancements({ ...enhancements, image: false }); setActivePanel(null); }}
                        className="w-full py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                    >
                        Remove Image
                    </button>
                </div>
            </SlidePanel>

            <SlidePanel
                show={activePanel === 'buttons'}
                onClose={() => setActivePanel(null)}
                title="Quick Reply Buttons"
            >
                <div className="space-y-3">
                    <p className="text-xs text-gray-500">Add up to 3 quick reply buttons.</p>
                    {[0, 1, 2].map(i => (
                        <input
                            key={i}
                            value={quickReplies[i] || ''}
                            onChange={e => {
                                const updated = [...quickReplies];
                                updated[i] = e.target.value;
                                setQuickReplies(updated.filter(Boolean));
                                setEnhancements({ ...enhancements, buttons: updated.filter(Boolean).length > 0 });
                            }}
                            placeholder={`Button ${i + 1}`}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                        />
                    ))}
                </div>
            </SlidePanel>

            <SlidePanel
                show={activePanel === 'link'}
                onClose={() => setActivePanel(null)}
                title="CTA Link"
            >
                <div className="space-y-3">
                    <div>
                        <label className="text-xs font-medium text-gray-600 mb-1.5 block">Button Text</label>
                        <input
                            value={ctaButtons[0]?.text || ''}
                            onChange={e => {
                                const btn = { type: 'url', text: e.target.value, value: ctaButtons[0]?.value || '' };
                                setCtaButtons(e.target.value ? [btn] : []);
                                setEnhancements({ ...enhancements, link: !!e.target.value });
                            }}
                            placeholder="Book Now"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600 mb-1.5 block">URL</label>
                        <input
                            value={ctaButtons[0]?.value || ''}
                            onChange={e => {
                                if (ctaButtons[0]) {
                                    setCtaButtons([{ ...ctaButtons[0], value: e.target.value }]);
                                }
                            }}
                            placeholder="https://example.com"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                        />
                    </div>
                </div>
            </SlidePanel>

            <SlidePanel
                show={activePanel === 'personalize'}
                onClose={() => setActivePanel(null)}
                title="Personalization Variables"
            >
                <div className="space-y-3">
                    <p className="text-xs text-gray-500 mb-3">
                        Click a variable to insert it into your message at the cursor position.
                    </p>
                    {mappings.map(m => (
                        <button
                            key={m.variable}
                            onClick={() => {
                                setMessage(message + ` ${m.variable}`);
                                setActivePanel(null);
                            }}
                            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 rounded-lg transition-colors text-left"
                        >
                            <div>
                                <span className="font-mono text-sm text-indigo-600 font-bold">{m.variable}</span>
                                <span className="text-xs text-gray-500 ml-2">{m.label}</span>
                            </div>
                            <span className="text-xs text-gray-400">{m.previewValue}</span>
                        </button>
                    ))}
                </div>
            </SlidePanel>
        </div>
    );
}
