'use client';

import React from 'react';
import { ChevronDown, CheckCircle2, AlertCircle, Pencil } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ReviewAccordionSectionProps {
  title: string;
  icon: LucideIcon;
  count: string;
  status: 'complete' | 'warning' | 'default';
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  previewContent?: string;
  children: React.ReactNode;
}

export function ReviewAccordionSection({
  title,
  icon: Icon,
  count,
  status,
  isExpanded,
  onToggle,
  onEdit,
  previewContent,
  children,
}: ReviewAccordionSectionProps) {
  const statusStyles = {
    complete: {
      border: 'border-emerald-200 bg-emerald-50/30',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      countBg: 'bg-emerald-100 text-emerald-700',
    },
    warning: {
      border: 'border-amber-200 bg-amber-50/30',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      countBg: 'bg-amber-100 text-amber-700',
    },
    default: {
      border: 'border-slate-200 bg-white',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-500',
      countBg: 'bg-slate-100 text-slate-600',
    },
  };

  const styles = statusStyles[status];

  return (
    <div className={`rounded-2xl border-2 overflow-hidden transition-all ${styles.border}`}>
      {/* Header Button */}
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${styles.iconBg}`}
          >
            <Icon className={`w-6 h-6 ${styles.iconColor}`} />
          </div>

          {/* Title & Count */}
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900">{title}</h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-sm font-semibold ${styles.countBg}`}
              >
                {count}
              </span>
              {status === 'complete' && (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              )}
              {status === 'warning' && (
                <AlertCircle className="w-5 h-5 text-amber-500" />
              )}
            </div>
            {!isExpanded && previewContent && (
              <p className="text-sm text-slate-500 mt-1 line-clamp-1">{previewContent}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium flex items-center gap-1"
          >
            <Pencil className="w-4 h-4" /> Edit
          </button>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          >
            <ChevronDown className="w-5 h-5 text-slate-400" />
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-5 pb-5 border-t border-slate-100">{children}</div>
      )}
    </div>
  );
}
