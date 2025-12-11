import React, { useRef, useEffect } from 'react';
import { Send, Paperclip, Image as ImageIcon, Smile, Sparkles, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface MessageInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: (text?: string) => void;
    onGenerateSuggestion: () => void;
    isGenerating: boolean;
    sending: boolean;
    disabled?: boolean;
}

export function MessageInput({
    value,
    onChange,
    onSend,
    onGenerateSuggestion,
    isGenerating,
    sending,
    disabled
}: MessageInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'inherit';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (value.trim() && !sending) {
                onSend();
            }
        }
    };

    return (
        <div className="p-3 md:p-4 bg-white border-t border-gray-100 pb-safe">
            <div className="max-w-4xl mx-auto relative group">
                {/* Floating Input Container */}
                <div className={cn(
                    "flex flex-col bg-gray-50 border border-gray-200 rounded-2xl transition-all shadow-sm focus-within:shadow-md focus-within:bg-white focus-within:border-indigo-200",
                    (disabled || sending) && "opacity-60 pointer-events-none"
                )}>
                    {/* Text Area */}
                    <Textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="min-h-[44px] md:min-h-[50px] max-h-[100px] md:max-h-[120px] w-full border-none bg-transparent resize-none p-3 md:p-3.5 focus-visible:ring-0 text-gray-900 placeholder:text-gray-400 text-[16px] md:text-sm"
                        rows={1}
                    />

                    {/* Toolbar */}
                    <div className="flex items-center justify-between px-2 pb-2">
                        {/* Left side - attachment buttons (hidden on mobile for cleaner UX) */}
                        <div className="hidden md:flex items-center gap-1">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
                                            <Paperclip className="w-5 h-5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Attach File</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
                                            <ImageIcon className="w-5 h-5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Upload Image</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
                                            <Smile className="w-5 h-5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Insert Emoji</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>

                        {/* Mobile: AI button on left */}
                        <div className="flex md:hidden">
                            <Button
                                onClick={onGenerateSuggestion}
                                variant="ghost"
                                size="sm"
                                disabled={isGenerating}
                                className={cn(
                                    "h-9 w-9 p-0 rounded-full transition-all",
                                    "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 hover:from-indigo-100 hover:to-purple-100 hover:text-indigo-800 border border-indigo-100/50"
                                )}
                            >
                                {isGenerating ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Sparkles className="w-4 h-4" />
                                )}
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
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
                                                    "h-8 px-3 text-xs font-medium rounded-full transition-all gap-1.5",
                                                    "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 hover:from-indigo-100 hover:to-purple-100 hover:text-indigo-800 border border-indigo-100/50"
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

                            <div className="hidden md:block h-5 w-px bg-gray-200 mx-1" />

                            {/* Send Button */}
                            <Button
                                onClick={() => onSend()}
                                disabled={!value.trim() || sending}
                                size="icon"
                                className={cn(
                                    "h-10 w-10 md:h-9 md:w-9 rounded-full transition-all shadow-sm touch-manipulation",
                                    value.trim()
                                        ? "bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95"
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
                <div className="absolute -bottom-6 right-2 text-[10px] text-gray-400 opacity-0 group-focus-within:opacity-100 transition-opacity hidden md:block">
                    {value.length} chars
                </div>
            </div>
        </div>
    );
}
