"use client";

import React, { useState } from 'react';
import { Upload, FileText, FileSearch, CheckCircle, Database, Eye, Loader2 as Loader, Sparkles, BookOpen } from 'lucide-react';

export default function KnowledgeBaseTab() {
  const [documents, setDocuments] = useState([
    { 
      id: 1, 
      name: 'Q3 2025 Market Analysis.pdf', 
      size: '2.4 MB', 
      status: 'processed',
      category: 'Market Research',
      categoryIcon: '📊',
      uploadedAt: '2 hours ago',
      chunks: 45,
      timesReferenced: 23,
      lastUsed: '2 mins ago'
    },
    { 
      id: 2, 
      name: 'Portfolio Allocation Strategy.docx', 
      size: '856 KB', 
      status: 'processed',
      category: 'Investment Strategy',
      categoryIcon: '💼',
      uploadedAt: '3 hours ago',
      chunks: 28,
      timesReferenced: 15,
      lastUsed: '5 mins ago'
    },
    { 
      id: 3, 
      name: 'SEC Compliance Guidelines 2025.pdf', 
      size: '3.1 MB', 
      status: 'processing',
      category: 'Compliance',
      categoryIcon: '⚖️',
      uploadedAt: 'Just now',
      chunks: 0,
      timesReferenced: 0
    },
  ]);

  const metrics = {
    totalChunks: documents.reduce((sum, doc) => sum + doc.chunks, 0),
  };

  const handleFileUpload = () => {
    const newDoc = {
      id: documents.length + 1,
      name: 'ESG Investment Framework.pdf',
      size: '1.8 MB',
      status: 'processing' as const,
      category: 'Investment Strategy',
      categoryIcon: '💼',
      uploadedAt: 'Just now',
      chunks: 0,
      timesReferenced: 0,
      lastUsed: ''
    };
    setDocuments([newDoc, ...documents]);
    
    setTimeout(() => {
      setDocuments(prev => prev.map(doc => 
        doc.id === newDoc.id ? { ...doc, status: 'processed' as const, chunks: 32 } : doc
      ));
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Database className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Train Your AI Knowledge Base</h2>
            <p className="text-gray-600">Upload documents to teach AI your expertise. The more you upload, the better AI understands your approach and methodology.</p>
          </div>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer group" onClick={handleFileUpload}>
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
            <Upload className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Drop files here or click to upload</h3>
          <p className="text-gray-600 mb-6">AI will automatically process and learn from your documents</p>
          <button
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg font-medium text-lg"
          >
            <Upload className="w-5 h-5" />
            Select Files
          </button>
          <p className="text-sm text-gray-500 mt-4">PDF, Word, Excel, PowerPoint, Text • Max 50MB per file</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          What Makes Great Training Data?
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Best Practices
            </h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Clear, well-structured documents</li>
              <li>• Your actual methodologies and frameworks</li>
              <li>• Recent and up-to-date content</li>
              <li>• Specific examples and case studies</li>
            </ul>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              Document Types
            </h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>📊 Research reports & market analysis</li>
              <li>💼 Investment strategies & guidelines</li>
              <li>⚖️ Compliance & regulatory docs</li>
              <li>❓ Client FAQs & common scenarios</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Your Knowledge Base</h3>
          <p className="text-sm text-gray-600">{documents.length} documents • {metrics.totalChunks} knowledge chunks</p>
        </div>
        <div className="divide-y divide-gray-200">
          {documents.map(doc => (
            <div key={doc.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{doc.name}</h4>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>{doc.size}</span>
                        <span>•</span>
                        <span>{doc.uploadedAt}</span>
                        {doc.status === 'processed' && (
                          <>
                            <span>•</span>
                            <span>{doc.chunks} chunks</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.status === 'processing' ? (
                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          <Loader className="w-4 h-4 animate-spin" />
                          Processing...
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                            <CheckCircle className="w-4 h-4" />
                            Active
                          </div>
                          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                            <FileSearch className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {doc.status === 'processed' && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{doc.categoryIcon}</span>
                            <div>
                              <div className="font-medium text-gray-900">{doc.category}</div>
                              <div className="text-xs text-gray-500">Category</div>
                            </div>
                          </div>
                          <div className="h-8 w-px bg-gray-300"></div>
                          <div>
                            <div className="font-medium text-gray-900">{doc.timesReferenced}</div>
                            <div className="text-xs text-gray-500">References</div>
                          </div>
                          <div className="h-8 w-px bg-gray-300"></div>
                          <div>
                            <div className="font-medium text-gray-900">{doc.lastUsed}</div>
                            <div className="text-xs text-gray-500">Last Used</div>
                          </div>
                        </div>
                        <button className="flex items-center gap-1 text-blue-600 hover:text-blue-700">
                          <Eye className="w-4 h-4" />
                          View Usage
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
