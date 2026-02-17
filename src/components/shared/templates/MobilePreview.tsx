import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TemplateComponent } from '@/lib/types';
import { ImageIcon, Video, FileText, Link as LinkIcon, Phone, Copy, MessageSquare } from 'lucide-react';

interface MobilePreviewProps {
    components: TemplateComponent[];
    language?: string;
    showFooter?: boolean;
}

export function MobilePreview({ components, language = 'en_US' }: MobilePreviewProps) {
    const header = components.find(c => c.type === 'HEADER');
    const body = components.find(c => c.type === 'BODY');
    const footer = components.find(c => c.type === 'FOOTER');
    const buttons = components.find(c => c.type === 'BUTTONS')?.buttons || [];

    return (
        <Card className="bg-[#E5DDD5] border-none shadow-lg max-w-sm mx-auto overflow-hidden">
            <div className="h-8 bg-[#008069] flex items-center px-4 text-white text-xs font-medium justify-between">
                <span>WhatsApp Preview</span>
                <span className="opacity-75">{language}</span>
            </div>
            <CardContent className="p-4 min-h-[400px] flex flex-col">
                <div className="bg-white rounded-lg shadow-sm p-3 max-w-[90%] relative mb-2">
                    {/* Header */}
                    {header?.format === 'TEXT' && (
                        <div className="font-bold text-sm mb-2">{header.text}</div>
                    )}
                    {(header?.format === 'IMAGE' || header?.format === 'VIDEO' || header?.format === 'DOCUMENT') && (
                        <div className="w-full aspect-video bg-slate-200 rounded-md mb-2 flex items-center justify-center text-slate-400">
                            {header.format === 'IMAGE' && <ImageIcon className="h-8 w-8" />}
                            {header.format === 'VIDEO' && <Video className="h-8 w-8" />}
                            {header.format === 'DOCUMENT' && <FileText className="h-8 w-8" />}
                        </div>
                    )}

                    {/* Body */}
                    <div className="text-sm whitespace-pre-wrap text-slate-800">
                        {body?.text || 'Your message body will appear here...'}
                    </div>

                    {/* Footer */}
                    {footer?.text && (
                        <div className="text-xs text-slate-400 mt-2">
                            {footer.text}
                        </div>
                    )}

                    {/* Timestamp */}
                    <div className="text-[10px] text-slate-400 text-right mt-1">
                        12:00 PM
                    </div>
                </div>

                {/* Buttons */}
                {buttons.length > 0 && (
                    <div className="mt-2 space-y-1">
                        {buttons.map((btn: any, i: number) => (
                            <div key={i} className="bg-white rounded-lg shadow-sm p-2 text-center text-[#00A884] font-medium text-sm cursor-pointer hover:bg-slate-50 flex items-center justify-center gap-2">
                                {btn.type === 'URL' && <LinkIcon className="h-3 w-3" />}
                                {btn.type === 'PHONE_NUMBER' && <Phone className="h-3 w-3" />}
                                {btn.type === 'QUICK_REPLY' && <MessageSquare className="h-3 w-3" />}
                                {btn.type === 'COPY_CODE' && <Copy className="h-3 w-3" />}
                                {btn.text || 'Button Text'}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
