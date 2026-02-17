'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SystemTemplate, TemplateCategory, TemplateComponent, TemplateButtonType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    Save,
    Smartphone,
    Image as ImageIcon,
    Video,
    FileText,
    Plus,
    Trash2,
    Type,
    Link as LinkIcon,
    Phone,
    Copy,
    MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { createSystemTemplateAction, updateSystemTemplateAction } from '@/actions/template-actions';
import { getIndustries, getFunctionsByIndustry } from '@/lib/business-taxonomy';
import { MobilePreview } from '@/components/shared/templates/MobilePreview';

interface TemplateBuilderProps {
    initialData?: SystemTemplate;
}

export function TemplateBuilder({ initialData }: TemplateBuilderProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Basic Info
    const [name, setName] = useState(initialData?.name || '');
    const [slug, setSlug] = useState(initialData?.slug || '');
    const [language, setLanguage] = useState(initialData?.language || 'en_US');
    const [category, setCategory] = useState<TemplateCategory>(initialData?.category || 'MARKETING');
    const [status, setStatus] = useState<'draft' | 'published' | 'archived' | 'verified'>(initialData?.status || 'draft');

    // Taxonomy
    const [selectedIndustry, setSelectedIndustry] = useState(initialData?.applicableIndustries?.[0] || '');
    const [selectedFunction, setSelectedFunction] = useState(initialData?.applicableFunctions?.[0] || '');

    // Components
    const [headerType, setHeaderType] = useState<'NONE' | 'TEXT' | 'MEDIA'>('NONE');
    const [headerFormat, setHeaderFormat] = useState<'IMAGE' | 'VIDEO' | 'DOCUMENT'>('IMAGE');
    const [headerText, setHeaderText] = useState('');

    const [bodyText, setBodyText] = useState('');

    const [footerText, setFooterText] = useState('');

    const [buttons, setButtons] = useState<any[]>([]);

    // Initialize state from initialData if present
    useEffect(() => {
        if (initialData) {
            const header = initialData.components.find(c => c.type === 'HEADER');
            if (header) {
                if (header.format === 'TEXT') {
                    setHeaderType('TEXT');
                    setHeaderText(header.text || '');
                } else {
                    setHeaderType('MEDIA');
                    setHeaderFormat(header.format || 'IMAGE');
                }
            }

            const body = initialData.components.find(c => c.type === 'BODY');
            if (body) setBodyText(body.text || '');

            const footer = initialData.components.find(c => c.type === 'FOOTER');
            if (footer) setFooterText(footer.text || '');

            const buttonsComp = initialData.components.find(c => c.type === 'BUTTONS');
            if (buttonsComp && buttonsComp.buttons) {
                setButtons(buttonsComp.buttons);
            }
        }
    }, [initialData]);

    // Derived lists
    const industries = getIndustries();
    const functions = selectedIndustry ? getFunctionsByIndustry(selectedIndustry) : [];

    // Helper to generate slug
    useEffect(() => {
        if (!initialData && name) {
            setSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''));
        }
    }, [name, initialData]);

    const handleAddButton = (type: TemplateButtonType) => {
        if (buttons.length >= 3) {
            toast.error("Maximum 3 buttons allowed");
            return;
        }
        setButtons([...buttons, { type, text: '', url: '', phoneNumber: '' }]);
    };

    const handleUpdateButton = (index: number, field: string, value: string) => {
        const newButtons = [...buttons];
        newButtons[index] = { ...newButtons[index], [field]: value };
        setButtons(newButtons);
    };

    const handleRemoveButton = (index: number) => {
        setButtons(buttons.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!name || !bodyText) {
            toast.error("Name and Body text are required");
            return;
        }

        setIsSubmitting(true);

        const components: TemplateComponent[] = [];

        // Header
        if (headerType === 'TEXT') {
            components.push({ type: 'HEADER', format: 'TEXT', text: headerText });
        } else if (headerType === 'MEDIA') {
            components.push({ type: 'HEADER', format: headerFormat });
        }

        // Body
        components.push({ type: 'BODY', text: bodyText });

        // Footer
        if (footerText) {
            components.push({ type: 'FOOTER', text: footerText });
        }

        // Buttons
        if (buttons.length > 0) {
            components.push({ type: 'BUTTONS', buttons });
        }

        const templateData = {
            name,
            slug,
            language,
            category,
            status,
            components,
            applicableIndustries: selectedIndustry ? [selectedIndustry] : [],
            applicableFunctions: selectedFunction ? [selectedFunction] : [],
        };

        try {
            let result;
            if (initialData) {
                result = await updateSystemTemplateAction(initialData.id, templateData);
            } else {
                result = await createSystemTemplateAction(templateData);
            }

            if (result.success) {
                toast.success(initialData ? "Template updated" : "Template created");
                router.push('/admin/templates');
            } else {
                toast.error(result.error || "Failed to save template");
            }
        } catch (error) {
            console.error(error);
            toast.error("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Editor Column */}
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Template Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Template Name</Label>
                                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Welcome Offer" />
                            </div>
                            <div className="space-y-2">
                                <Label>Slug (API ID)</Label>
                                <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="welcome_offer" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select value={category} onValueChange={(v: any) => setCategory(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MARKETING">Marketing</SelectItem>
                                        <SelectItem value="UTILITY">Utility</SelectItem>
                                        <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Language</Label>
                                <Select value={language} onValueChange={setLanguage}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="en_US">English (US)</SelectItem>
                                        <SelectItem value="es">Spanish</SelectItem>
                                        <SelectItem value="pt_BR">Portuguese (BR)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Industry (optional)</Label>
                                <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Industries" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {industries.map(i => (
                                            <SelectItem key={i.industryId} value={i.industryId}>{i.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Function (optional)</Label>
                                <Select value={selectedFunction} onValueChange={setSelectedFunction} disabled={!selectedIndustry}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Functions" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {functions.map(f => (
                                            <SelectItem key={f.functionId} value={f.functionId}>{f.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Message Content</CardTitle>
                        <CardDescription>Design the message structure.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Header Section */}
                        <div className="space-y-3 border-b pb-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">Header (Optional)</Label>
                                <Select value={headerType} onValueChange={(v: any) => setHeaderType(v)}>
                                    <SelectTrigger className="w-[140px] h-8">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NONE">None</SelectItem>
                                        <SelectItem value="TEXT">Text</SelectItem>
                                        <SelectItem value="MEDIA">Media</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {headerType === 'TEXT' && (
                                <Input
                                    value={headerText}
                                    onChange={e => setHeaderText(e.target.value)}
                                    placeholder="Enter header text (max 60 chars)"
                                    maxLength={60}
                                />
                            )}

                            {headerType === 'MEDIA' && (
                                <div className="flex gap-2">
                                    <Button
                                        variant={headerFormat === 'IMAGE' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setHeaderFormat('IMAGE')}
                                        type="button"
                                    >
                                        <ImageIcon className="mr-2 h-4 w-4" /> Image
                                    </Button>
                                    <Button
                                        variant={headerFormat === 'VIDEO' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setHeaderFormat('VIDEO')}
                                        type="button"
                                    >
                                        <Video className="mr-2 h-4 w-4" /> Video
                                    </Button>
                                    <Button
                                        variant={headerFormat === 'DOCUMENT' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setHeaderFormat('DOCUMENT')}
                                        type="button"
                                    >
                                        <FileText className="mr-2 h-4 w-4" /> Document
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Body Section */}
                        <div className="space-y-3 border-b pb-4">
                            <Label className="text-base font-semibold">Body</Label>
                            <div className="relative">
                                <Textarea
                                    value={bodyText}
                                    onChange={e => setBodyText(e.target.value)}
                                    placeholder="Enter your message text here... Use {{1}}, {{2}} for variables."
                                    className="min-h-[150px] pr-10"
                                />
                                <div className="absolute top-2 right-2 flex gap-1">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6"
                                        title="Add Variable"
                                        onClick={() => setBodyText(prev => prev + ' {{1}}')}
                                    >
                                        <Type className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Supports Markdown: *bold*, _italics_, ~strikethrough~, `code`.
                            </p>
                        </div>

                        {/* Footer Section */}
                        <div className="space-y-3 border-b pb-4">
                            <Label className="text-base font-semibold">Footer (Optional)</Label>
                            <Input
                                value={footerText}
                                onChange={e => setFooterText(e.target.value)}
                                placeholder="Enter footer text (light gray, small font)"
                                maxLength={60}
                            />
                        </div>

                        {/* Buttons Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">Buttons (Optional)</Label>
                                <div className="flex gap-2">
                                    {buttons.length < 3 && (
                                        <>
                                            <Button size="sm" variant="outline" onClick={() => handleAddButton('QUICK_REPLY')}>
                                                <MessageSquare className="mr-1 h-3 w-3" /> Quick Reply
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => handleAddButton('URL')}>
                                                <LinkIcon className="mr-1 h-3 w-3" /> URL
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => handleAddButton('PHONE_NUMBER')}>
                                                <Phone className="mr-1 h-3 w-3" /> Phone
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {buttons.length === 0 && (
                                <p className="text-sm text-muted-foreground italic">No buttons added.</p>
                            )}

                            <div className="space-y-3">
                                {buttons.map((btn, idx) => (
                                    <div key={idx} className="flex gap-2 items-start p-3 bg-slate-50 rounded-md border">
                                        <div className="grid gap-2 flex-1">
                                            <div className="flex gap-2">
                                                <Badge variant="secondary" className="h-6">{btn.type}</Badge>
                                                <Input
                                                    value={btn.text}
                                                    onChange={e => handleUpdateButton(idx, 'text', e.target.value)}
                                                    placeholder="Button Text"
                                                    className="h-8"
                                                />
                                            </div>
                                            {btn.type === 'URL' && (
                                                <Input
                                                    value={btn.url}
                                                    onChange={e => handleUpdateButton(idx, 'url', e.target.value)}
                                                    placeholder="https://example.com"
                                                    className="h-8"
                                                />
                                            )}
                                            {btn.type === 'PHONE_NUMBER' && (
                                                <Input
                                                    value={btn.phoneNumber}
                                                    onChange={e => handleUpdateButton(idx, 'phoneNumber', e.target.value)}
                                                    placeholder="+1234567890"
                                                    className="h-8"
                                                />
                                            )}
                                        </div>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-red-500 hover:text-red-700"
                                            onClick={() => handleRemoveButton(idx)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Preview Column */}
            <div className="space-y-6">
                <div className="sticky top-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="status-toggle">Publish Status</Label>
                            <Switch
                                id="status-toggle"
                                checked={status === 'published'}
                                onCheckedChange={checked => setStatus(checked ? 'published' : 'draft')}
                            />
                            <Badge variant={status === 'published' ? 'default' : 'secondary'}>
                                {status.toUpperCase()}
                            </Badge>
                        </div>
                        <Button onClick={handleSave} disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : (
                                <>
                                    <Save className="mr-2 h-4 w-4" /> Save Template
                                </>
                            )}
                        </Button>
                    </div>

                    <MobilePreview
                        components={[
                            ...(headerType === 'TEXT' ? [{ type: 'HEADER' as const, format: 'TEXT' as const, text: headerText }] : []),
                            ...(headerType === 'MEDIA' ? [{ type: 'HEADER' as const, format: headerFormat }] : []),
                            { type: 'BODY' as const, text: bodyText },
                            ...(footerText ? [{ type: 'FOOTER' as const, text: footerText }] : []),
                            ...(buttons.length > 0 ? [{ type: 'BUTTONS' as const, buttons }] : [])
                        ]}
                        language={language}
                    />
                </div>
            </div>
        </div>
    );
}
