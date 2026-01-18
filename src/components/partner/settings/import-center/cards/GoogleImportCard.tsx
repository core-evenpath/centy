'use client';

import React from 'react';
import { Search, Download, CheckCircle2, Trash2, Loader2, Building2, Star, AlertCircle } from 'lucide-react';
import { StarRating } from '../shared';
import type { ImportStats } from '../types';

interface GoogleImportCardProps {
  imported: boolean;
  importing: boolean;
  onImport: () => void;
  onClear: () => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  stats: ImportStats;
  searchResults?: any[];
  searching?: boolean;
  selectedPlace?: any;
  onSelectPlace?: (place: any) => void;
  error?: string | null;
}

export function GoogleImportCard({
  imported,
  importing,
  onImport,
  onClear,
  searchValue,
  onSearchChange,
  stats,
  searchResults = [],
  searching = false,
  selectedPlace,
  onSelectPlace,
  error,
}: GoogleImportCardProps) {
  return (
    <div
      className={`rounded-2xl border-2 overflow-hidden transition-all ${
        imported
          ? 'border-blue-300 bg-blue-50/30'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      {/* Header */}
      <div
        className={`px-5 py-4 flex items-center justify-between ${
          imported ? 'bg-blue-100/50' : 'bg-slate-50'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              imported ? 'bg-blue-200' : 'bg-slate-200'
            }`}
          >
            <Search
              className={`w-6 h-6 ${imported ? 'text-blue-700' : 'text-slate-500'}`}
            />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Google Business</h3>
            <p className="text-sm text-slate-500">Reviews, hours, contact</p>
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
            {/* Search Input with Dropdown */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search your business name..."
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-400 outline-none text-sm"
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 animate-spin z-10" />
              )}

              {/* Search Results Dropdown - inside the relative container */}
              {searchResults.length > 0 && !selectedPlace && (
                <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <button
                      key={result.placeId || index}
                      onClick={() => onSelectPlace?.(result)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-slate-100 last:border-b-0 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 truncate">
                            {result.mainText || result.name || result.description}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {result.secondaryText || result.formattedAddress || result.address}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && !selectedPlace && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Search Error</p>
                  <p className="text-red-600">{error}</p>
                </div>
              </div>
            )}

            {/* Selected Place Preview */}
            {selectedPlace && (
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">
                      {selectedPlace.mainText || selectedPlace.name || selectedPlace.description}
                    </p>
                    <p className="text-sm text-slate-600 truncate">
                      {selectedPlace.secondaryText || selectedPlace.formattedAddress || selectedPlace.address}
                    </p>
                    {selectedPlace.rating && (
                      <div className="flex items-center gap-2 mt-2">
                        <StarRating rating={Math.round(selectedPlace.rating)} />
                        <span className="text-xs text-slate-600 font-medium">
                          {selectedPlace.rating} ({selectedPlace.userRatingsTotal || 0} reviews)
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onSelectPlace?.(null)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Import Button */}
            <button
              onClick={onImport}
              disabled={!selectedPlace || importing}
              className={`w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 ${
                selectedPlace
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              {importing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              {importing ? 'Fetching...' : 'Import Data'}
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
