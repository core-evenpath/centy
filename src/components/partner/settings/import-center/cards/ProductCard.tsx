'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { SourceBadge } from '../badges';
import type { ImportedProduct } from '../types';

interface ProductCardProps {
  product: ImportedProduct;
  onToggle: (id: string) => void;
}

export function ProductCard({ product, onToggle }: ProductCardProps) {
  return (
    <div
      className={`p-4 rounded-xl border-2 transition-all ${
        product.selected
          ? 'border-emerald-300 bg-emerald-50/30'
          : 'border-slate-200 bg-white opacity-60'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Selection Checkbox */}
        <button
          onClick={() => onToggle(product.id)}
          className={`mt-1 w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center border-2 ${
            product.selected
              ? 'bg-emerald-500 border-emerald-500'
              : 'border-slate-300 hover:border-emerald-400'
          }`}
        >
          {product.selected && <Check className="w-4 h-4 text-white" />}
        </button>

        <div className="flex-1">
          {/* Name & Badge */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="font-semibold text-slate-900">{product.name}</h4>
            {product.popular && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                Popular
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-slate-600 mb-2 line-clamp-2">{product.description}</p>

          {/* Features */}
          {product.features && product.features.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {product.features.slice(0, 3).map((feature, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded"
                >
                  {feature}
                </span>
              ))}
              {product.features.length > 3 && (
                <span className="px-2 py-0.5 text-slate-500 text-xs">
                  +{product.features.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Price & Source */}
          <div className="flex items-center justify-between">
            {product.pricing && (
              <span className="font-bold text-emerald-600">{product.pricing}</span>
            )}
            <SourceBadge source={product.source as 'google' | 'website'} size="xs" />
          </div>
        </div>
      </div>
    </div>
  );
}
