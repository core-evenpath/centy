'use client';

import React from 'react';
import { AlertTriangle, Building2, Phone, GraduationCap, Bot } from 'lucide-react';
import { MergeFieldCard } from '../cards';
import type { MergeField, FieldSource } from '../types';

interface ReviewTabProps {
  mergeFields: MergeField[];
  conflictCount: number;
  resolvedCount: number;
  editingField: string | null;
  editValue: string;
  onSelectSource: (fieldKey: string, source: FieldSource) => void;
  onStartEdit: (field: MergeField) => void;
  onEditChange: (value: string) => void;
  onSaveEdit: (fieldKey: string) => void;
  onCancelEdit: () => void;
  aiScore?: number;
}

export function ReviewTab({
  mergeFields,
  conflictCount,
  resolvedCount,
  editingField,
  editValue,
  onSelectSource,
  onStartEdit,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
  aiScore = 78,
}: ReviewTabProps) {
  const identityFields = mergeFields.filter((f) => f.category === 'identity');
  const contactFields = mergeFields.filter((f) => f.category === 'contact');
  const industryFields = mergeFields.filter((f) => f.category === 'industry');

  const categoryConfig = [
    { key: 'identity', label: 'Brand Identity', icon: Building2, fields: identityFields },
    { key: 'contact', label: 'Contact', icon: Phone, fields: contactFields },
    { key: 'industry', label: 'Industry Metrics', icon: GraduationCap, fields: industryFields },
  ];

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-4">
        {/* Conflict Progress Bar */}
        {conflictCount > 0 && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
              <div>
                <p className="font-bold text-amber-900">Resolve Conflicts</p>
                <p className="text-sm text-amber-700">
                  {conflictCount - resolvedCount} remaining
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-amber-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${(resolvedCount / conflictCount) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-amber-700">
                {resolvedCount}/{conflictCount}
              </span>
            </div>
          </div>
        )}

        {/* Category Sections */}
        {categoryConfig.map(({ key, label, icon: Icon, fields }) => {
          if (!fields.length) return null;

          const filledCount = fields.filter((f) => f.finalValue).length;

          return (
            <div key={key} className="bg-white rounded-2xl border overflow-hidden">
              {/* Category Header */}
              <div className="px-5 py-4 bg-slate-50 border-b flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl border flex items-center justify-center">
                  <Icon className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{label}</h3>
                  <p className="text-sm text-slate-500">
                    {filledCount}/{fields.length} filled
                  </p>
                </div>
              </div>

              {/* Fields */}
              <div className="p-4 space-y-3">
                {fields.map((field) => (
                  <MergeFieldCard
                    key={field.key}
                    field={field}
                    onSelectSource={(source) => onSelectSource(field.key, source)}
                    onEdit={() => onStartEdit(field)}
                    isEditing={editingField === field.key}
                    editValue={editValue}
                    onEditChange={onEditChange}
                    onSaveEdit={() => onSaveEdit(field.key)}
                    onCancelEdit={onCancelEdit}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* AI Score Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Bot className="w-8 h-8" />
            <div>
              <h3 className="font-bold">AI Score</h3>
              <p className="text-sm text-white/70">Profile quality</p>
            </div>
          </div>
          <div className="text-5xl font-bold mb-2">
            {aiScore}
            <span className="text-2xl text-white/70">/100</span>
          </div>
          <p className="text-sm text-white/70">Complete all fields to improve</p>
        </div>
      </div>
    </div>
  );
}
