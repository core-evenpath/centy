'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    SystemTemplate, TemplateCategory, TemplateComponent, TemplateButtonType,
    TemplateFeedMeta, VariableDefinition, TemplateEnhancementDefaults, TemplateCampaignType
} from '@/lib/types';
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
    MessageSquare,
    Rss,
    Settings2,
    Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { createSystemTemplateAction, updateSystemTemplateAction } from '@/actions/template-actions';
import { getIndustries, getFunctionsByIndustry } from '@/lib/business-taxonomy';
import { MobilePreview } from '@/components/shared/templates/MobilePreview';
import { extractTemplateVariables } from '@/lib/template-variable-engine';

interface TemplateBuilderProps {
    initialData?: SystemTemplate;
}

const CAMPAIGN_TYPES: { value: TemplateCampaignType; label: string }[] = [
    { value: 'promotion', label: 'Promotion' },
    { value: 'seasonal', label: 'Seasonal' },
    { value: 'retention', label: 'Retention' },
    { value: 'transactional', label: 'Transactional' },
    { value: 'lead-gen', label: 'Lead Generation' },
    { value: 'announcement', label: 'Announcement' },
    { value: 'daily', label: 'Daily' },
];

const SIGNAL_PRESETS = [
    { icon: '🔥', label: 'High engagement', color: '#ea580c' },
    { icon: '⚡', label: 'Creates FOMO', color: '#eab308' },
    { icon: '♻️', label: 'Win back customers', color: '#16a34a' },
    { icon: '📋', label: 'Reduces no-shows', color: '#2563eb' },
    { icon: '🗓️', label: 'Seasonal must-send', color: '#9333ea' },
    { icon: '🎯', label: 'High reply potential', color: '#dc2626' },
    { icon: '💼', label: 'B2B lead driver', color: '#0891b2' },
];

const VARIABLE_SOURCES = [
    { value: 'contact', label: 'Contact Field' },
    { value: 'business', label: 'Business Profile' },
    { value: 'module', label: 'Module Data' },
    { value: 'static', label: 'Manual Input' },
] as const;

export function TemplateBuilder({ initialData }: TemplateBuilderProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Basic Info
    const [name, setName] = useState(initialData?.name || '');
    const [slug, setSlug] = useState(initialData?.slug || '');
    const [language, setLanguage] = useState(initialData?.language || 'en_US');
    const [category, setCategory] = useState<TemplateCategory>(initialData?.category || 'MARKETING');
    const [status, setStatus] = useState<'draft' | 'published' | 'archived' | 'verified'>(initialData?.status || 'draft');
    const [description, setDescription] = useState(initialData?.description || '');
    const [tags, setTags] = useState(initialData?.tags?.join(', ') || '');

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

    // Feed Meta
    const [feedTitle, setFeedTitle] = useState(initialData?.feedMeta?.title || '');
    const [feedSubtitle, setFeedSubtitle] = useState(initialData?.feedMeta?.subtitle || '');
    const [campaignType, setCampaignType] = useState<TemplateCampaignType>(initialData?.feedMeta?.campaignType || 'promotion');
    const [signalIcon, setSignalIcon] = useState(initialData?.feedMeta?.signal?.icon || '🔥');
    const [signalLabel, setSignalLabel] = useState(initialData?.feedMeta?.signal?.label || 'High engagement');
    const [signalColor, setSignalColor] = useState(initialData?.feedMeta?.signal?.color || '#ea580c');
    const [timingBest, setTimingBest] = useState(initialData?.feedMeta?.timing?.best || '');
    const [timingIcon, setTimingIcon] = useState(initialData?.feedMeta?.timing?.icon || '🕙');
    const [sortPriority, setSortPriority] = useState(initialData?.feedMeta?.sortPriority || 50);
    const [isTimeSensitive, setIsTimeSensitive] = useState(initialData?.feedMeta?.isTimeSensitive || false);

    // Variable Map
    const [variableMap, setVariableMap] = useState<VariableDefinition[]>(initialData?.variableMap || []);

    // Enhancement Defaults
    const [enhImage, setEnhImage] = useState(initialData?.enhancementDefaults?.image ?? false);
    const [enhImageSource, setEnhImageSource] = useState<'upload' | 'module'>(initialData?.enhancementDefaults?.imageSource || 'upload');
    const [enhButtons, setEnhButtons] = useState(initialData?.enhancementDefaults?.buttons ?? false);
    const [enhButtonPreset, setEnhButtonPreset] = useState(initialData?.enhancementDefaults?.buttonPreset?.join(', ') || '');
    const [enhLink, setEnhLink] = useState(initialData?.enhancementDefaults?.link ?? false);
    const [enhLinkText, setEnhLinkText] = useState(initialData?.enhancementDefaults?.linkText || '');

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

    // Auto-update variable map when body text changes
    const detectedVariables = extractTemplateVariables(bodyText);

    // Sync variable map with detected variables
    useEffect(() => {
        if (detectedVariables.length === 0) {
            if (variableMap.length > 0) setVariableMap([]);
            return;
        }

        setVariableMap(prev => {
            const newMap: VariableDefinition[] = detectedVariables.map((token, idx) => {
                const existing = prev.find(v => v.token === token);
                if (existing) return existing;
                return {
                    token,
                    label: idx === 0 ? 'Recipient Name' : `Variable ${idx + 1}`,
                    source: idx === 0 ? 'contact' as const : 'static' as const,
                    contactField: idx === 0 ? 'name' : undefined,
                    preview: idx === 0 ? 'Priya' : `[Value ${idx + 1}]`,
                    fallback: idx === 0 ? 'there' : '',
                };
            });
            return newMap;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [detectedVariables.join(',')]);

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

    const handleUpdateVariable = (index: number, updates: Partial<VariableDefinition>) => {
        setVariableMap(prev => {
            const next = [...prev];
            next[index] = { ...next[index], ...updates };
            return next;
        });
    };

    const handleSignalPreset = (preset: typeof SIGNAL_PRESETS[number]) => {
        setSignalIcon(preset.icon);
        setSignalLabel(preset.label);
        setSignalColor(preset.color);
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

        // Build Feed Meta
        const feedMeta: TemplateFeedMeta | undefined = feedTitle ? {
            title: feedTitle,
            subtitle: feedSubtitle,
            campaignType,
            signal: { icon: signalIcon, label: signalLabel, color: signalColor },
            timing: { best: timingBest, icon: timingIcon },
            sortPriority,
            isTimeSensitive,
        } : undefined;

        // Build Enhancement Defaults
        const enhancementDefaults: TemplateEnhancementDefaults | undefined = (enhImage || enhButtons || enhLink) ? {
            image: enhImage,
            imageSource: enhImage ? enhImageSource : undefined,
            buttons: enhButtons,
            buttonPreset: enhButtons && enhButtonPreset ? enhButtonPreset.split(',').map(s => s.trim()).filter(Boolean) : undefined,
            link: enhLink,
            linkText: enhLink ? enhLinkText : undefined,
        } : undefined;

        const parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);

        const templateData = {
            name,
            slug,
            language,
            category,
            status,
            components,
            applicableIndustries: selectedIndustry ? [selectedIndustry] : [],
            applicableFunctions: selectedFunction ? [selectedFunction] : [],
            description,
            tags: parsedTags,
            feedMeta,
            variableMap: variableMap.length > 0 ? variableMap : undefined,
            enhancementDefaults,
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
                <Tabs defaultValue="content" className="w-full">
                    <TabsList className="w-full grid grid-cols-4 mb-4">
                        <TabsTrigger value="content" className="text-xs">
                            <MessageSquare className="mr-1 h-3 w-3" />
                            Content
                        </TabsTrigger>
                        <TabsTrigger value="feed" className="text-xs">
                            <Rss className="mr-1 h-3 w-3" />
                            Feed
                        </TabsTrigger>
                        <TabsTrigger value="variables" className="text-xs">
                            <Type className="mr-1 h-3 w-3" />
                            Variables
                        </TabsTrigger>
                        <TabsTrigger value="enhancements" className="text-xs">
                            <Settings2 className="mr-1 h-3 w-3" />
                            Enhance
                        </TabsTrigger>
                    </TabsList>

                    {/* ==================== TAB 1: CONTENT ==================== */}
                    <TabsContent value="content" className="space-y-6">
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

                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Short summary for AI selection" />
                                </div>

                                <div className="space-y-2">
                                    <Label>Tags (comma-separated)</Label>
                                    <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="promotion, weekend, discount" />
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
                                            <Button variant={headerFormat === 'IMAGE' ? 'default' : 'outline'} size="sm" onClick={() => setHeaderFormat('IMAGE')} type="button">
                                                <ImageIcon className="mr-2 h-4 w-4" /> Image
                                            </Button>
                                            <Button variant={headerFormat === 'VIDEO' ? 'default' : 'outline'} size="sm" onClick={() => setHeaderFormat('VIDEO')} type="button">
                                                <Video className="mr-2 h-4 w-4" /> Video
                                            </Button>
                                            <Button variant={headerFormat === 'DOCUMENT' ? 'default' : 'outline'} size="sm" onClick={() => setHeaderFormat('DOCUMENT')} type="button">
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
                                                onClick={() => {
                                                    const nextVar = detectedVariables.length + 1;
                                                    setBodyText(prev => prev + ` {{${nextVar}}}`);
                                                }}
                                            >
                                                <Type className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between">
                                        <p className="text-xs text-muted-foreground">
                                            Supports Markdown: *bold*, _italics_, ~strikethrough~, `code`.
                                        </p>
                                        {detectedVariables.length > 0 && (
                                            <Badge variant="secondary" className="text-xs">
                                                {detectedVariables.length} variable{detectedVariables.length !== 1 ? 's' : ''} detected
                                            </Badge>
                                        )}
                                    </div>
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
                                                        <Input value={btn.text} onChange={e => handleUpdateButton(idx, 'text', e.target.value)} placeholder="Button Text" className="h-8" />
                                                    </div>
                                                    {btn.type === 'URL' && (
                                                        <Input value={btn.url} onChange={e => handleUpdateButton(idx, 'url', e.target.value)} placeholder="https://example.com" className="h-8" />
                                                    )}
                                                    {btn.type === 'PHONE_NUMBER' && (
                                                        <Input value={btn.phoneNumber} onChange={e => handleUpdateButton(idx, 'phoneNumber', e.target.value)} placeholder="+1234567890" className="h-8" />
                                                    )}
                                                </div>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => handleRemoveButton(idx)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ==================== TAB 2: FEED SETTINGS ==================== */}
                    <TabsContent value="feed" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Rss className="h-5 w-5" />
                                    Feed Presentation
                                </CardTitle>
                                <CardDescription>How this template appears in the partner&apos;s broadcast feed.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Feed Title</Label>
                                    <Input value={feedTitle} onChange={e => setFeedTitle(e.target.value)} placeholder="Weekend Getaway Deal" />
                                    <p className="text-xs text-muted-foreground">Human-friendly headline for the feed card</p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Feed Subtitle</Label>
                                    <Input value={feedSubtitle} onChange={e => setFeedSubtitle(e.target.value)} placeholder="Best sent Thursday–Friday for weekend bookings" />
                                    <p className="text-xs text-muted-foreground">Brief recommendation for the partner</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Campaign Type</Label>
                                        <Select value={campaignType} onValueChange={(v: TemplateCampaignType) => setCampaignType(v)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {CAMPAIGN_TYPES.map(ct => (
                                                    <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Sort Priority (1-100)</Label>
                                        <Input type="number" min={1} max={100} value={sortPriority} onChange={e => setSortPriority(Number(e.target.value))} />
                                        <p className="text-xs text-muted-foreground">Higher = shown first</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Switch checked={isTimeSensitive} onCheckedChange={setIsTimeSensitive} id="time-sensitive" />
                                    <Label htmlFor="time-sensitive">Time-Sensitive Template</Label>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Signal Badge</CardTitle>
                                <CardDescription>The engagement signal shown on the feed card</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    {SIGNAL_PRESETS.map((preset) => (
                                        <Button
                                            key={preset.label}
                                            variant={signalLabel === preset.label ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => handleSignalPreset(preset)}
                                            className="text-xs"
                                        >
                                            {preset.icon} {preset.label}
                                        </Button>
                                    ))}
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Icon</Label>
                                        <Input value={signalIcon} onChange={e => setSignalIcon(e.target.value)} className="text-center" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Label</Label>
                                        <Input value={signalLabel} onChange={e => setSignalLabel(e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Color</Label>
                                        <div className="flex gap-1">
                                            <input type="color" value={signalColor} onChange={e => setSignalColor(e.target.value)} className="w-8 h-9 rounded border cursor-pointer" />
                                            <Input value={signalColor} onChange={e => setSignalColor(e.target.value)} className="font-mono text-xs" />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Best Timing</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Timing Label</Label>
                                        <Input value={timingBest} onChange={e => setTimingBest(e.target.value)} placeholder="Thu 10am" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Timing Icon</Label>
                                        <Input value={timingIcon} onChange={e => setTimingIcon(e.target.value)} placeholder="🕙" className="text-center" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Feed Preview */}
                        {feedTitle && (
                            <Card className="border-dashed border-2 border-blue-200 bg-blue-50/30">
                                <CardHeader>
                                    <CardTitle className="text-sm text-blue-700">Feed Card Preview</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-white rounded-xl border shadow-sm p-4 space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-semibold text-base">{feedTitle}</h3>
                                                <p className="text-sm text-muted-foreground">{feedSubtitle}</p>
                                            </div>
                                            <Badge
                                                className="text-xs font-medium shrink-0"
                                                style={{ backgroundColor: signalColor + '20', color: signalColor, borderColor: signalColor + '40' }}
                                            >
                                                {signalIcon} {signalLabel}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <span>{timingIcon} Best: {timingBest || '—'}</span>
                                            <span className="capitalize">{campaignType}</span>
                                            {isTimeSensitive && <Badge variant="destructive" className="text-[10px] h-4">Time-sensitive</Badge>}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* ==================== TAB 3: VARIABLE MAPPING ==================== */}
                    <TabsContent value="variables" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5" />
                                    Variable Intelligence
                                </CardTitle>
                                <CardDescription>
                                    Map each {'{{N}}'} variable to its data source. Variables are auto-detected from your message body.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {variableMap.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Type className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                        <p className="text-sm">No variables detected in message body.</p>
                                        <p className="text-xs mt-1">Add {'{{1}}, {{2}}'} etc. in the Content tab to get started.</p>
                                    </div>
                                ) : (
                                    variableMap.map((v, idx) => (
                                        <div key={v.token} className="border rounded-lg p-4 space-y-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge variant="outline" className="font-mono text-sm">{v.token}</Badge>
                                                <Input
                                                    value={v.label}
                                                    onChange={e => handleUpdateVariable(idx, { label: e.target.value })}
                                                    className="h-8 font-medium"
                                                    placeholder="Variable label"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Source</Label>
                                                    <Select
                                                        value={v.source}
                                                        onValueChange={(val: VariableDefinition['source']) => handleUpdateVariable(idx, { source: val })}
                                                    >
                                                        <SelectTrigger className="h-8">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {VARIABLE_SOURCES.map(s => (
                                                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {v.source === 'contact' && (
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Contact Field</Label>
                                                        <Select
                                                            value={v.contactField || ''}
                                                            onValueChange={val => handleUpdateVariable(idx, { contactField: val })}
                                                        >
                                                            <SelectTrigger className="h-8">
                                                                <SelectValue placeholder="Select field" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="name">Name</SelectItem>
                                                                <SelectItem value="phone">Phone</SelectItem>
                                                                <SelectItem value="email">Email</SelectItem>
                                                                <SelectItem value="area">Area / Location</SelectItem>
                                                                <SelectItem value="company">Company</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )}

                                                {v.source === 'business' && (
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Business Field</Label>
                                                        <Select
                                                            value={v.businessField || ''}
                                                            onValueChange={val => handleUpdateVariable(idx, { businessField: val })}
                                                        >
                                                            <SelectTrigger className="h-8">
                                                                <SelectValue placeholder="Select field" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="businessName">Business Name</SelectItem>
                                                                <SelectItem value="businessPhone">Phone</SelectItem>
                                                                <SelectItem value="address">Address</SelectItem>
                                                                <SelectItem value="email">Email</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )}

                                                {v.source === 'module' && (
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Module Slug</Label>
                                                        <Input
                                                            value={v.moduleRef?.moduleSlug || ''}
                                                            onChange={e => handleUpdateVariable(idx, {
                                                                moduleRef: { moduleSlug: e.target.value, field: v.moduleRef?.field || '', aiSuggestionPrompt: v.moduleRef?.aiSuggestionPrompt }
                                                            })}
                                                            className="h-8"
                                                            placeholder="e.g. rooms, products"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {v.source === 'module' && (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Module Field</Label>
                                                        <Input
                                                            value={v.moduleRef?.field || ''}
                                                            onChange={e => handleUpdateVariable(idx, {
                                                                moduleRef: { moduleSlug: v.moduleRef?.moduleSlug || '', field: e.target.value, aiSuggestionPrompt: v.moduleRef?.aiSuggestionPrompt }
                                                            })}
                                                            className="h-8"
                                                            placeholder="e.g. name, price"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">AI Suggestion Prompt</Label>
                                                        <Input
                                                            value={v.moduleRef?.aiSuggestionPrompt || ''}
                                                            onChange={e => handleUpdateVariable(idx, {
                                                                moduleRef: { moduleSlug: v.moduleRef?.moduleSlug || '', field: v.moduleRef?.field || '', aiSuggestionPrompt: e.target.value }
                                                            })}
                                                            className="h-8"
                                                            placeholder="e.g. Pick best room for promo"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Preview Value</Label>
                                                    <Input
                                                        value={v.preview}
                                                        onChange={e => handleUpdateVariable(idx, { preview: e.target.value })}
                                                        className="h-8"
                                                        placeholder="e.g. Priya"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Fallback Value</Label>
                                                    <Input
                                                        value={v.fallback}
                                                        onChange={e => handleUpdateVariable(idx, { fallback: e.target.value })}
                                                        className="h-8"
                                                        placeholder="e.g. there"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ==================== TAB 4: ENHANCEMENT DEFAULTS ==================== */}
                    <TabsContent value="enhancements" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings2 className="h-5 w-5" />
                                    Enhancement Defaults
                                </CardTitle>
                                <CardDescription>Pre-configure toggles that activate when a partner selects this template in the studio.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Image */}
                                <div className="border rounded-lg p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                            <Label>Image Attachment</Label>
                                        </div>
                                        <Switch checked={enhImage} onCheckedChange={setEnhImage} />
                                    </div>
                                    {enhImage && (
                                        <div className="space-y-2 pl-6">
                                            <Label className="text-xs">Default Source</Label>
                                            <Select value={enhImageSource} onValueChange={(v: 'upload' | 'module') => setEnhImageSource(v)}>
                                                <SelectTrigger className="h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="upload">Upload</SelectItem>
                                                    <SelectItem value="module">From Module</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>

                                {/* Buttons */}
                                <div className="border rounded-lg p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                            <Label>Quick Reply Buttons</Label>
                                        </div>
                                        <Switch checked={enhButtons} onCheckedChange={setEnhButtons} />
                                    </div>
                                    {enhButtons && (
                                        <div className="space-y-2 pl-6">
                                            <Label className="text-xs">Button Presets (comma-separated)</Label>
                                            <Input
                                                value={enhButtonPreset}
                                                onChange={e => setEnhButtonPreset(e.target.value)}
                                                placeholder="Book Now, More Details"
                                                className="h-8"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Link */}
                                <div className="border rounded-lg p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <LinkIcon className="h-4 w-4 text-muted-foreground" />
                                            <Label>Link Button</Label>
                                        </div>
                                        <Switch checked={enhLink} onCheckedChange={setEnhLink} />
                                    </div>
                                    {enhLink && (
                                        <div className="space-y-2 pl-6">
                                            <Label className="text-xs">Link Text</Label>
                                            <Input
                                                value={enhLinkText}
                                                onChange={e => setEnhLinkText(e.target.value)}
                                                placeholder="Book Now"
                                                className="h-8"
                                            />
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
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
