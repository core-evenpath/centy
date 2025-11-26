'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, FileText, Send } from 'lucide-react';
import { getMetaWhatsAppTemplatesAction, sendMetaWhatsAppMessageAction } from '@/actions/meta-whatsapp-actions';
import { toast } from 'sonner';

interface SendTemplateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    partnerId: string;
    recipientPhone: string;
    conversationId?: string;
}

export function SendTemplateDialog({
    open,
    onOpenChange,
    partnerId,
    recipientPhone,
    conversationId
}: SendTemplateDialogProps) {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [params, setParams] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open && partnerId) {
            fetchTemplates();
        }
    }, [open, partnerId]);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const result = await getMetaWhatsAppTemplatesAction(partnerId);
            if (result.success) {
                // Filter only APPROVED templates
                const approved = (result.data.data || []).filter((t: any) => t.status === 'APPROVED');
                setTemplates(approved);
            } else {
                toast.error('Failed to load templates');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error loading templates');
        } finally {
            setLoading(false);
        }
    };

    const handleTemplateSelect = (templateId: string) => {
        const template = templates.find(t => t.id === templateId);
        setSelectedTemplate(template);
        setParams({});
    };

    const getBodyParamsCount = (template: any) => {
        const bodyComponent = template.components.find((c: any) => c.type === 'BODY');
        if (!bodyComponent || !bodyComponent.text) return 0;
        const matches = bodyComponent.text.match(/{{\s*(\d+)\s*}}/g);
        if (!matches) return 0;
        const indices = matches.map((m: string) => parseInt(m.replace(/\D/g, '')));
        return Math.max(...indices, 0);
    };

    const handleSend = async () => {
        if (!selectedTemplate) return;

        setSending(true);
        try {
            const bodyParamCount = getBodyParamsCount(selectedTemplate);
            const templateComponents = [];

            if (bodyParamCount > 0) {
                const parameters = [];
                for (let i = 1; i <= bodyParamCount; i++) {
                    parameters.push({
                        type: 'text',
                        text: params[`body_${i}`] || ''
                    });
                }
                templateComponents.push({
                    type: 'body',
                    parameters
                });
            }

            const result = await sendMetaWhatsAppMessageAction({
                partnerId,
                to: recipientPhone,
                conversationId,
                templateName: selectedTemplate.name,
                templateLanguage: selectedTemplate.language,
                templateComponents
            });

            if (result.success) {
                toast.success('Template sent successfully');
                onOpenChange(false);
                setSelectedTemplate(null);
                setParams({});
            } else {
                toast.error(`Failed to send: ${result.message}`);
            }
        } catch (error: any) {
            toast.error(`Error: ${error.message}`);
        } finally {
            setSending(false);
        }
    };

    const renderParamInputs = () => {
        if (!selectedTemplate) return null;

        const bodyParamCount = getBodyParamsCount(selectedTemplate);
        if (bodyParamCount === 0) return null;

        const inputs = [];
        for (let i = 1; i <= bodyParamCount; i++) {
            inputs.push(
                <div key={`body_${i}`} className="space-y-2">
                    <Label htmlFor={`param_${i}`}>Variable {'{{' + i + '}}'}</Label>
                    <Input
                        id={`param_${i}`}
                        placeholder={`Value for {{${i}}}`}
                        value={params[`body_${i}`] || ''}
                        onChange={(e) => setParams({ ...params, [`body_${i}`]: e.target.value })}
                    />
                </div>
            );
        }

        return (
            <div className="space-y-4 mt-4 border-t pt-4">
                <p className="text-sm font-medium">Template Parameters</p>
                {inputs}
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Send Template Message</DialogTitle>
                    <DialogDescription>
                        Select an approved template to send to {recipientPhone}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Select Template</Label>
                        <Select onValueChange={handleTemplateSelect} disabled={loading}>
                            <SelectTrigger>
                                <SelectValue placeholder={loading ? "Loading..." : "Select a template"} />
                            </SelectTrigger>
                            <SelectContent>
                                {templates.map((t) => (
                                    <SelectItem key={t.id} value={t.id}>
                                        {t.name} ({t.language})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedTemplate && (
                        <div className="bg-slate-50 p-3 rounded-md text-sm text-slate-600 whitespace-pre-wrap border">
                            {selectedTemplate.components.find((c: any) => c.type === 'BODY')?.text}
                        </div>
                    )}

                    {renderParamInputs()}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSend} disabled={sending || !selectedTemplate}>
                        {sending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        <Send className="w-4 h-4 mr-2" />
                        Send Template
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
