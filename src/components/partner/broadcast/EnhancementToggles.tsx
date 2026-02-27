"use client";

import React from 'react';

interface Enhancements {
    image: boolean;
    buttons: boolean;
    link: boolean;
    personalize: boolean;
}

interface EnhancementTogglesProps {
    enhancements: Enhancements;
    onOpen: (key: string) => void;
}

const cards = [
    { key: 'image', icon: '🖼️', label: 'Image', desc: 'Add a header image' },
    { key: 'buttons', icon: '▶️', label: 'Buttons & CTAs', desc: 'Quick replies & URL links' },
    { key: 'personalize', icon: '@', label: 'Personalize', desc: 'Variable tokens' },
];

export function EnhancementToggles({ enhancements, onOpen }: EnhancementTogglesProps) {
    return (
        <div className="grid grid-cols-3 gap-3">
            {cards.map(card => {
                const active = enhancements[card.key as keyof Enhancements];
                return (
                    <button
                        key={card.key}
                        onClick={() => onOpen(card.key)}
                        className={`
              relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer group
              ${active
                                ? 'border-emerald-500 bg-emerald-50/60 shadow-sm'
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                            }
            `}
                    >
                        <span className="text-2xl group-hover:scale-110 transition-transform">{card.icon}</span>
                        <span className={`text-xs font-semibold ${active ? 'text-emerald-700' : 'text-gray-600'}`}>
                            {card.label}
                        </span>
                        {active && (
                            <span className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                                ✓
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
