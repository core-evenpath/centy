'use client';

import React, { useState, useCallback } from 'react';
import {
  X,
  Upload,
  ClipboardPaste,
  Plus,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Package,
} from 'lucide-react';
import type { ImportedProduct, FieldSource } from '../types';

interface ProductImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (products: ImportedProduct[]) => void;
  existingProducts: ImportedProduct[];
}

type ImportMethod = 'upload' | 'paste' | 'manual';

interface ParsedProduct {
  name: string;
  description?: string;
  category?: string;
  price?: string;
  features?: string;
  isValid: boolean;
  error?: string;
}

export function ProductImportModal({
  isOpen,
  onClose,
  onImport,
  existingProducts,
}: ProductImportModalProps) {
  const [method, setMethod] = useState<ImportMethod>('paste');
  const [pasteContent, setPasteContent] = useState('');
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [manualProduct, setManualProduct] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    features: '',
  });
  const [importing, setImporting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Parse pasted content (CSV or tab-separated)
  const parsePastedContent = useCallback((content: string) => {
    setParseError(null);
    const lines = content.trim().split('\n');

    if (lines.length === 0) {
      setParsedProducts([]);
      return;
    }

    // Detect delimiter (tab or comma)
    const firstLine = lines[0];
    const hasTab = firstLine.includes('\t');
    const delimiter = hasTab ? '\t' : ',';

    // Check if first line is header
    const headerKeywords = ['name', 'product', 'title', 'description', 'price', 'category'];
    const firstLineLower = firstLine.toLowerCase();
    const hasHeader = headerKeywords.some(keyword => firstLineLower.includes(keyword));

    const dataLines = hasHeader ? lines.slice(1) : lines;

    // Parse header to understand column order
    let columnMap = { name: 0, description: 1, category: 2, price: 3, features: 4 };

    if (hasHeader) {
      const headers = firstLine.split(delimiter).map(h => h.trim().toLowerCase());
      headers.forEach((header, index) => {
        if (header.includes('name') || header.includes('product') || header.includes('title')) {
          columnMap.name = index;
        } else if (header.includes('desc')) {
          columnMap.description = index;
        } else if (header.includes('cat') || header.includes('type')) {
          columnMap.category = index;
        } else if (header.includes('price') || header.includes('cost') || header.includes('rate')) {
          columnMap.price = index;
        } else if (header.includes('feature') || header.includes('ameniti')) {
          columnMap.features = index;
        }
      });
    }

    const parsed: ParsedProduct[] = [];

    for (const line of dataLines) {
      if (!line.trim()) continue;

      // Handle quoted values in CSV
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if ((char === delimiter || char === '\t') && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const name = values[columnMap.name]?.replace(/^["']|["']$/g, '') || '';

      if (!name) {
        continue; // Skip empty rows
      }

      parsed.push({
        name,
        description: values[columnMap.description]?.replace(/^["']|["']$/g, '') || '',
        category: values[columnMap.category]?.replace(/^["']|["']$/g, '') || '',
        price: values[columnMap.price]?.replace(/^["']|["']$/g, '') || '',
        features: values[columnMap.features]?.replace(/^["']|["']$/g, '') || '',
        isValid: true,
      });
    }

    if (parsed.length === 0) {
      setParseError('No valid products found. Make sure the first column contains product names.');
    }

    setParsedProducts(parsed);
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      parsePastedContent(content);
    };
    reader.onerror = () => {
      setParseError('Failed to read file. Please try again.');
    };
    reader.readAsText(file);
  }, [parsePastedContent]);

  // Handle paste change
  const handlePasteChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setPasteContent(content);
    if (content.trim()) {
      parsePastedContent(content);
    } else {
      setParsedProducts([]);
    }
  }, [parsePastedContent]);

  // Remove a parsed product
  const removeProduct = useCallback((index: number) => {
    setParsedProducts(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Add manual product to list
  const addManualProduct = useCallback(() => {
    if (!manualProduct.name.trim()) return;

    setParsedProducts(prev => [...prev, {
      name: manualProduct.name.trim(),
      description: manualProduct.description.trim(),
      category: manualProduct.category.trim(),
      price: manualProduct.price.trim(),
      features: manualProduct.features.trim(),
      isValid: true,
    }]);

    setManualProduct({
      name: '',
      description: '',
      category: '',
      price: '',
      features: '',
    });
  }, [manualProduct]);

  // Import products
  const handleImport = useCallback(() => {
    setImporting(true);

    const existingNames = new Set(
      existingProducts.map(p => p.name.toLowerCase().trim())
    );

    const newProducts: ImportedProduct[] = parsedProducts
      .filter(p => p.isValid && p.name && !existingNames.has(p.name.toLowerCase().trim()))
      .map((p, index) => ({
        id: `manual_product_${Date.now()}_${index}`,
        name: p.name,
        description: p.description || '',
        category: p.category || 'General',
        pricing: p.price || '',
        features: p.features ? p.features.split(/[,;]/).map(f => f.trim()).filter(Boolean) : [],
        popular: false,
        selected: true,
        source: 'manual' as FieldSource,
      }));

    setTimeout(() => {
      onImport(newProducts);
      setImporting(false);
      setParsedProducts([]);
      setPasteContent('');
      onClose();
    }, 500);
  }, [parsedProducts, existingProducts, onImport, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Import Products</h2>
              <p className="text-sm text-slate-500">Add products from spreadsheet or manually</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Method Tabs */}
        <div className="flex border-b px-5">
          {[
            { id: 'paste' as const, label: 'Paste Data', icon: ClipboardPaste },
            { id: 'upload' as const, label: 'Upload File', icon: Upload },
            { id: 'manual' as const, label: 'Add Manually', icon: Plus },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMethod(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                method === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 250px)' }}>
          {/* Paste Method */}
          {method === 'paste' && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-600 mb-2">
                  Paste product data from Excel, Google Sheets, or any spreadsheet.
                  Supports tab-separated or comma-separated values.
                </p>
                <p className="text-xs text-slate-500">
                  Format: <span className="font-mono">Name, Description, Category, Price, Features</span>
                </p>
              </div>

              <textarea
                value={pasteContent}
                onChange={handlePasteChange}
                placeholder={`Paste your product data here...

Example:
Product Name\tDescription\tCategory\tPrice\tFeatures
Premium Widget\tHigh quality widget\tWidgets\t$99\tDurable, Lightweight
Basic Service\tStandard service package\tServices\t$50/hr\tFast, Reliable`}
                className="w-full h-48 px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-mono resize-none focus:border-indigo-500 focus:outline-none"
              />
            </div>
          )}

          {/* Upload Method */}
          {method === 'upload' && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-600">
                  Upload a CSV or TXT file with your product data.
                  First row can be headers (Name, Description, Category, Price, Features).
                </p>
              </div>

              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors">
                <FileSpreadsheet className="w-12 h-12 text-slate-400 mb-3" />
                <span className="text-sm font-medium text-slate-600">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  CSV, TXT files supported
                </span>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Manual Method */}
          {method === 'manual' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Product/Service Name *
                  </label>
                  <input
                    type="text"
                    value={manualProduct.name}
                    onChange={(e) => setManualProduct(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g., Premium Consultation"
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={manualProduct.description}
                    onChange={(e) => setManualProduct(p => ({ ...p, description: e.target.value }))}
                    placeholder="Brief description of the product or service"
                    rows={2}
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:border-indigo-500 focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={manualProduct.category}
                    onChange={(e) => setManualProduct(p => ({ ...p, category: e.target.value }))}
                    placeholder="e.g., Consulting"
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Price
                  </label>
                  <input
                    type="text"
                    value={manualProduct.price}
                    onChange={(e) => setManualProduct(p => ({ ...p, price: e.target.value }))}
                    placeholder="e.g., $99/hr"
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Features (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={manualProduct.features}
                    onChange={(e) => setManualProduct(p => ({ ...p, features: e.target.value }))}
                    placeholder="e.g., Fast delivery, 24/7 support, Money-back guarantee"
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={addManualProduct}
                disabled={!manualProduct.name.trim()}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add to Import List
              </button>
            </div>
          )}

          {/* Parse Error */}
          {parseError && (
            <div className="mt-4 flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-3 rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{parseError}</span>
            </div>
          )}

          {/* Parsed Products Preview */}
          {parsedProducts.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900">
                  Products to Import ({parsedProducts.length})
                </h3>
                <button
                  onClick={() => setParsedProducts([])}
                  className="text-sm text-slate-500 hover:text-red-600"
                >
                  Clear All
                </button>
              </div>

              <div className="border rounded-xl overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  {parsedProducts.map((product, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between px-4 py-3 border-b last:border-0 hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {product.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            {product.category && <span>{product.category}</span>}
                            {product.price && <span>• {product.price}</span>}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeProduct(index)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t bg-slate-50">
          <p className="text-sm text-slate-500">
            {parsedProducts.length > 0
              ? `${parsedProducts.length} products ready to import`
              : 'No products to import yet'}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={parsedProducts.length === 0 || importing}
              className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {importing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Package className="w-4 h-4" />
                  Import {parsedProducts.length} Products
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
