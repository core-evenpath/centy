'use client';

import React, { useState } from 'react';
import { Package, Plus, Upload, FileSpreadsheet } from 'lucide-react';
import { ProductCard } from '../cards';
import { ProductImportModal } from '../modals';
import type { ImportedProduct } from '../types';

interface ProductsTabProps {
  products: ImportedProduct[];
  onToggleProduct: (id: string) => void;
  onSelectAll: () => void;
  onAddProducts?: (products: ImportedProduct[]) => void;
}

export function ProductsTab({ products, onToggleProduct, onSelectAll, onAddProducts }: ProductsTabProps) {
  const [showImportModal, setShowImportModal] = useState(false);
  const selectedProducts = products.filter((p) => p.selected);

  const handleImportProducts = (newProducts: ImportedProduct[]) => {
    if (onAddProducts) {
      onAddProducts(newProducts);
    }
  };

  return (
    <>
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-medium flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Import Products
                </button>
                {products.length > 0 && (
                  <button
                    onClick={onSelectAll}
                    className="px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-xl font-medium"
                  >
                    Select All
                  </button>
                )}
              </div>
            </div>

            {/* Products List */}
            {products.length > 0 ? (
              <div className="space-y-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} onToggle={onToggleProduct} />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-slate-400" />
                </div>
                <p className="font-semibold text-slate-900 mb-1">No products imported yet</p>
                <p className="text-sm text-slate-500 mb-6">
                  Import from Google/Website or add your products manually
                </p>

                {/* Quick Import Options */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700"
                  >
                    <Upload className="w-4 h-4" />
                    Import from Spreadsheet
                  </button>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 border-2 border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:border-slate-300 hover:bg-slate-50"
                  >
                    <Plus className="w-4 h-4" />
                    Add Manually
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Stats Card */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white">
            <Package className="w-10 h-10 mb-3" />
            <h3 className="font-bold text-xl mb-1">{selectedProducts.length} Active</h3>
            <p className="text-white/70 text-sm">Products AI will recommend</p>
          </div>

          {/* Import Tips Card */}
          <div className="bg-white rounded-2xl border p-5">
            <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
              Import Tips
            </h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                Copy from Excel or Google Sheets
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                Include: Name, Description, Category, Price
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                Headers are auto-detected
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                Duplicates are automatically skipped
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      <ProductImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportProducts}
        existingProducts={products}
      />
    </>
  );
}
