"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { SystemTemplate, Contact, VariableDefinition } from '@/lib/types';
import { VariableMapping, extractTemplateVariables, autoMapVariables, variableMapToMappings } from '@/lib/template-variable-engine';
import { createCampaignAction } from '@/actions/broadcast-actions';
import { sendBroadcastCampaignAction } from '@/actions/broadcast-send-actions';
import { ComposeStep } from './ComposeStep';
import { RecipientsStep } from './RecipientsStep';
import { ReviewStep } from './ReviewStep';

type StudioStep = 'compose' | 'recipients' | 'review';

interface Group {
    id: string;
    name: string;
    count: number;
    icon?: string;
}

interface BroadcastStudioProps {
    template: SystemTemplate | null;
    channel: 'whatsapp' | 'telegram';
    contacts: Contact[];
    groups: Group[];
    partnerId: string;
    userId: string;
    businessName: string;
    partnerIndustry: string;
    onBack: () => void;
    onSuccess: () => void;
}

export function BroadcastStudio({
    template,
    channel,
    contacts,
    groups,
    partnerId,
    userId,
    businessName,
    partnerIndustry,
    onBack,
    onSuccess,
}: BroadcastStudioProps) {
    const [step, setStep] = useState<StudioStep>('compose');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Message state
    const [message, setMessage] = useState(() => {
        if (template) {
            const bodyComp = template.components.find(c => c.type === 'BODY');
            return bodyComp?.text || '';
        }
        return '';
    });

    const [footerText, setFooterText] = useState(() => {
        if (template) {
            const footerComp = template.components.find(c => c.type === 'FOOTER');
            return footerComp?.text || '';
        }
        return '';
    });

    // Variable state
    const [variableMappings, setVariableMappings] = useState<VariableMapping[]>(() => {
        if (template?.variableMap && template.variableMap.length > 0) {
            return variableMapToMappings(template.variableMap);
        }
        if (template) {
            const bodyComp = template.components.find(c => c.type === 'BODY');
            const body = bodyComp?.text || '';
            const vars = extractTemplateVariables(body);
            const sampleContact = contacts.find(c => c.name && c.phone) || {};
            return autoMapVariables(body, vars, partnerIndustry, sampleContact);
        }
        return [];
    });

    const [staticValues, setStaticValues] = useState<Record<string, string>>(() => {
        const vals: Record<string, string> = {};
        if (template?.variableMap) {
            template.variableMap.forEach(v => {
                if ((v.source === 'static' || v.source === 'module') && v.preview) {
                    vals[v.token] = v.preview;
                }
            });
        }
        return vals;
    });

    const [csvVariableData, setCsvVariableData] = useState<Map<string, Record<string, string>> | null>(null);

    // Enhancement state
    const [headerImage, setHeaderImage] = useState<string | null>(() => {
        if (template?.enhancementDefaults?.image) {
            const headerComp = template.components.find(c => c.type === 'HEADER' && c.format === 'IMAGE');
            return headerComp?.example?.header_handle?.[0] || null;
        }
        return null;
    });

    const [quickReplies, setQuickReplies] = useState<string[]>(() => {
        if (template?.enhancementDefaults?.buttonPreset) {
            return template.enhancementDefaults.buttonPreset;
        }
        if (template) {
            const btnComp = template.components.find(c => c.type === 'BUTTONS');
            return btnComp?.buttons?.filter(b => b.type === 'QUICK_REPLY').map(b => b.text) || [];
        }
        return [];
    });

    const [ctaButtons, setCtaButtons] = useState<{ type: string; text: string; value: string }[]>(() => {
        if (template) {
            const btnComp = template.components.find(c => c.type === 'BUTTONS');
            return btnComp?.buttons
                ?.filter(b => b.type === 'URL')
                .map(b => ({ type: 'url', text: b.text, value: b.url || '' })) || [];
        }
        return [];
    });

    const [enhancements, setEnhancements] = useState({
        image: !!headerImage,
        buttons: quickReplies.length > 0,
        link: ctaButtons.length > 0,
        personalize: variableMappings.length > 0,
    });

    // Recipient state
    const [recipientType, setRecipientType] = useState<'all' | 'group' | 'individual'>('all');
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);

    const recipientCount = useMemo(() => {
        if (recipientType === 'all') return contacts.filter(c => c.phone).length;
        if (recipientType === 'group') return groups.find(g => g.id === selectedGroupId)?.count || 0;
        return selectedContactIds.length;
    }, [recipientType, contacts, groups, selectedGroupId, selectedContactIds]);

    const handleStaticValueChange = useCallback((variable: string, value: string) => {
        setStaticValues(prev => ({ ...prev, [variable]: value }));
    }, []);

    const handleSend = useCallback(async () => {
        setIsSending(true);
        setError(null);

        try {
            const finalMappings = variableMappings.map(m => {
                if ((m.source === 'static' || m.source === 'module') && staticValues[m.variable]) {
                    return { ...m, previewValue: staticValues[m.variable] };
                }
                return m;
            });

            const campaignTitle = template?.name || template?.feedMeta?.title || 'Custom Broadcast';

            const campaignResult = await createCampaignAction(partnerId, userId, {
                title: campaignTitle,
                channel,
                message,
                recipientType,
                recipientCount,
                hasImage: !!headerImage,
                buttons: quickReplies,
                status: 'sent',
            });

            if (!campaignResult.success) {
                throw new Error('Failed to create campaign record');
            }

            const campaignId = (campaignResult as any).campaign?.id || 'unknown';

            const selectedRecipientIds = recipientType === 'individual'
                ? selectedContactIds
                : undefined;

            const groupIdsArray = recipientType === 'group' && selectedGroupId
                ? [selectedGroupId]
                : undefined;

            // Convert VariableMapping format to the server action's expected format
            const serverMappings = finalMappings.length > 0
                ? finalMappings.map(m => ({
                    token: m.variable,
                    source: (m.source === 'contact' ? 'contact' : 'custom') as 'contact' | 'custom',
                    contactField: m.source === 'contact' ? m.field : undefined,
                    customValue: m.source !== 'contact' ? (staticValues[m.variable] || m.previewValue || m.fallback || '') : '',
                }))
                : undefined;

            const sendResult = await sendBroadcastCampaignAction(
                partnerId,
                campaignId,
                channel,
                message,
                headerImage || undefined,
                recipientType,
                selectedRecipientIds,
                groupIdsArray,
                serverMappings
            );

            if (sendResult.success) {
                onSuccess();
            } else {
                setError(sendResult.message || 'Failed to send campaign');
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setIsSending(false);
        }
    }, [
        variableMappings, staticValues, template, partnerId, userId,
        channel, message, recipientType, recipientCount, headerImage,
        quickReplies, selectedGroupId, selectedContactIds, contacts, onSuccess,
    ]);

    const steps: { id: StudioStep; label: string; num: number }[] = [
        { id: 'compose', label: 'Compose', num: 1 },
        { id: 'recipients', label: 'Recipients', num: 2 },
        { id: 'review', label: 'Review & Send', num: 3 },
    ];

    const currentStepIndex = steps.findIndex(s => s.id === step);

    return (
        <div className="flex flex-col h-full">
            {/* Sticky Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
                <div className="max-w-5xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onBack}
                                className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                            >
                                ←
                            </button>
                            <div>
                                <h2 className="font-semibold text-gray-900 text-sm">
                                    {template?.feedMeta?.title || template?.name || 'Custom Broadcast'}
                                </h2>
                                <p className="text-xs text-gray-500">
                                    {channel === 'whatsapp' ? '💬 WhatsApp' : '✈️ Telegram'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Step Progress */}
                    <div className="flex items-center gap-2">
                        {steps.map((s, i) => (
                            <React.Fragment key={s.id}>
                                <button
                                    onClick={() => {
                                        if (i <= currentStepIndex) setStep(s.id);
                                    }}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${step === s.id
                                        ? 'bg-gray-900 text-white'
                                        : i < currentStepIndex
                                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer'
                                            : 'bg-gray-100 text-gray-400'
                                        }`}
                                >
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === s.id
                                        ? 'bg-white text-gray-900'
                                        : i < currentStepIndex
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-gray-200 text-gray-500'
                                        }`}>
                                        {i < currentStepIndex ? '✓' : s.num}
                                    </span>
                                    {s.label}
                                </button>
                                {i < steps.length - 1 && (
                                    <div className={`flex-1 h-px ${i < currentStepIndex ? 'bg-emerald-300' : 'bg-gray-200'}`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            {/* Error Bar */}
            {error && (
                <div className="bg-red-50 border-b border-red-200 px-4 py-2.5">
                    <div className="max-w-5xl mx-auto flex items-center gap-2 text-sm text-red-700">
                        <span>⚠️</span> {error}
                        <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
                    </div>
                </div>
            )}

            {/* Step Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-5xl mx-auto px-4 py-6">
                    {step === 'compose' && (
                        <ComposeStep
                            message={message}
                            setMessage={setMessage}
                            mappings={variableMappings}
                            variableMap={template?.variableMap}
                            staticValues={staticValues}
                            onStaticValueChange={handleStaticValueChange}
                            csvVariableData={csvVariableData}
                            onCsvDataChange={setCsvVariableData}
                            channel={channel}
                            headerImage={headerImage}
                            setHeaderImage={setHeaderImage}
                            quickReplies={quickReplies}
                            setQuickReplies={setQuickReplies}
                            ctaButtons={ctaButtons}
                            setCtaButtons={setCtaButtons}
                            footerText={footerText}
                            setFooterText={setFooterText}
                            businessName={businessName}
                            partnerId={partnerId}
                            contacts={contacts}
                            enhancements={enhancements}
                            setEnhancements={setEnhancements}
                        />
                    )}

                    {step === 'recipients' && (
                        <RecipientsStep
                            contacts={contacts}
                            groups={groups}
                            recipientType={recipientType}
                            setRecipientType={setRecipientType}
                            selectedGroupId={selectedGroupId}
                            setSelectedGroupId={setSelectedGroupId}
                            selectedContactIds={selectedContactIds}
                            setSelectedContactIds={setSelectedContactIds}
                        />
                    )}

                    {step === 'review' && (
                        <ReviewStep
                            message={message}
                            channel={channel}
                            mappings={variableMappings}
                            staticValues={staticValues}
                            csvVariableData={csvVariableData}
                            recipientType={recipientType}
                            selectedGroupId={selectedGroupId}
                            selectedContactIds={selectedContactIds}
                            contacts={contacts}
                            groups={groups}
                            headerImage={headerImage}
                            quickReplies={quickReplies}
                            ctaButtons={ctaButtons}
                            footerText={footerText}
                            businessName={businessName}
                            templateName={template?.feedMeta?.title || template?.name}
                            onSend={handleSend}
                            isSending={isSending}
                        />
                    )}
                </div>
            </div>

            {/* Sticky Footer for navigation */}
            <div className="bg-white border-t border-gray-200 sticky bottom-0 z-20">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
                    <button
                        onClick={() => {
                            if (step === 'compose') onBack();
                            else if (step === 'recipients') setStep('compose');
                            else if (step === 'review') setStep('recipients');
                        }}
                        className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
                    >
                        ← {step === 'compose' ? 'Back to Feed' : 'Back'}
                    </button>

                    <div className="text-xs text-gray-400">
                        {recipientCount > 0 && `${recipientCount} recipients`}
                    </div>

                    {step !== 'review' ? (
                        <button
                            onClick={() => {
                                if (step === 'compose') setStep('recipients');
                                else if (step === 'recipients') setStep('review');
                            }}
                            disabled={step === 'compose' && !message.trim()}
                            className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            Continue <span>→</span>
                        </button>
                    ) : (
                        <div /> /* Send is in ReviewStep itself */
                    )}
                </div>
            </div>
        </div>
    );
}
