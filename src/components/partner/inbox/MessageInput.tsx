'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Send, Sparkles, Loader2, Mic, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

import { AttachmentMenu, QuickImagePicker } from './AttachmentMenu';
import { EmojiPicker } from './EmojiPicker';
import { AudioRecorder } from './AudioRecorder';
import { MediaPreviewList, MediaAttachment } from './MediaPreview';

export interface MessageInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: (text?: string) => void;
    onSendMedia?: (mediaUrl: string, mediaType: 'image' | 'video' | 'audio' | 'document', caption?: string, filename?: string) => void;
    onGenerateSuggestion: () => void;
    isGenerating: boolean;
    sending: boolean;
    disabled?: boolean;
    partnerId?: string;
}

// Helper to determine media type from file
function getMediaTypeFromFile(file: File): 'image' | 'video' | 'audio' | 'document' {
    const type = file.type;
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'video';
    if (type.startsWith('audio/')) return 'audio';
    return 'document';
}

// Helper to create preview URL for file
function createPreviewUrl(file: File): string | null {
    const mediaType = getMediaTypeFromFile(file);
    if (mediaType === 'image' || mediaType === 'video' || mediaType === 'audio') {
        return URL.createObjectURL(file);
    }
    return null;
}

export function MessageInput({
    value,
    onChange,
    onSend,
    onSendMedia,
    onGenerateSuggestion,
    isGenerating,
    sending,
    disabled,
    partnerId
}: MessageInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [attachments, setAttachments] = useState<MediaAttachment[]>([]);
    const [isRecordingMode, setIsRecordingMode] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'inherit';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [value]);

    // Cleanup preview URLs on unmount
    useEffect(() => {
        return () => {
            attachments.forEach(att => {
                if (att.preview) URL.revokeObjectURL(att.preview);
            });
        };
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if ((value.trim() || attachments.length > 0) && !sending) {
                handleSendWithAttachments();
            }
        }
    };

    const handleFileSelect = useCallback((files: FileList, mediaType: 'image' | 'video' | 'audio' | 'document') => {
        const file = files[0];
        if (!file) return;

        setUploadError(null);
        const preview = createPreviewUrl(file);

        const newAttachment: MediaAttachment = {
            file,
            preview,
            mediaType,
            uploading: false
        };

        setAttachments(prev => [...prev, newAttachment]);
    }, []);

    const handleImageSelect = useCallback((files: FileList) => {
        handleFileSelect(files, 'image');
    }, [handleFileSelect]);

    const handleRemoveAttachment = useCallback((index: number) => {
        setAttachments(prev => {
            const att = prev[index];
            if (att.preview) URL.revokeObjectURL(att.preview);
            return prev.filter((_, i) => i !== index);
        });
    }, []);

    const handleEmojiSelect = useCallback((emoji: string) => {
        const textarea = textareaRef.current;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newValue = value.substring(0, start) + emoji + value.substring(end);
            onChange(newValue);
            // Set cursor position after emoji
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
                textarea.focus();
            }, 0);
        } else {
            onChange(value + emoji);
        }
    }, [value, onChange]);

    const handleRecordingComplete = useCallback(async (audioBlob: Blob, duration: number) => {
        setIsRecordingMode(false);

        // Convert blob to file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const extension = audioBlob.type.includes('webm') ? 'webm' : 'mp3';
        const audioFile = new File([audioBlob], `voice-message-${timestamp}.${extension}`, {
            type: audioBlob.type
        });

        const preview = URL.createObjectURL(audioBlob);

        const newAttachment: MediaAttachment = {
            file: audioFile,
            preview,
            mediaType: 'audio',
            uploading: false
        };

        setAttachments(prev => [...prev, newAttachment]);
    }, []);

    const uploadMedia = async (attachment: MediaAttachment): Promise<string | null> => {
        if (!partnerId) {
            setUploadError('Partner ID is required for upload');
            return null;
        }

        const formData = new FormData();
        formData.append('file', attachment.file);
        formData.append('partnerId', partnerId);
        formData.append('filename', attachment.file.name);

        try {
            const response = await fetch('/api/upload-media', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Upload failed');
            }

            const result = await response.json();
            return result.url;
        } catch (err: any) {
            console.error('Upload error:', err);
            setUploadError(err.message || 'Failed to upload media');
            return null;
        }
    };

    const handleSendWithAttachments = async () => {
        if (sending) return;

        // If there are attachments, upload and send them
        if (attachments.length > 0 && onSendMedia) {
            // Mark all as uploading
            setAttachments(prev => prev.map(att => ({ ...att, uploading: true })));

            for (const attachment of attachments) {
                const url = await uploadMedia(attachment);
                if (url) {
                    // Send media with caption (use text value as caption for first media)
                    const caption = attachments.indexOf(attachment) === 0 ? value.trim() : undefined;
                    onSendMedia(url, attachment.mediaType, caption, attachment.file.name);
                }
            }

            // Clear attachments and text
            attachments.forEach(att => {
                if (att.preview) URL.revokeObjectURL(att.preview);
            });
            setAttachments([]);
            onChange('');
        } else if (value.trim()) {
            // Just send text
            onSend();
        }
    };

    const canSend = (value.trim() || attachments.length > 0) && !sending;
    const hasContent = value.trim() || attachments.length > 0;

    // Recording mode - show full-width recorder
    if (isRecordingMode) {
        return (
            <div className="p-3 md:p-4 bg-gradient-to-t from-white to-gray-50/50 border-t border-gray-100/80 pb-safe">
                <div className="max-w-4xl mx-auto">
                    <AudioRecorder
                        onRecordingComplete={handleRecordingComplete}
                        onCancel={() => setIsRecordingMode(false)}
                        disabled={disabled || sending}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="p-3 md:p-4 bg-gradient-to-t from-white to-gray-50/30 border-t border-gray-100/80 pb-safe">
            <div className="max-w-4xl mx-auto relative group">
                {/* Upload Error */}
                {uploadError && (
                    <div className="mb-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between shadow-sm animate-in slide-in-from-top-2 duration-200">
                        <span className="font-medium">{uploadError}</span>
                        <button
                            onClick={() => setUploadError(null)}
                            className="text-red-400 hover:text-red-600 transition-colors ml-2 hover:bg-red-100 rounded-lg p-1"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Floating Input Container */}
                <div className={cn(
                    "flex flex-col bg-white border border-gray-200/80 rounded-2xl transition-all duration-200 shadow-sm",
                    "focus-within:shadow-lg focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100",
                    (disabled || sending) && "opacity-60 pointer-events-none"
                )}>
                    {/* Media Previews */}
                    <MediaPreviewList
                        attachments={attachments}
                        onRemove={handleRemoveAttachment}
                    />

                    {/* Text Area */}
                    <Textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={attachments.length > 0 ? "Add a caption..." : "Type a message..."}
                        className="min-h-[44px] md:min-h-[50px] max-h-[100px] md:max-h-[120px] w-full border-none bg-transparent resize-none p-3 md:p-3.5 focus-visible:ring-0 text-gray-900 placeholder:text-gray-400 text-[16px] md:text-sm leading-relaxed"
                        rows={1}
                    />

                    {/* Toolbar */}
                    <div className="flex items-center justify-between px-2.5 pb-2.5">
                        {/* Left side - attachment buttons */}
                        <div className="flex items-center gap-1">
                            {/* Mobile: Plus button opens attachment menu */}
                            <div className="md:hidden">
                                <AttachmentMenu
                                    onFileSelect={handleFileSelect}
                                    disabled={disabled || sending}
                                />
                            </div>

                            {/* Desktop: Individual attachment buttons */}
                            <div className="hidden md:flex items-center gap-1">
                                <AttachmentMenu
                                    onFileSelect={handleFileSelect}
                                    disabled={disabled || sending}
                                />

                                <QuickImagePicker
                                    onFileSelect={handleImageSelect}
                                    disabled={disabled || sending}
                                />

                                <EmojiPicker
                                    onEmojiSelect={handleEmojiSelect}
                                    disabled={disabled || sending}
                                />
                            </div>
                        </div>

                        {/* Right side - AI and send buttons */}
                        <div className="flex items-center gap-2">
                            {/* Voice Message Button - show when no text/attachments */}
                            {!hasContent && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                disabled={disabled || sending}
                                                onClick={() => setIsRecordingMode(true)}
                                                className="h-9 w-9 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-95"
                                            >
                                                <Mic className="w-5 h-5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">Record Voice Message</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}

                            {/* Mobile: AI button */}
                            <div className="flex md:hidden">
                                <Button
                                    onClick={onGenerateSuggestion}
                                    variant="ghost"
                                    size="sm"
                                    disabled={isGenerating}
                                    className={cn(
                                        "h-9 w-9 p-0 rounded-xl transition-all active:scale-95",
                                        "bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-600 hover:from-indigo-100 hover:to-violet-100 hover:text-indigo-700 border border-indigo-200/50 shadow-sm"
                                    )}
                                >
                                    {isGenerating ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Sparkles className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>

                            {/* AI Trigger - Desktop */}
                            <div className="hidden md:block">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                onClick={onGenerateSuggestion}
                                                variant="ghost"
                                                size="sm"
                                                disabled={isGenerating}
                                                className={cn(
                                                    "h-9 px-3.5 text-xs font-medium rounded-xl transition-all gap-1.5 active:scale-[0.97]",
                                                    "bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-600 hover:from-indigo-100 hover:to-violet-100 hover:text-indigo-700 border border-indigo-200/50 shadow-sm"
                                                )}
                                            >
                                                {isGenerating ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <Sparkles className="w-3.5 h-3.5" />
                                                )}
                                                <span>AI Suggestion</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Generate response from Core Memory</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>

                            <div className="hidden md:block h-5 w-px bg-gray-200/80 mx-1" />

                            {/* Send Button */}
                            <Button
                                onClick={handleSendWithAttachments}
                                disabled={!canSend}
                                size="icon"
                                className={cn(
                                    "h-10 w-10 md:h-9 md:w-9 rounded-xl transition-all touch-manipulation",
                                    canSend
                                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md shadow-indigo-500/25 active:scale-95"
                                        : "bg-gray-100 text-gray-400"
                                )}
                            >
                                {sending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4 ml-0.5" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Character Count helper (optional - hidden on mobile) */}
                <div className="absolute -bottom-6 right-2 text-[10px] text-gray-400 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 hidden md:block">
                    {value.length} chars
                </div>
            </div>
        </div>
    );
}
