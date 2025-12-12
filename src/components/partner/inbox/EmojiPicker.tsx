'use client';

import React, { useState } from 'react';
import { Smile, Clock, Heart, ThumbsUp, Star, Coffee, Car, Flag } from 'lucide-react';
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

interface EmojiPickerProps {
    onEmojiSelect: (emoji: string) => void;
    disabled?: boolean;
}

const EMOJI_CATEGORIES = [
    {
        id: 'recent',
        name: 'Recently Used',
        icon: Clock,
        emojis: [] // Will be populated from localStorage
    },
    {
        id: 'smileys',
        name: 'Smileys & Emotion',
        icon: Smile,
        emojis: [
            '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
            '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛',
            '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
            '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔',
            '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵',
            '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕'
        ]
    },
    {
        id: 'gestures',
        name: 'Gestures & People',
        icon: ThumbsUp,
        emojis: [
            '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞',
            '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍',
            '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝',
            '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦵', '🦶', '👂', '🦻',
            '👃', '🧠', '👀', '👁️', '👅', '👄', '💋', '👶', '🧒', '👦'
        ]
    },
    {
        id: 'hearts',
        name: 'Hearts & Love',
        icon: Heart,
        emojis: [
            '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
            '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️',
            '😍', '🥰', '😘', '😻', '💑', '💏', '🌹', '🌷', '💐', '🥀'
        ]
    },
    {
        id: 'symbols',
        name: 'Symbols & Stars',
        icon: Star,
        emojis: [
            '⭐', '🌟', '✨', '💫', '⚡', '🔥', '💥', '❄️', '🌈', '☀️',
            '🌤️', '⛅', '🌦️', '🌧️', '⛈️', '🌩️', '🌪️', '🌫️', '🌀', '🌊',
            '✅', '❌', '❓', '❗', '💯', '🔴', '🟠', '🟡', '🟢', '🔵',
            '🟣', '⚫', '⚪', '🟤', '💬', '💭', '🗯️', '💤', '✔️', '➡️'
        ]
    },
    {
        id: 'objects',
        name: 'Objects & Food',
        icon: Coffee,
        emojis: [
            '☕', '🍵', '🧃', '🥤', '🍶', '🍺', '🍻', '🥂', '🍷', '🍹',
            '🍔', '🍕', '🌭', '🍿', '🥓', '🍳', '🥞', '🧇', '🍞', '🥐',
            '🍰', '🎂', '🧁', '🍩', '🍪', '🍫', '🍬', '🍭', '🍮', '🍯',
            '📱', '💻', '⌨️', '🖥️', '🖨️', '📷', '📸', '📹', '🎥', '📞',
            '📺', '📻', '🎵', '🎶', '🎤', '🎧', '🎸', '🎹', '🎺', '🎻'
        ]
    },
    {
        id: 'travel',
        name: 'Travel & Places',
        icon: Car,
        emojis: [
            '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐',
            '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '✈️', '🛫',
            '🛬', '🚀', '🛸', '🚁', '⛵', '🚤', '🛥️', '🛳️', '⛴️', '🚢',
            '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏩', '🏪'
        ]
    },
    {
        id: 'flags',
        name: 'Flags',
        icon: Flag,
        emojis: [
            '🏳️', '🏴', '🏁', '🚩', '🇺🇸', '🇬🇧', '🇫🇷', '🇩🇪', '🇮🇹', '🇪🇸',
            '🇵🇹', '🇧🇷', '🇲🇽', '🇯🇵', '🇰🇷', '🇨🇳', '🇮🇳', '🇷🇺', '🇦🇺', '🇨🇦',
            '🇳🇱', '🇧🇪', '🇨🇭', '🇦🇹', '🇸🇪', '🇳🇴', '🇩🇰', '🇫🇮', '🇮🇪', '🇵🇱'
        ]
    }
];

const RECENT_EMOJIS_KEY = 'centy_recent_emojis';
const MAX_RECENT_EMOJIS = 24;

function getRecentEmojis(): string[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(RECENT_EMOJIS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function addRecentEmoji(emoji: string) {
    if (typeof window === 'undefined') return;
    try {
        let recent = getRecentEmojis();
        recent = recent.filter(e => e !== emoji);
        recent.unshift(emoji);
        recent = recent.slice(0, MAX_RECENT_EMOJIS);
        localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(recent));
    } catch {
        // Ignore localStorage errors
    }
}

export function EmojiPicker({ onEmojiSelect, disabled }: EmojiPickerProps) {
    const [open, setOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('smileys');
    const [recentEmojis, setRecentEmojis] = useState<string[]>([]);

    // Load recent emojis when popover opens
    React.useEffect(() => {
        if (open) {
            setRecentEmojis(getRecentEmojis());
        }
    }, [open]);

    const handleEmojiClick = (emoji: string) => {
        onEmojiSelect(emoji);
        addRecentEmoji(emoji);
        setRecentEmojis(getRecentEmojis());
    };

    const categories = EMOJI_CATEGORIES.map(cat => {
        if (cat.id === 'recent') {
            return { ...cat, emojis: recentEmojis };
        }
        return cat;
    });

    const activeEmojis = categories.find(c => c.id === activeCategory)?.emojis || [];

    return (
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
                                <Smile className="w-5 h-5" />
                            </Button>
                        </TooltipTrigger>
                    </PopoverTrigger>
                    <TooltipContent side="top">Insert Emoji</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <PopoverContent
                className="w-80 p-0"
                align="start"
                side="top"
                sideOffset={8}
            >
                {/* Category tabs */}
                <div className="flex items-center gap-0.5 px-2 py-2 border-b border-gray-100 overflow-x-auto scrollbar-thin">
                    {categories.map((category) => {
                        const Icon = category.icon;
                        const isActive = activeCategory === category.id;
                        const isEmpty = category.id === 'recent' && recentEmojis.length === 0;

                        if (isEmpty) return null;

                        return (
                            <button
                                key={category.id}
                                onClick={() => setActiveCategory(category.id)}
                                className={cn(
                                    "p-2 rounded-lg transition-colors shrink-0",
                                    isActive
                                        ? "bg-indigo-100 text-indigo-600"
                                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                )}
                                title={category.name}
                            >
                                <Icon className="w-4 h-4" />
                            </button>
                        );
                    })}
                </div>

                {/* Emoji grid */}
                <div className="p-2 h-64 overflow-y-auto">
                    <div className="grid grid-cols-8 gap-1">
                        {activeEmojis.map((emoji, index) => (
                            <button
                                key={`${emoji}-${index}`}
                                onClick={() => handleEmojiClick(emoji)}
                                className="w-8 h-8 flex items-center justify-center text-xl hover:bg-gray-100 rounded transition-colors"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                    {activeEmojis.length === 0 && (
                        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                            No emojis in this category
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
