'use client';

import React from 'react';
import { Package } from 'lucide-react';
import { ProductCard } from '../cards';
import type { ImportedProduct } from '../types';

interface ProductsTabProps {
  products: ImportedProduct[];
  onToggleProduct: (id: string) => void;
  onSelectAll: () => void;
}

export function ProductsTab({ products, onToggleProduct, onSelectAll }: ProductsTabProps) {
  const selectedProducts = products.filter((p) => p.selected);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl border p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-xl text-slate-900">Products & Services</h2>
              <p className="text-slate-500">
                {selectedProducts.length}/{products.length} selected
              </p>
            </div>
            <button
              onClick={onSelectAll}
              className="px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-xl font-medium"
            >
              Select All
            </button>
          </div>

          {/* Products List */}
          {products.length > 0 ? (
            <div className="space-y-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} onToggle={onToggleProduct} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No products imported yet</p>
              <p className="text-sm">Import from Google or your website to see products here</p>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white h-fit">
        <Package className="w-10 h-10 mb-3" />
        <h3 className="font-bold text-xl mb-1">{selectedProducts.length} Active</h3>
        <p className="text-white/70 text-sm">Products AI will recommend</p>
      </div>
    </div>
  );
}
