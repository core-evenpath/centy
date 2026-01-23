'use client';

import React from 'react';
import { Wand2 } from 'lucide-react';
import { AISuggestionCard } from '../cards';
import type { AISuggestion } from '../types';

type SuggestionFilter = 'all' | 'core' | 'products' | 'testimonials';

interface AISuggestionsTabProps {
  suggestions: AISuggestion[];
  filter: SuggestionFilter;
  onFilterChange: (filter: SuggestionFilter) => void;
  onApplySuggestion: (id: string) => void;
  onDismissSuggestion: (id: string) => void;
  onApplyAllHighPriority: () => void;
}

export function AISuggestionsTab({
  suggestions,
  filter,
  onFilterChange,
  onApplySuggestion,
  onDismissSuggestion,
  onApplyAllHighPriority,
}: AISuggestionsTabProps) {
  const appliedSuggestions = suggestions.filter((s) => s.applied);
  const pendingSuggestions = suggestions.filter((s) => !s.applied);
  const highPrioritySuggestions = pendingSuggestions.filter((s) => s.priority === 'high');

  const filteredSuggestions =
    filter === 'all' ? suggestions : suggestions.filter((s) => s.category === filter);

  const filterOptions: { value: SuggestionFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'core', label: 'Core' },
    { value: 'products', label: 'Products' },
    { value: 'testimonials', label: 'Testimonials' },
  ];

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl border p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <h2 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-purple-600" /> AI Suggestions
              </h2>
              <p className="text-slate-500">
                {appliedSuggestions.length} applied • {pendingSuggestions.length} pending
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onFilterChange(option.value)}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium capitalize transition-colors ${
                    filter === option.value
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Suggestions List */}
          {filteredSuggestions.length > 0 ? (
            <div className="space-y-3">
              {filteredSuggestions.map((suggestion) => (
                <AISuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onApply={onApplySuggestion}
                  onDismiss={onDismissSuggestion}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500">
              <Wand2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No suggestions in this category</p>
              <p className="text-sm">Import more data to get AI recommendations</p>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl p-5 text-white">
          <Wand2 className="w-10 h-10 mb-3" />
          <h3 className="font-bold text-xl mb-1">{highPrioritySuggestions.length} High Priority</h3>
          <p className="text-white/70 text-sm mb-4">
            Suggestions to improve your profile
          </p>
          {highPrioritySuggestions.length > 0 && (
            <button
              onClick={onApplyAllHighPriority}
              className="w-full py-3 bg-white/20 hover:bg-white/30 rounded-xl font-semibold transition-colors"
            >
              Apply All High Priority
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
