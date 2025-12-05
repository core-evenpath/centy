"use client";

import React from 'react';
import { usePartnerHub } from '@/hooks/use-partnerhub';
import { DocumentCard } from '@/components/partner/inbox/DocumentCard';
import { Plus, Trash2 } from 'lucide-react';
import { ChatContextType } from '@/lib/partnerhub-types';
import { useRouter } from 'next/navigation';

interface AssetsPanelProps {
    onChat?: (doc: any) => void;
}

export default function AssetsPanel({ onChat }: AssetsPanelProps) {
    const {
        filteredDocuments,
        uploadDocument,
        deleteDocument,
        addTagToDocument,
        switchContext
    } = usePartnerHub();

    const router = useRouter();
    const [isDragging, setIsDragging] = React.useState(false);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        await Promise.all(Array.from(files).map(file => uploadDocument(file)));
        event.target.value = '';
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Check if we're leaving to a child element
        if (e.currentTarget.contains(e.relatedTarget as Node)) {
            return;
        }

        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            await Promise.all(Array.from(files).map(file => uploadDocument(file)));
        }
    };

    const handleDocumentSelect = (doc: any) => {
        switchContext({
            id: doc.id,
            type: ChatContextType.DOCUMENT,
            name: doc.name,
            subtext: `${(doc.size / 1024).toFixed(0)} KB • ${doc.category.toUpperCase()}`,
            avatarColor: 'bg-blue-500',
            isGlobal: false,
            selectedItems: [{ id: doc.id, type: 'document', name: doc.name }],
        });

        if (onChat) {
            onChat(doc);
        } else {
            router.push('/partner/inbox');
        }
    };

    return (
        <div
            className="flex-1 overflow-y-auto p-6 bg-gray-50 animate-in fade-in duration-300"
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {isDragging && (
                <div className="absolute inset-0 z-50 bg-indigo-50/90 border-2 border-dashed border-indigo-500 rounded-xl flex items-center justify-center m-4 backdrop-blur-sm transition-all">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Plus className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-indigo-900">Drop files here</h3>
                        <p className="text-indigo-600 mt-1">Upload multiple documents instantly</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                {filteredDocuments.map(doc => (
                    <div key={doc.id} className="relative group">
                        <DocumentCard
                            doc={doc}
                            variant="grid"
                            onChat={() => handleDocumentSelect(doc)}
                            onAddTag={(tag) => addTagToDocument(doc.id, tag)}
                            onModifyImage={(id) => {
                                switchContext({
                                    id: doc.id,
                                    type: ChatContextType.DOCUMENT,
                                    name: doc.name,
                                    subtext: `${(doc.size / 1024).toFixed(0)} KB • ${doc.category.toUpperCase()}`,
                                    avatarColor: 'bg-pink-500',
                                    isGlobal: false,
                                    selectedItems: [{ id: doc.id, type: 'document', name: doc.name }],
                                    initialMode: 'image'
                                });
                                if (onChat) {
                                    onChat(doc);
                                } else {
                                    router.push('/partner/inbox');
                                }
                            }}
                        />
                        <button
                            onClick={(e) => { e.stopPropagation(); deleteDocument(doc.id); }}
                            className="absolute top-2 right-2 p-1.5 bg-white text-gray-400 hover:text-red-500 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-gray-100"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all cursor-pointer group h-full min-h-[160px]">
                    <input type="file" className="hidden" id="card-upload" onChange={handleFileUpload} multiple />
                    <label htmlFor="card-upload" className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                        <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-white flex items-center justify-center mb-3 transition-colors">
                            <Plus className="w-6 h-6 text-gray-400 group-hover:text-indigo-500" />
                        </div>
                        <span className="text-sm font-medium group-hover:text-indigo-600">Add New File</span>
                        <span className="text-xs text-gray-400 mt-1">or drag and drop</span>
                    </label>
                </div>
            </div>
        </div>
    );
}