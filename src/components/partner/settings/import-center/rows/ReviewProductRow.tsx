'use client';

import React from 'react';
import { Package } from 'lucide-react';
import type { ImportedProduct } from '../types';

interface ReviewProductRowProps {
  product: ImportedProduct;
}

export function ReviewProductRow({ product }: ReviewProductRowProps) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          product.popular ? 'bg-amber-100' : 'bg-slate-100'
        }`}
      >
        <Package
          className={`w-4 h-4 ${product.popular ? 'text-amber-600' : 'text-slate-500'}`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-900 font-medium">{product.name}</p>
        <p className="text-xs text-slate-500">{product.category || 'Uncategorized'}</p>
      </div>
      {product.pricing && (
        <span className="text-sm font-semibold text-emerald-600">{product.pricing}</span>
      )}
    </div>
  );
}
