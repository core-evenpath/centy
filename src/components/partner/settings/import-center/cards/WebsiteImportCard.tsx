'use client';

import React from 'react';
import { Globe, Download, CheckCircle2, Trash2, Loader2 } from 'lucide-react';
import type { ImportStats } from '../types';

interface WebsiteImportCardProps {
  imported: boolean;
  importing: boolean;
  onImport: () => void;
  onClear: () => void;
  urlValue: string;
  onUrlChange: (value: string) => void;
  stats: ImportStats;
  error?: string | null;
}

export function WebsiteImportCard({
  imported,
  importing,
  onImport,
  onClear,
  urlValue,
  onUrlChange,
  stats,
  error,
}: WebsiteImportCardProps) {
  const isValidUrl = urlValue.trim().length > 0;

  return (
    <div
      className={`rounded-2xl border-2 overflow-hidden transition-all ${
        imported
          ? 'border-purple-300 bg-purple-50/30'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      {/* Header */}
      <div
        className={`px-5 py-4 flex items-center justify-between ${
          imported ? 'bg-purple-100/50' : 'bg-slate-50'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              imported ? 'bg-purple-200' : 'bg-slate-200'
            }`}
          >
            <Globe
              className={`w-6 h-6 ${imported ? 'text-purple-700' : 'text-slate-500'}`}
            />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Website</h3>
            <p className="text-sm text-slate-500">Services, team, content</p>
          </div>
        </div>
        {imported && (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 text-sm rounded-full font-medium">
              <CheckCircle2 className="w-4 h-4" /> Imported
            </span>
            <button
              onClick={onClear}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {!imported ? (
          <div className="space-y-4">
            {/* URL Input */}
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="url"
                value={urlValue}
                onChange={(e) => onUrlChange(e.target.value)}
                placeholder="https://yourbusiness.com"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-400 outline-none text-sm"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 rounded-xl border border-red-200">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Import Button */}
            <button
              onClick={onImport}
              disabled={!isValidUrl || importing}
              className={`w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 ${
                isValidUrl
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              {importing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              {importing ? 'Scanning...' : 'Import Data'}
            </button>
          </div>
        ) : (
          /* Imported Stats */
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-white rounded-xl border text-center">
              <p className="text-2xl font-bold text-slate-900">{stats.fields}</p>
              <p className="text-xs text-slate-500">Fields</p>
            </div>
            <div className="p-3 bg-white rounded-xl border text-center">
              <p className="text-2xl font-bold text-slate-900">{stats.products}</p>
              <p className="text-xs text-slate-500">Products</p>
            </div>
            <div className="p-3 bg-white rounded-xl border text-center">
              <p className="text-2xl font-bold text-slate-900">{stats.testimonials}</p>
              <p className="text-xs text-slate-500">Reviews</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
