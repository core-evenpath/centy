"use client";

import React from 'react';
import { VariableMapping, replaceVariablesInPreview } from '@/lib/template-variable-engine';
import { PhonePreview } from './PhonePreview';
import { Contact } from '@/lib/types';

interface Group {
    id: string;
    name: string;
    count: number;
}

interface ReviewStepProps {
    message: string;
    channel: 'whatsapp' | 'telegram';
    mappings: VariableMapping[];
    staticValues: Record<string, string>;
    csvVariableData: Map<string, Record<string, string>> | null;
    recipientType: 'all' | 'group' | 'individual';
    selectedGroupId: string;
    selectedContactIds: string[];
    contacts: Contact[];
    groups: Group[];
    headerImage: string | null;
    quickReplies: string[];
    ctaButtons: { type: string; text: string; value: string }[];
    footerText: string;
    businessName: string;
    templateName?: string;
    onSend: () => void;
    isSending: boolean;
}

export function ReviewStep({
    message,
    channel,
    mappings,
    staticValues,
    csvVariableData,
    recipientType,
    selectedGroupId,
    selectedContactIds,
    contacts,
    groups,
    headerImage,
    quickReplies,
    ctaButtons,
    footerText,
    businessName,
    templateName,
    onSend,
    isSending,
}: ReviewStepProps) {
    const isWA = channel === 'whatsapp';

    const recipientCount = recipientType === 'all'
        ? contacts.filter(c => c.phone).length
        : recipientType === 'group'
            ? groups.find(g => g.id === selectedGroupId)?.count || 0
            : selectedContactIds.length;

    const recipientLabel = recipientType === 'all'
        ? 'All Contacts'
        : recipientType === 'group'
            ? groups.find(g => g.id === selectedGroupId)?.name || 'Group'
            : `${selectedContactIds.length} selected contacts`;

    const previewMessage = replaceVariablesInPreview(
        message,
        mappings.map(m => {
            if ((m.source === 'static' || m.source === 'module') && staticValues[m.variable]) {
                return { ...m, previewValue: staticValues[m.variable] };
            }
            return m;
        })
    );

    const warnings: string[] = [];
    const staticNeedingInput = mappings.filter(m =>
        (m.source === 'static' || m.source === 'module') && !staticValues[m.variable]
    );
    if (staticNeedingInput.length > 0 && (!csvVariableData || csvVariableData.size === 0)) {
        warnings.push(`${staticNeedingInput.length} variable(s) have no value set — fallbacks will be used`);
    }
    if (recipientCount === 0) {
        warnings.push('No recipients selected');
    }

    return (
        <div className="flex gap-6 max-w-4xl mx-auto">
            {/* Left: Summary */}
            <div className="flex-1 space-y-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Campaign Summary</h3>
                    <div className="space-y-3">
                        {templateName && (
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-sm text-gray-500">Template</span>
                                <span className="text-sm font-medium text-gray-900">{templateName}</span>
                            </div>
                        )}
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-sm text-gray-500">Channel</span>
                            <span className={`text-sm font-medium ${isWA ? 'text-emerald-600' : 'text-sky-600'}`}>
                                {isWA ? '💬 WhatsApp' : '✈️ Telegram'}
                            </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-sm text-gray-500">Recipients</span>
                            <span className="text-sm font-medium text-gray-900">
                                {recipientLabel} ({recipientCount})
                            </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-sm text-gray-500">Message Length</span>
                            <span className="text-sm text-gray-700">{message.length} chars</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-sm text-gray-500">Image</span>
                            <span className="text-sm text-gray-700">{headerImage ? '✓ Attached' : '—'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-sm text-gray-500">Quick Replies</span>
                            <span className="text-sm text-gray-700">
                                {quickReplies.length > 0 ? `${quickReplies.length} buttons` : '—'}
                            </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-sm text-gray-500">CTA Buttons</span>
                            <span className="text-sm text-gray-700">
                                {ctaButtons.length > 0 ? `${ctaButtons.length} buttons` : '—'}
                            </span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-sm text-gray-500">Variables</span>
                            <span className="text-sm text-gray-700">
                                {mappings.length > 0 ? `${mappings.length} mapped` : '—'}
                            </span>
                        </div>
                        {csvVariableData && csvVariableData.size > 0 && (
                            <div className="flex justify-between py-2 border-t border-gray-100">
                                <span className="text-sm text-gray-500">CSV Data</span>
                                <span className="text-sm text-emerald-600 font-medium">
                                    ✓ {csvVariableData.size} contacts matched
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Warnings */}
                {warnings.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                        {warnings.map((w, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-amber-700">
                                <span>⚠️</span> {w}
                            </div>
                        ))}
                    </div>
                )}

                {/* Send Button */}
                <button
                    onClick={onSend}
                    disabled={isSending || recipientCount === 0}
                    className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${isSending || recipientCount === 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : isWA
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-sky-600 hover:bg-sky-700 text-white'
                        }`}
                >
                    {isSending ? (
                        <>
                            <span className="animate-spin">⏳</span>
                            Sending Campaign...
                        </>
                    ) : (
                        <>
                            Send to {recipientCount} recipients <span>→</span>
                        </>
                    )}
                </button>
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
        </div>
    );
}
