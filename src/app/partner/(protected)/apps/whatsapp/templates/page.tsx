'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FileText, ArrowLeft, Plus, Loader2, RefreshCw, CheckCircle2, XCircle, Clock, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { getMetaWhatsAppTemplatesAction, createMetaWhatsAppTemplateAction, deleteMetaWhatsAppTemplateAction } from '@/actions/meta-whatsapp-actions';
import { toast } from 'sonner';
import { MetaTemplateCreateRequest } from '@/lib/types-meta-whatsapp';

export default function TemplatesPage() {
    const { currentWorkspace } = useMultiWorkspaceAuth();
    const partnerId = currentWorkspace?.partnerId;

    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<any>(null);
    const [deleting, setDeleting] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [category, setCategory] = useState<'MARKETING' | 'UTILITY' | 'AUTHENTICATION'>('MARKETING');
    const [language, setLanguage] = useState('en_US');
    const [bodyText, setBodyText] = useState('');
    const [headerText, setHeaderText] = useState('');
    const [footerText, setFooterText] = useState('');

    useEffect(() => {
        if (partnerId) {
            fetchTemplates();
        }
    }, [partnerId]);

    const fetchTemplates = async () => {
        if (!partnerId) return;
        setLoading(true);
        try {
            const result = await getMetaWhatsAppTemplatesAction(partnerId);
            if (result.success) {
                setTemplates(result.data.data || []);
            } else {
                toast.error(`Failed to fetch templates: ${result.message}`);
            }
        } catch (error: any) {
            toast.error(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTemplate = async () => {
        if (!partnerId) return;
        if (!name || !bodyText) {
            toast.error('Name and Body text are required');
            return;
        }

        setCreating(true);
        try {
            const extractVariables = (text: string) => {
                const matches = text.match(/{{\s*(\d+)\s*}}/g);
                if (!matches) return 0;
                const indices = matches.map(m => parseInt(m.replace(/\D/g, '')));
                return Math.max(...indices, 0);
            };

            const bodyComponent: any = {
                type: 'BODY',
                text: bodyText
            };

            const bodyVarCount = extractVariables(bodyText);
            if (bodyVarCount > 0) {
                const examples = Array.from({ length: bodyVarCount }, (_, i) => `Example ${i + 1}`);
                bodyComponent.example = { body_text: [examples] };
            }

            const components: any[] = [bodyComponent];

            if (headerText) {
                const headerComponent: any = {
                    type: 'HEADER',
                    format: 'TEXT',
                    text: headerText
                };

                const headerVarCount = extractVariables(headerText);
                if (headerVarCount > 0) {
                    const examples = Array.from({ length: headerVarCount }, (_, i) => `Header ${i + 1}`);
                    headerComponent.example = { header_text: examples };
                }

                components.push(headerComponent);
            }

            if (footerText) {
                components.push({
                    type: 'FOOTER',
                    text: footerText
                });
            }

            const templateData: MetaTemplateCreateRequest = {
                name: name.toLowerCase().replace(/\s+/g, '_'),
                category,
                language,
                components
            };

            const result = await createMetaWhatsAppTemplateAction(partnerId, templateData);

            if (result.success) {
                toast.success('Template created successfully');
                setIsCreateOpen(false);
                resetForm();
                fetchTemplates();
            } else {
                toast.error(`Failed to create template: ${result.message}`);
            }
        } catch (error: any) {
            toast.error(`Error: ${error.message}`);
        } finally {
            setCreating(false);
        }
    };



    const handleDeleteTemplate = async () => {
        if (!partnerId || !templateToDelete) return;

        setDeleting(true);
        try {
            const result = await deleteMetaWhatsAppTemplateAction(partnerId, templateToDelete.name);
            if (result.success) {
                toast.success('Template deleted successfully');
                setTemplateToDelete(null);
                fetchTemplates();
            } else {
                toast.error(`Failed to delete template: ${result.message}`);
            }
        } catch (error: any) {
            toast.error(`Error: ${error.message}`);
        } finally {
            setDeleting(false);
        }
    };

    const resetForm = () => {
        setName('');
        setCategory('MARKETING');
        setLanguage('en_US');
        setBodyText('');
        setHeaderText('');
        setFooterText('');
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</Badge>;
            case 'REJECTED':
                return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
            case 'PENDING':
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="container max-w-6xl py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <Link
                        href="/partner/apps/whatsapp"
                        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Configuration
                    </Link>
                    <h1 className="text-3xl font-bold">Message Templates</h1>
                    <p className="text-gray-600 mt-1">
                        Create and manage WhatsApp message templates
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchTemplates} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Template
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Create New Template</DialogTitle>
                                <DialogDescription>
                                    Define the structure of your WhatsApp message template.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Template Name</Label>
                                        <Input
                                            id="name"
                                            placeholder="e.g., welcome_message"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                        <p className="text-xs text-gray-500">Lowercase, underscores only.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="language">Language</Label>
                                        <Select value={language} onValueChange={setLanguage}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="en_US">English (US)</SelectItem>
                                                <SelectItem value="es_ES">Spanish (Spain)</SelectItem>
                                                <SelectItem value="pt_BR">Portuguese (Brazil)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Select value={category} onValueChange={(val: any) => setCategory(val)}>
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
                                    <Label htmlFor="header">Header (Optional)</Label>
                                    <Input
                                        id="header"
                                        placeholder="Enter header text..."
                                        value={headerText}
                                        onChange={(e) => setHeaderText(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="body">Body Text</Label>
                                    <Textarea
                                        id="body"
                                        placeholder="Hello {{1}}, welcome to our service!"
                                        value={bodyText}
                                        onChange={(e) => setBodyText(e.target.value)}
                                        rows={5}
                                    />
                                    <p className="text-xs text-gray-500">
                                        Use {'{{1}}'}, {'{{2}}'}, etc. for variables.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="footer">Footer (Optional)</Label>
                                    <Input
                                        id="footer"
                                        placeholder="Enter footer text..."
                                        value={footerText}
                                        onChange={(e) => setFooterText(e.target.value)}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreateTemplate} disabled={creating}>
                                    {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Create Template
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            ) : templates.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <FileText className="w-12 h-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900">No templates found</h3>
                        <p className="text-gray-500 max-w-sm mt-2 mb-6">
                            Create your first message template to start sending structured messages to your customers.
                        </p>
                        <Button onClick={() => setIsCreateOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Template
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((template: any) => (
                        <Card key={template.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg font-semibold truncate" title={template.name}>
                                        {template.name}
                                    </CardTitle>
                                    {getStatusBadge(template.status)}
                                </div>
                                <CardDescription className="flex items-center gap-2 text-xs">
                                    <span className="uppercase bg-gray-100 px-1.5 py-0.5 rounded">{template.language}</span>
                                    <span>•</span>
                                    <span>{template.category}</span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-700 whitespace-pre-wrap font-mono h-32 overflow-y-auto border border-gray-100">
                                    {template.components.find((c: any) => c.type === 'BODY')?.text || 'No body text'}
                                </div>
                                <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
                                    <span>ID: {template.id}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => setTemplateToDelete(template)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={!!templateToDelete} onOpenChange={(open) => !open && setTemplateToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Template</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the template "{templateToDelete?.name}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setTemplateToDelete(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteTemplate} disabled={deleting}>
                            {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
