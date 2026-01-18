'use client';

import React from 'react';
import { Package, Star, Tag, Clock, Check } from 'lucide-react';
import { SourceBadge } from '../badges';
import type { ImportedProduct } from '../types';

interface ReviewProductRowProps {
  product: ImportedProduct;
}

export function ReviewProductRow({ product }: ReviewProductRowProps) {
  const hasDescription = product.description && product.description.length > 0;
  const hasFeatures = product.features && product.features.length > 0;

  return (
    <div className="py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            product.popular ? 'bg-amber-100' : 'bg-slate-100'
          }`}
        >
          <Package
            className={`w-5 h-5 ${product.popular ? 'text-amber-600' : 'text-slate-500'}`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm text-slate-900 font-semibold">{product.name}</p>
            {product.popular && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                <Star className="w-3 h-3" /> Popular
              </span>
            )}
            {product.source && (
              <SourceBadge source={product.source as 'google' | 'website'} size="xs" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <Tag className="w-3 h-3" />
              {product.category || 'General'}
            </span>
            {product.pricing && (
              <span className="text-sm font-semibold text-emerald-600">{product.pricing}</span>
            )}
          </div>
          {hasDescription && (
            <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">{product.description}</p>
          )}
          {hasFeatures && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {product.features.slice(0, 4).map((feature, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full"
                >
                  <Check className="w-3 h-3 text-emerald-500" />
                  {feature}
                </span>
              ))}
              {product.features.length > 4 && (
                <span className="text-xs text-slate-400">+{product.features.length - 4} more</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
