"use client";

import React, { useState } from 'react';
import { VariableMapping } from '@/lib/template-variable-engine';
import { VariableDefinition, Contact } from '@/lib/types';
import { PhonePreview } from './PhonePreview';
import { EnhancementToggles } from './EnhancementToggles';
import { AIFieldAssist } from './AIFieldAssist';
import { CSVVariableUpload } from './CSVVariableUpload';
import { SlidePanel } from './SlidePanel';
import { ImagePicker } from './ImagePicker';

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
    // Variable toggle props
    disabledVariables: Set<string>;
    onToggleVariable: (variable: string) => void;
    activeMessage: string;
    activeMappings: VariableMapping[];
    // For AI image generation
    partnerIndustry?: string;
}

// Color variables in message body with syntax highlighting
function highlightVariables(text: string, disabledVariables: Set<string>): React.ReactNode[] {
    const parts = text.split(/(\{\{\d+\}\})/g);
    return parts.map((part, i) => {
        const isVar = /^\{\{\d+\}\}$/.test(part);
        if (isVar) {
            const isDisabled = disabledVariables.has(part);
            return (
                <span
                    key={i}
                    className={`font-mono font-bold rounded px-0.5 ${
                        isDisabled
                            ? 'text-gray-400 bg-gray-100 line-through'
                            : 'text-indigo-600 bg-indigo-50'
                    }`}
                >
                    {part}
                </span>
            );
        }
        return <span key={i}>{part}</span>;
    });
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
    disabledVariables,
    onToggleVariable,
    activeMessage,
    activeMappings,
    partnerIndustry,
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
            setActivePanel('buttons');
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
                                {activeMappings.length}/{mappings.length} variable{mappings.length > 1 ? 's' : ''} active
                            </span>
                        )}
                    </div>
                    {/* Variable color legend below textarea */}
                    {mappings.length > 0 && (
                        <div className="mt-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Variables in message</div>
                            <div className="text-sm leading-relaxed whitespace-pre-wrap">
                                {highlightVariables(message, disabledVariables)}
                            </div>
                        </div>
                    )}
                </div>

                {/* Auto-mapped variables */}
                {autoMappings.length > 0 && (
                    <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4">
                        <div className="text-xs font-semibold text-emerald-700 mb-2 flex items-center gap-1.5">
                            ✅ Auto-filled Variables
                        </div>
                        <div className="flex flex-col gap-2">
                            {autoMappings.map(m => {
                                const isDisabled = disabledVariables.has(m.variable);
                                return (
                                    <div
                                        key={m.variable}
                                        className={`flex items-center gap-2 px-2.5 py-1.5 bg-white border rounded-lg text-xs transition-all duration-200 ${
                                            isDisabled
                                                ? 'border-gray-200 opacity-50'
                                                : 'border-emerald-200'
                                        }`}
                                    >
                                        <button
                                            onClick={() => onToggleVariable(m.variable)}
                                            className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                                                isDisabled
                                                    ? 'border-gray-300 bg-gray-100 text-gray-400'
                                                    : 'border-emerald-400 bg-emerald-500 text-white'
                                            }`}
                                        >
                                            {!isDisabled && (
                                                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                                                    <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            )}
                                        </button>
                                        <span className={`font-mono text-[10px] font-bold ${isDisabled ? 'text-gray-400' : 'text-emerald-600'}`}>
                                            {m.variable}
                                        </span>
                                        <span className={`${isDisabled ? 'text-gray-400 line-through' : 'text-gray-500'}`}>
                                            {m.label}
                                        </span>
                                        <span className={`text-[10px] ${isDisabled ? 'text-gray-300' : 'text-emerald-500'}`}>
                                            → {m.previewValue}
                                        </span>
                                    </div>
                                );
                            })}
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
                            const isDisabled = disabledVariables.has(m.variable);
                            return (
                                <div key={m.variable} className={`transition-all duration-200 ${isDisabled ? 'opacity-50' : ''}`}>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <button
                                            onClick={() => onToggleVariable(m.variable)}
                                            className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                                                isDisabled
                                                    ? 'border-gray-300 bg-gray-100 text-gray-400'
                                                    : 'border-amber-400 bg-amber-500 text-white'
                                            }`}
                                        >
                                            {!isDisabled && (
                                                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                                                    <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            )}
                                        </button>
                                        {isDisabled && (
                                            <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-medium">
                                                Disabled
                                            </span>
                                        )}
                                    </div>
                                    <div className={isDisabled ? 'pointer-events-none' : ''}>
                                        <AIFieldAssist
                                            partnerId={partnerId}
                                            moduleSlug={m.moduleRef?.moduleSlug || varDef?.moduleRef?.moduleSlug}
                                            field={m.moduleRef?.field || varDef?.moduleRef?.field}
                                            aiPrompt={m.moduleRef?.aiSuggestionPrompt || varDef?.moduleRef?.aiSuggestionPrompt}
                                            value={staticValues[m.variable] || ''}
                                            onChange={val => onStaticValueChange(m.variable, val)}
                                            label={`${m.variable} — ${m.label}`}
                                            placeholder={m.fallback || `Enter ${m.label.toLowerCase()}`}
                                        />
                                    </div>
                                </div>
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

            {/* Right: Phone Preview — uses activeMessage + activeMappings */}
            <div className="w-full max-w-[320px] flex-shrink-0 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                <PhonePreview
                    message={activeMessage}
                    mappings={activeMappings}
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
                <ImagePicker
                    partnerId={partnerId}
                    value={headerImage}
                    onChange={(url) => {
                        setHeaderImage(url);
                        setEnhancements({ ...enhancements, image: !!url });
                    }}
                    broadcastMessage={activeMessage}
                    businessName={businessName}
                    industry={partnerIndustry}
                />
            </SlidePanel>

            <SlidePanel
                show={activePanel === 'buttons'}
                onClose={() => setActivePanel(null)}
                title="Buttons & Links"
            >
                <div className="space-y-5">
                    {/* Quick Reply Section */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-semibold text-gray-700">💬 Quick Replies</span>
                            <span className="text-[10px] text-gray-400">up to 3</span>
                        </div>
                        <div className="space-y-2">
                            {[0, 1, 2].map(i => (
                                <input
                                    key={i}
                                    value={quickReplies[i] || ''}
                                    onChange={e => {
                                        const updated = [...quickReplies];
                                        updated[i] = e.target.value;
                                        setQuickReplies(updated.filter(Boolean));
                                        setEnhancements({ ...enhancements, buttons: updated.filter(Boolean).length > 0 || ctaButtons.length > 0 });
                                    }}
                                    placeholder={`Reply button ${i + 1}`}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                                />
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-gray-200" />

                    {/* CTA URL Buttons */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-700">🔗 URL Buttons</span>
                                <span className="text-[10px] text-gray-400">up to 2</span>
                            </div>
                            {ctaButtons.length < 2 && (
                                <button
                                    onClick={() => {
                                        setCtaButtons([...ctaButtons, { type: 'url', text: '', value: '' }]);
                                        setEnhancements({ ...enhancements, link: true });
                                    }}
                                    className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700"
                                >
                                    + Add URL
                                </button>
                            )}
                        </div>
                        {ctaButtons.length === 0 && (
                            <button
                                onClick={() => {
                                    setCtaButtons([{ type: 'url', text: '', value: '' }]);
                                    setEnhancements({ ...enhancements, link: true });
                                }}
                                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors"
                            >
                                + Add a URL button
                            </button>
                        )}
                        <div className="space-y-3">
                            {ctaButtons.map((btn, i) => (
                                <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Button {i + 1}</span>
                                        <button
                                            onClick={() => {
                                                const updated = ctaButtons.filter((_, idx) => idx !== i);
                                                setCtaButtons(updated);
                                                setEnhancements({ ...enhancements, link: updated.length > 0 });
                                            }}
                                            className="text-[10px] text-red-400 hover:text-red-600"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                    <input
                                        value={btn.text}
                                        onChange={e => {
                                            const updated = [...ctaButtons];
                                            updated[i] = { ...updated[i], text: e.target.value };
                                            setCtaButtons(updated);
                                        }}
                                        placeholder="Button text, e.g. Book Now"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 bg-white"
                                    />
                                    <input
                                        value={btn.value}
                                        onChange={e => {
                                            const updated = [...ctaButtons];
                                            updated[i] = { ...updated[i], value: e.target.value };
                                            setCtaButtons(updated);
                                        }}
                                        placeholder="https://example.com"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 bg-white"
                                    />
                                </div>
                            ))}
                        </div>
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
                    {mappings.map(m => {
                        const isDisabled = disabledVariables.has(m.variable);
                        return (
                            <button
                                key={m.variable}
                                onClick={() => {
                                    if (!isDisabled) {
                                        setMessage(message + ` ${m.variable}`);
                                        setActivePanel(null);
                                    }
                                }}
                                disabled={isDisabled}
                                className={`w-full flex items-center justify-between p-3 border rounded-lg transition-colors text-left ${
                                    isDisabled
                                        ? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                                        : 'bg-gray-50 hover:bg-indigo-50 border-gray-200 hover:border-indigo-200'
                                }`}
                            >
                                <div>
                                    <span className={`font-mono text-sm font-bold ${isDisabled ? 'text-gray-400' : 'text-indigo-600'}`}>{m.variable}</span>
                                    <span className={`text-xs ml-2 ${isDisabled ? 'text-gray-400 line-through' : 'text-gray-500'}`}>{m.label}</span>
                                </div>
                                <span className="text-xs text-gray-400">{m.previewValue}</span>
                            </button>
                        );
                    })}
                </div>
            </SlidePanel>
        </div>
    );
}
