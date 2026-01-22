'use client';

import React, { useMemo } from 'react';
import {
  AlertTriangle,
  Building2,
  Phone,
  GraduationCap,
  Bot,
  Share2,
  Heart,
  Users,
  Zap,
  BadgeCheck,
  Award,
  FileText,
  BookOpen,
  MapPin,
  Sparkles,
  Target,
  UserCircle,
  Briefcase,
  Trophy,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { MergeFieldCard } from '../cards';
import type { MergeField, FieldSource, FieldCategory } from '../types';
import { CATEGORY_CONFIG } from '@/lib/field-registry';

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
  partnerIndustry?: string | null;
}

// Icon mapping from icon names to Lucide icons for categories
const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  Building2,
  MapPin,
  Share2,
  Sparkles,
  Users,
  Target,
  Award,
  UserCircle,
  Briefcase,
  Trophy,
  BookOpen,
  Phone,
  GraduationCap,
  Heart,
  Zap,
  BadgeCheck,
  FileText,
};

// Color mapping for categories
const CATEGORY_COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  amber: 'bg-amber-500',
  cyan: 'bg-cyan-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
  indigo: 'bg-indigo-500',
  slate: 'bg-slate-500',
  emerald: 'bg-emerald-500',
  orange: 'bg-orange-500',
  pink: 'bg-pink-500',
  rose: 'bg-rose-500',
  violet: 'bg-violet-500',
};

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
  partnerIndustry,
}: ReviewTabProps) {
  // Build category config map from field registry
  const categoryConfigMap = useMemo(() => {
    const map: Record<FieldCategory, { label: string; icon: LucideIcon; color: string }> = {} as any;
    for (const cat of CATEGORY_CONFIG) {
      const Icon = CATEGORY_ICON_MAP[cat.iconName] || FileText;
      const color = CATEGORY_COLOR_MAP[cat.color] || 'bg-slate-500';
      map[cat.id] = { label: cat.label, icon: Icon, color };
    }
    return map;
  }, []);

  // Group fields by category (from definition)
  const fieldsByCategory = useMemo(() => {
    const grouped: Partial<Record<FieldCategory, MergeField[]>> = {};
    mergeFields.forEach((field) => {
      const category = field.definition?.category || 'knowledge';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category]!.push(field);
    });
    return grouped;
  }, [mergeFields]);

  // Get active categories (ones with fields)
  const activeCategories = useMemo(() => {
    const categories = CATEGORY_CONFIG.map(c => c.id);
    return categories.filter(
      (cat) => fieldsByCategory[cat] && fieldsByCategory[cat]!.length > 0
    );
  }, [fieldsByCategory]);

  // Calculate total stats
  const totalFields = mergeFields.length;
  const filledFields = mergeFields.filter((f) => f.finalValue).length;
  const criticalFields = mergeFields.filter((f) => f.definition?.critical);
  const criticalFilled = criticalFields.filter((f) => f.finalValue).length;

  // Get field key for operations (use targetPath from definition)
  const getFieldKey = (field: MergeField) => field.definition?.targetPath || '';

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-4">
        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border p-4 text-center">
            <p className="text-3xl font-bold text-slate-900">{totalFields}</p>
            <p className="text-sm text-slate-500">Fields Found</p>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center">
            <p className="text-3xl font-bold text-emerald-600">{filledFields}</p>
            <p className="text-sm text-slate-500">Filled</p>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center">
            <p className="text-3xl font-bold text-amber-600">{conflictCount}</p>
            <p className="text-sm text-slate-500">Conflicts</p>
          </div>
        </div>

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

        {/* Dynamic Category Sections */}
        {activeCategories.map((categoryKey) => {
          const config = categoryConfigMap[categoryKey];
          if (!config) return null;

          const fields = fieldsByCategory[categoryKey] || [];
          const Icon = config.icon;
          const filledCount = fields.filter((f) => f.finalValue).length;
          const hasConflicts = fields.some((f) => f.hasConflict);

          return (
            <div key={categoryKey} className="bg-white rounded-2xl border overflow-hidden">
              {/* Category Header */}
              <div className="px-5 py-4 bg-slate-50 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${config.color} rounded-xl flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{config.label}</h3>
                    <p className="text-sm text-slate-500">
                      {filledCount}/{fields.length} filled
                    </p>
                  </div>
                </div>
                {hasConflicts && (
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                    Has conflicts
                  </span>
                )}
              </div>

              {/* Fields */}
              <div className="p-4 space-y-3">
                {fields.map((field) => {
                  const fieldKey = getFieldKey(field);
                  return (
                    <MergeFieldCard
                      key={fieldKey}
                      field={field}
                      onSelectSource={(source) => onSelectSource(fieldKey, source)}
                      onEdit={() => onStartEdit(field)}
                      isEditing={editingField === fieldKey}
                      editValue={editValue}
                      onEditChange={onEditChange}
                      onSaveEdit={() => onSaveEdit(fieldKey)}
                      onCancelEdit={onCancelEdit}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {activeCategories.length === 0 && (
          <div className="bg-slate-50 rounded-2xl p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-bold text-slate-900 mb-2">No fields found</h3>
            <p className="text-slate-500">Import data from Google or your website first.</p>
          </div>
        )}
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

        {/* Critical Fields Status */}
        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-bold text-slate-900 mb-3">Critical Fields</h3>
          <div className="space-y-2">
            {criticalFields.slice(0, 5).map((field) => {
              const fieldKey = getFieldKey(field);
              const label = field.definition?.label || 'Unknown';
              return (
                <div key={fieldKey} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${field.finalValue ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className={`text-sm ${field.finalValue ? 'text-slate-700' : 'text-slate-400'}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-500 mt-3">
            {criticalFilled}/{criticalFields.length} critical fields filled
          </p>
        </div>

        {/* Category Overview */}
        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-bold text-slate-900 mb-3">Categories Found</h3>
          <div className="space-y-2">
            {activeCategories.map((cat) => {
              const config = categoryConfigMap[cat];
              if (!config) return null;
              const fields = fieldsByCategory[cat] || [];
              const filled = fields.filter((f) => f.finalValue).length;
              return (
                <div key={cat} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{config.label}</span>
                  <span className="text-xs text-slate-500">{filled}/{fields.length}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
