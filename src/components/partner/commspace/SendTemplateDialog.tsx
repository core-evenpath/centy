'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText } from 'lucide-react';

interface SendTemplateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    partnerId: string;
    recipientPhone: string;
}

export function SendTemplateDialog({
    open,
    onOpenChange,
    partnerId,
    recipientPhone,
}: SendTemplateDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Send Template Message</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <FileText className="w-12 h-12 text-gray-300 mb-4" />
                    <p className="text-gray-600 mb-2">Template feature coming soon</p>
                    <p className="text-sm text-gray-500 max-w-md">
                        Create and send WhatsApp approved templates to {recipientPhone}
                    </p>
                </div>
                <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
                    Close
                </Button>
            </DialogContent>
        </Dialog>
    );
}
