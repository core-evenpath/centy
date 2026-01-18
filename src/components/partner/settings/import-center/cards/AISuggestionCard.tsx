'use client';

import React from 'react';
import { Lightbulb, AlertOctagon, Plus, Star, Check, Wand2 } from 'lucide-react';
import { PriorityBadge } from '../badges';
import type { AISuggestion } from '../types';

interface AISuggestionCardProps {
  suggestion: AISuggestion;
  onApply: (id: string) => void;
  onDismiss: (id: string) => void;
}

export function AISuggestionCard({ suggestion, onApply, onDismiss }: AISuggestionCardProps) {
  const getConfig = () => {
    switch (suggestion.type) {
      case 'improvement':
        return { Icon: Lightbulb, bg: 'bg-amber-100', text: 'text-amber-600' };
      case 'gap':
        return { Icon: AlertOctagon, bg: 'bg-red-100', text: 'text-red-600' };
      case 'highlight':
        return { Icon: Star, bg: 'bg-emerald-100', text: 'text-emerald-600' };
      default:
        return { Icon: Plus, bg: 'bg-blue-100', text: 'text-blue-600' };
    }
  };

  const { Icon, bg, text } = getConfig();

  return (
    <div
      className={`p-4 rounded-xl border ${
        suggestion.applied
          ? 'border-emerald-300 bg-emerald-50'
          : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon className={`w-5 h-5 ${text}`} />
        </div>

        <div className="flex-1">
          {/* Title & Status */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h4 className="font-semibold text-slate-900">{suggestion.title}</h4>
            {suggestion.applied ? (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 flex items-center gap-1">
                <Check className="w-3 h-3" /> Applied
              </span>
            ) : (
              <PriorityBadge priority={suggestion.priority} />
            )}
          </div>

          {/* Current Value */}
          {suggestion.current && (
            <div className="mb-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-500 mb-0.5">Current:</p>
              <p className="text-sm text-slate-700 line-clamp-2">{suggestion.current}</p>
            </div>
          )}

          {/* Suggested Value */}
          {!suggestion.applied && suggestion.suggested && (
            <div className="mb-2 p-2 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-xs text-purple-600 mb-0.5">Suggested:</p>
              <p className="text-sm text-slate-900 font-medium line-clamp-2">
                {suggestion.suggested}
              </p>
            </div>
          )}

          {/* Reason */}
          <p className="text-xs text-slate-500 mb-3">{suggestion.reason}</p>

          {/* Actions */}
          {!suggestion.applied && (
            <div className="flex gap-2">
              <button
                onClick={() => onApply(suggestion.id)}
                className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-1.5"
              >
                <Wand2 className="w-4 h-4" /> Apply
              </button>
              <button
                onClick={() => onDismiss(suggestion.id)}
                className="px-4 py-2 text-slate-600 text-sm hover:bg-slate-100 rounded-lg font-medium"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
