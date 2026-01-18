'use client';

import React from 'react';
import { Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { GoogleImportCard, WebsiteImportCard } from '../cards';
import type { ImportStats } from '../types';

interface ImportTabProps {
  googleImported: boolean;
  websiteImported: boolean;
  googleSearch: string;
  websiteUrl: string;
  importing: 'google' | 'website' | null;
  googleStats: ImportStats;
  websiteStats: ImportStats;
  googleResults?: any[];
  searching?: boolean;
  selectedPlace?: any;
  websiteError?: string | null;
  onGoogleSearchChange: (value: string) => void;
  onWebsiteUrlChange: (value: string) => void;
  onGoogleImport: () => void;
  onWebsiteImport: () => void;
  onGoogleClear: () => void;
  onWebsiteClear: () => void;
  onSelectPlace?: (place: any) => void;
  onProceed: () => void;
  conflictCount: number;
  filledFields: number;
}

export function ImportTab({
  googleImported,
  websiteImported,
  googleSearch,
  websiteUrl,
  importing,
  googleStats,
  websiteStats,
  googleResults = [],
  searching = false,
  selectedPlace,
  websiteError,
  onGoogleSearchChange,
  onWebsiteUrlChange,
  onGoogleImport,
  onWebsiteImport,
  onGoogleClear,
  onWebsiteClear,
  onSelectPlace,
  onProceed,
  conflictCount,
  filledFields,
}: ImportTabProps) {
  const canProceed = googleImported || websiteImported;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" /> Step 1 of 5
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
          Import Your Business Data
        </h2>
        <p className="text-slate-500 max-w-xl mx-auto">
          Pull data from Google and your website. We&apos;ll help you merge the best from each
          source.
        </p>
      </div>

      {/* Import Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <GoogleImportCard
          imported={googleImported}
          importing={importing === 'google'}
          onImport={onGoogleImport}
          onClear={onGoogleClear}
          searchValue={googleSearch}
          onSearchChange={onGoogleSearchChange}
          stats={googleStats}
          searchResults={googleResults}
          searching={searching}
          selectedPlace={selectedPlace}
          onSelectPlace={onSelectPlace}
        />

        <WebsiteImportCard
          imported={websiteImported}
          importing={importing === 'website'}
          onImport={onWebsiteImport}
          onClear={onWebsiteClear}
          urlValue={websiteUrl}
          onUrlChange={onWebsiteUrlChange}
          stats={websiteStats}
          error={websiteError}
        />
      </div>

      {/* Success Banner */}
      {canProceed && (
        <div className="rounded-2xl p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-xl">Data imported successfully!</h3>
                <p className="text-white/80">
                  {filledFields} fields ready.{' '}
                  {conflictCount > 0
                    ? `${conflictCount} need attention.`
                    : 'No conflicts!'}
                </p>
              </div>
            </div>
            <button
              onClick={onProceed}
              className="w-full sm:w-auto px-6 py-3 bg-white text-indigo-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-50"
            >
              Review Data <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
