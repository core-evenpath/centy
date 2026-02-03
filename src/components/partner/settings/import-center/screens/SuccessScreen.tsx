'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface SuccessScreenProps {
  stats: {
    fields: number;
    testimonials: number;
  };
  onReset: () => void;
}

export function SuccessScreen({ stats, onReset }: SuccessScreenProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-slate-900 mb-3">Profile Updated!</h1>

        {/* Description */}
        <p className="text-slate-600 mb-6">
          Your business profile has been successfully updated with all the imported data. Your AI
          assistant is now ready to serve customers better.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-2xl font-bold text-indigo-600">{stats.fields}</p>
            <p className="text-xs text-slate-500">Fields</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-2xl font-bold text-purple-600">{stats.testimonials}</p>
            <p className="text-xs text-slate-500">Reviews</p>
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={onReset}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700"
        >
          Back to Import Center
        </button>
      </div>
    </div>
  );
}
