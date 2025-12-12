'use client';

import React, { useRef, useState } from 'react';
import {
    Paperclip,
    Image as ImageIcon,
    FileText,
    Video,
    Music,
    Camera,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

interface AttachmentMenuProps {
    onFileSelect: (files: FileList, mediaType: 'image' | 'video' | 'audio' | 'document') => void;
    onCameraCapture?: () => void;
    disabled?: boolean;
}

const FILE_ACCEPT_TYPES = {
    image: 'image/jpeg,image/png,image/webp',
    video: 'video/mp4,video/3gpp',
    audio: 'audio/aac,audio/amr,audio/mpeg,audio/mp4,audio/ogg,audio/opus,audio/webm,.mp3,.m4a,.ogg,.opus,.webm',
    document: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

const ATTACHMENT_OPTIONS = [
    {
        id: 'image',
        label: 'Photo',
        description: 'JPEG, PNG, WebP (max 5MB)',
        icon: ImageIcon,
        color: 'bg-blue-500',
        hoverColor: 'hover:bg-blue-50',
        accept: FILE_ACCEPT_TYPES.image,
        mediaType: 'image' as const
    },
    {
        id: 'video',
        label: 'Video',
        description: 'MP4, 3GPP (max 16MB)',
        icon: Video,
        color: 'bg-purple-500',
        hoverColor: 'hover:bg-purple-50',
        accept: FILE_ACCEPT_TYPES.video,
        mediaType: 'video' as const
    },
    {
        id: 'audio',
        label: 'Audio',
        description: 'MP3, AAC, OGG (max 16MB)',
        icon: Music,
        color: 'bg-orange-500',
        hoverColor: 'hover:bg-orange-50',
        accept: FILE_ACCEPT_TYPES.audio,
        mediaType: 'audio' as const
    },
    {
        id: 'document',
        label: 'Document',
        description: 'PDF, DOC, XLS (max 100MB)',
        icon: FileText,
        color: 'bg-emerald-500',
        hoverColor: 'hover:bg-emerald-50',
        accept: FILE_ACCEPT_TYPES.document,
        mediaType: 'document' as const
    }
];

export function AttachmentMenu({ onFileSelect, onCameraCapture, disabled }: AttachmentMenuProps) {
    const [open, setOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [currentAccept, setCurrentAccept] = useState<string>('');
    const [currentMediaType, setCurrentMediaType] = useState<'image' | 'video' | 'audio' | 'document'>('image');

    const handleOptionClick = (accept: string, mediaType: 'image' | 'video' | 'audio' | 'document') => {
        setCurrentAccept(accept);
        setCurrentMediaType(mediaType);
        setOpen(false);
        // Small delay to ensure state is updated
        setTimeout(() => {
            fileInputRef.current?.click();
        }, 100);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            onFileSelect(files, currentMediaType);
        }
        // Reset input so the same file can be selected again
        e.target.value = '';
    };

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept={currentAccept}
                onChange={handleFileChange}
                multiple={false}
            />

            <Popover open={open} onOpenChange={setOpen}>
                <TooltipProvider>
                    <Tooltip>
                        <PopoverTrigger asChild>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={disabled}
                                    className="h-9 w-9 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                                >
                                    <Paperclip className="w-5 h-5" />
                                </Button>
                            </TooltipTrigger>
                        </PopoverTrigger>
                        <TooltipContent side="top">Attach File</TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <PopoverContent
                    className="w-64 p-2"
                    align="start"
                    side="top"
                    sideOffset={8}
                >
                    <div className="space-y-1">
                        <div className="px-2 py-1.5 mb-1">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Attach
                            </p>
                        </div>

                        {ATTACHMENT_OPTIONS.map((option) => {
                            const Icon = option.icon;
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => handleOptionClick(option.accept, option.mediaType)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-2 py-2.5 rounded-lg transition-colors text-left",
                                        option.hoverColor,
                                        "group"
                                    )}
                                >
                                    <div className={cn(
                                        "w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0",
                                        option.color
                                    )}>
                                        <Icon className="w-4.5 h-4.5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-gray-900">
                                            {option.label}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {option.description}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}

                        {onCameraCapture && (
                            <>
                                <div className="h-px bg-gray-100 my-1" />
                                <button
                                    onClick={() => {
                                        setOpen(false);
                                        onCameraCapture();
                                    }}
                                    className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg transition-colors hover:bg-gray-50 group"
                                >
                                    <div className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-600 text-white shrink-0">
                                        <Camera className="w-4.5 h-4.5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-gray-900">
                                            Camera
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Take a photo
                                        </p>
                                    </div>
                                </button>
                            </>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        </>
    );
}

// Quick image picker button for mobile
interface QuickImagePickerProps {
    onFileSelect: (files: FileList) => void;
    disabled?: boolean;
}

export function QuickImagePicker({ onFileSelect, disabled }: QuickImagePickerProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            onFileSelect(files);
        }
        e.target.value = '';
    };

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept={FILE_ACCEPT_TYPES.image}
                onChange={handleFileChange}
                capture="environment"
            />
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            disabled={disabled}
                            onClick={handleClick}
                            className="h-9 w-9 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                        >
                            <ImageIcon className="w-5 h-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Upload Image</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </>
    );
}
