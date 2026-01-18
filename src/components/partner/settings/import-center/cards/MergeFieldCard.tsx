'use client';

import React from 'react';
import { FileText, CheckCircle2, AlertTriangle, Pencil, Check, ArrowLeftRight } from 'lucide-react';
import { SourceBadge } from '../badges';
import type { MergeField, FieldSource } from '../types';
import type { LucideIcon } from 'lucide-react';

// Helper to format any value for display
function formatDisplayValue(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) {
    if (value.length === 0) return '';
    // If array of objects, format each
    if (typeof value[0] === 'object') {
      return value.map(item => formatDisplayValue(item)).join('; ');
    }
    return value.join(', ');
  }
  if (typeof value === 'object') {
    // Handle address objects
    if (value.street || value.city || value.line1) {
      const parts = [
        value.street || value.line1,
        value.area,
        value.city,
        value.state,
        value.country,
        value.pincode || value.postalCode || value.zip
      ].filter(Boolean);
      return parts.join(', ');
    }
    // Handle operating hours
    if (value.isOpen24x7 !== undefined) {
      return value.isOpen24x7 ? 'Open 24/7' : 'Custom hours';
    }
    // Handle other objects - try to make a readable string
    try {
      const entries = Object.entries(value).filter(([_, v]) => v !== null && v !== undefined && v !== '');
      if (entries.length === 0) return '';
      return entries.map(([k, v]) => `${k}: ${formatDisplayValue(v)}`).join(', ');
    } catch {
      return JSON.stringify(value);
    }
  }
  return String(value);
}

interface MergeFieldCardProps {
  field: MergeField;
  onSelectSource: (source: FieldSource) => void;
  onEdit: () => void;
  isEditing: boolean;
  editValue: string;
  onEditChange: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

export function MergeFieldCard({
  field,
  onSelectSource,
  onEdit,
  isEditing,
  editValue,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
}: MergeFieldCardProps) {
  const Icon = field.icon || FileText;
  const displayValue = formatDisplayValue(field.finalValue);
  const googleDisplayValue = formatDisplayValue(field.googleValue);
  const websiteDisplayValue = formatDisplayValue(field.websiteValue);

  return (
    <div
      className={`rounded-xl border-2 transition-all ${
        field.hasConflict
          ? 'border-amber-300 bg-amber-50/50'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              field.critical ? 'bg-indigo-100' : 'bg-slate-100'
            }`}
          >
            <Icon
              className={`w-5 h-5 ${field.critical ? 'text-indigo-600' : 'text-slate-500'}`}
            />
          </div>

          <div className="flex-1 min-w-0">
            {/* Label & Badges */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="font-semibold text-slate-900">{field.label}</span>
              {field.critical && (
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium">
                  Key
                </span>
              )}
              {field.hasConflict && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Conflict
                </span>
              )}
            </div>

            {/* Editing Mode */}
            {isEditing ? (
              <div className="space-y-3">
                {field.multiline ? (
                  <textarea
                    value={editValue}
                    onChange={(e) => onEditChange(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-indigo-300 rounded-xl text-sm outline-none resize-none"
                    autoFocus
                  />
                ) : (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => onEditChange(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-indigo-300 rounded-xl text-sm outline-none"
                    autoFocus
                  />
                )}
                <div className="flex gap-2">
                  <button
                    onClick={onSaveEdit}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Save
                  </button>
                  <button
                    onClick={onCancelEdit}
                    className="px-4 py-2 text-slate-600 text-sm hover:bg-slate-100 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* Display Mode */
              <div className="group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p
                      className={`text-sm leading-relaxed ${
                        field.finalValue ? 'text-slate-700' : 'text-slate-400 italic'
                      }`}
                    >
                      {displayValue || 'Not found'}
                    </p>
                    {field.selectedSource && field.selectedSource !== 'none' && (
                      <div className="mt-2">
                        <SourceBadge source={field.selectedSource as 'google' | 'website' | 'custom'} />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={onEdit}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg opacity-0 group-hover:opacity-100"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Conflict Resolution UI */}
        {field.hasConflict && !isEditing && (
          <div className="mt-4 pt-4 border-t border-amber-200">
            <p className="text-xs font-semibold text-amber-800 mb-3 flex items-center gap-1.5">
              <ArrowLeftRight className="w-4 h-4" /> Choose the best value:
            </p>
            <div className="grid grid-cols-2 gap-3">
              {/* Google Option */}
              <button
                onClick={() => onSelectSource('google')}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  field.selectedSource === 'google'
                    ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-slate-200 hover:border-blue-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <SourceBadge source="google" />
                  {field.selectedSource === 'google' && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  )}
                </div>
                <p className="text-sm text-slate-700 line-clamp-2">
                  {googleDisplayValue || 'No value'}
                </p>
              </button>

              {/* Website Option */}
              <button
                onClick={() => onSelectSource('website')}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  field.selectedSource === 'website'
                    ? 'border-purple-400 bg-purple-50 ring-2 ring-purple-200'
                    : 'border-slate-200 hover:border-purple-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <SourceBadge source="website" />
                  {field.selectedSource === 'website' && (
                    <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  )}
                </div>
                <p className="text-sm text-slate-700 line-clamp-2">
                  {websiteDisplayValue || 'No value'}
                </p>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
