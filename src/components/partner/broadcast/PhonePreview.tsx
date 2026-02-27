"use client";

import React from 'react';
import { VariableMapping, replaceVariablesInPreview } from '@/lib/template-variable-engine';

interface PhonePreviewProps {
    message: string;
    mappings: VariableMapping[];
    staticValues: Record<string, string>;
    csvVariableData?: Map<string, Record<string, string>> | null;
    channel: 'whatsapp' | 'telegram';
    headerImage?: string | null;
    quickReplies?: string[];
    ctaButtons?: { type: string; text: string; value: string }[];
    footerText?: string;
    businessName?: string;
}

export function PhonePreview({
    message,
    mappings,
    staticValues,
    channel,
    headerImage,
    quickReplies = [],
    ctaButtons = [],
    footerText,
    businessName = 'Business',
}: PhonePreviewProps) {
    const isWA = channel === 'whatsapp';

    const resolvedMappings = mappings.map(m => {
        if ((m.source === 'static' || m.source === 'module') && staticValues[m.variable]) {
            return { ...m, previewValue: staticValues[m.variable] };
        }
        return m;
    });

    const previewText = mappings.length > 0
        ? replaceVariablesInPreview(message, resolvedMappings)
        : message;

    const displayText = previewText
        .replace(/\*([^*]+)\*/g, '$1');

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-900">Live Preview</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isWA ? 'bg-emerald-50 text-emerald-600' : 'bg-sky-50 text-sky-600'}`}>
                    {isWA ? '💬 WhatsApp' : '✈️ Telegram'}
                </span>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
                <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                    <div
                        className="flex items-center gap-3 px-4 py-3"
                        style={{ background: isWA ? '#075e54' : '#0088cc' }}
                    >
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
                            {businessName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white text-sm font-semibold truncate">{businessName}</span>
                    </div>

                    <div
                        className="p-3 min-h-[280px]"
                        style={{
                            background: isWA ? '#efeae2' : '#e8ecf1',
                            backgroundImage: isWA
                                ? 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h60v60H0z\' fill=\'%23efeae2\'/%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'1\' fill=\'%23d4cfc7\'/%3E%3C/svg%3E")'
                                : 'none',
                        }}
                    >
                        {message ? (
                            <div className="max-w-[95%] ml-auto">
                                {headerImage && (
                                    <div className="rounded-t-xl overflow-hidden mb-[-2px]">
                                        <img
                                            src={headerImage}
                                            alt="Header"
                                            className="w-full h-36 object-cover"
                                        />
                                    </div>
                                )}
                                <div
                                    className="p-3 shadow-sm"
                                    style={{
                                        background: isWA ? '#dcf8c6' : '#effdde',
                                        borderRadius: headerImage ? '0 0 12px 12px' : '12px 12px 4px 12px',
                                    }}
                                >
                                    <div className="text-[13px] text-gray-900 leading-relaxed whitespace-pre-wrap">
                                        {displayText}
                                    </div>
                                    {footerText && (
                                        <div className="text-[11px] text-gray-500 italic mt-2">{footerText}</div>
                                    )}
                                    <div className="text-[10px] text-gray-400 text-right mt-2">
                                        {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} ✓✓
                                    </div>
                                </div>

                                {quickReplies.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {quickReplies.map((btn, i) => (
                                            <div
                                                key={i}
                                                className="flex-1 min-w-[45%] px-3 py-2.5 bg-white rounded-lg text-center text-xs font-medium border border-gray-200"
                                                style={{ color: isWA ? '#0088cc' : '#0088cc' }}
                                            >
                                                {btn}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {ctaButtons.length > 0 && (
                                    <div className="mt-2 space-y-1.5">
                                        {ctaButtons.map((btn, i) => (
                                            <div
                                                key={i}
                                                className="px-3 py-3 bg-white rounded-lg text-center text-sm font-medium border border-gray-200 flex items-center justify-center gap-1.5"
                                                style={{ color: isWA ? '#0088cc' : '#0088cc' }}
                                            >
                                                {btn.type === 'url' ? '🔗' : '📞'} {btn.text}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                <span className="text-4xl mb-3 opacity-40">💬</span>
                                <span className="text-xs">Your message will appear here</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
