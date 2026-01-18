'use client';

import React from 'react';
import { SourceBadge } from '../badges';
import type { FieldSource } from '../types';
import type { LucideIcon } from 'lucide-react';

// Helper to format any value for display (handles objects, arrays, primitives)
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
      if (value.isOpen24x7) return 'Open 24/7';
      if (value.schedule) {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const openDays = days.filter(d => value.schedule[d]?.isOpen);
        if (openDays.length > 0) {
          const firstDay = value.schedule[openDays[0]];
          return `${openDays.length} days/week (${firstDay.openTime} - ${firstDay.closeTime})`;
        }
      }
      return 'Custom hours';
    }
    // Handle social media objects
    if (value.instagram || value.facebook || value.linkedin || value.twitter) {
      const platforms = ['instagram', 'facebook', 'linkedin', 'twitter', 'youtube', 'tiktok'];
      const found = platforms.filter(p => value[p]).map(p => p.charAt(0).toUpperCase() + p.slice(1));
      return found.join(', ') || 'Connected';
    }
    // Handle industry object
    if (value.category) {
      return value.subCategory ? `${value.category} - ${value.subCategory}` : value.category;
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

interface ReviewFieldRowProps {
  label: string;
  value: any;
  source?: FieldSource;
  icon?: LucideIcon;
}

export function ReviewFieldRow({ label, value, source, icon: Icon }: ReviewFieldRowProps) {
  const displayValue = formatDisplayValue(value);

  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      {Icon && <Icon className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className="text-sm text-slate-900 font-medium">
          {displayValue || <span className="text-slate-400 italic">Not set</span>}
        </p>
      </div>
      {source && source !== 'none' && (
        <SourceBadge source={source as 'google' | 'website' | 'custom'} size="xs" />
      )}
    </div>
  );
}
