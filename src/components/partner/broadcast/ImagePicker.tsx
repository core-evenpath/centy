"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { getPartnerModulesAction, getModuleItemsAction } from '@/actions/modules-actions';

interface ImagePickerProps {
    partnerId: string;
    value: string | null;
    onChange: (url: string | null) => void;
}

type Tab = 'upload' | 'library';

interface LibraryImage {
    url: string;
    label: string;
    source: string;
}

export function ImagePicker({ partnerId, value, onChange }: ImagePickerProps) {
    const [tab, setTab] = useState<Tab>('upload');
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [libraryImages, setLibraryImages] = useState<LibraryImage[]>([]);
    const [loadingLibrary, setLoadingLibrary] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    // Fetch module images for library tab
    useEffect(() => {
        if (tab !== 'library' || libraryImages.length > 0) return;

        const fetchLibrary = async () => {
            setLoadingLibrary(true);
            try {
                const modulesRes = await getPartnerModulesAction(partnerId);
                if (!modulesRes.success || !modulesRes.data) return;

                const images: LibraryImage[] = [];

                for (const mod of modulesRes.data.slice(0, 5)) {
                    const itemsRes = await getModuleItemsAction(partnerId, mod.id);
                    if (!itemsRes.success || !itemsRes.data?.items) continue;

                    for (const item of (itemsRes.data.items as any[])) {
                        // Check for image fields
                        if (item.images && Array.isArray(item.images)) {
                            item.images.forEach((img: string) => {
                                if (img && typeof img === 'string' && img.startsWith('http')) {
                                    images.push({
                                        url: img,
                                        label: item.name || 'Untitled',
                                        source: mod.name || mod.moduleSlug || 'Module',
                                    });
                                }
                            });
                        }
                        // Check for imageUrl field
                        if (item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.startsWith('http')) {
                            images.push({
                                url: item.imageUrl,
                                label: item.name || 'Untitled',
                                source: mod.name || mod.moduleSlug || 'Module',
                            });
                        }
                        // Check for thumbnail/photo fields
                        for (const key of ['thumbnail', 'photo', 'coverImage', 'image']) {
                            if (item[key] && typeof item[key] === 'string' && item[key].startsWith('http')) {
                                images.push({
                                    url: item[key],
                                    label: item.name || 'Untitled',
                                    source: mod.name || mod.moduleSlug || 'Module',
                                });
                            }
                        }
                    }
                }

                // Deduplicate by URL
                const seen = new Set<string>();
                const unique = images.filter(img => {
                    if (seen.has(img.url)) return false;
                    seen.add(img.url);
                    return true;
                });

                setLibraryImages(unique);
            } catch (err) {
                console.error('Error fetching library images:', err);
            } finally {
                setLoadingLibrary(false);
            }
        };

        fetchLibrary();
    }, [tab, partnerId, libraryImages.length]);

    const handleFileUpload = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) {
            setUploadError('Please select an image file (JPG, PNG, WebP)');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setUploadError('Image must be under 5 MB');
            return;
        }

        setUploading(true);
        setUploadError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('partnerId', partnerId);
            formData.append('filename', file.name);

            const response = await fetch('/api/upload-media', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Upload failed');
            }

            const result = await response.json();
            onChange(result.url);
        } catch (err: any) {
            setUploadError(err.message || 'Failed to upload image');
        } finally {
            setUploading(false);
        }
    }, [partnerId, onChange]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileUpload(file);
    }, [handleFileUpload]);

    return (
        <div className="space-y-4">
            {/* Current image preview */}
            {value && (
                <div className="relative rounded-lg border border-gray-200 overflow-hidden">
                    <img src={value} alt="Selected" className="w-full h-36 object-cover" />
                    <button
                        onClick={() => onChange(null)}
                        className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center text-xs transition-colors"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                    onClick={() => setTab('upload')}
                    className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${tab === 'upload' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    📤 Upload
                </button>
                <button
                    onClick={() => setTab('library')}
                    className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${tab === 'library' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    🖼️ Library
                </button>
            </div>

            {/* Upload Tab */}
            {tab === 'upload' && (
                <div>
                    <div
                        onDrop={handleDrop}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${dragOver
                            ? 'border-indigo-400 bg-indigo-50/50'
                            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50/50'
                            }`}
                    >
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
                            className="hidden"
                            id="broadcast-img-upload"
                        />
                        <label htmlFor="broadcast-img-upload" className="cursor-pointer">
                            {uploading ? (
                                <div className="flex flex-col items-center gap-2">
                                    <span className="text-2xl animate-spin">⏳</span>
                                    <span className="text-sm text-gray-600 font-medium">Uploading...</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <span className="text-2xl">📷</span>
                                    <span className="text-sm font-medium text-gray-700">Drop image here or click to upload</span>
                                    <span className="text-[11px] text-gray-400">JPG, PNG, WebP · Max 5 MB</span>
                                </div>
                            )}
                        </label>
                    </div>
                    {uploadError && (
                        <div className="mt-2 text-xs text-red-600 flex items-center gap-1.5 px-1">
                            ⚠️ {uploadError}
                        </div>
                    )}

                    {/* URL paste fallback */}
                    <div className="mt-3">
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className="flex-1 h-px bg-gray-200" />
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider">or paste URL</span>
                            <div className="flex-1 h-px bg-gray-200" />
                        </div>
                        <input
                            type="url"
                            value={value || ''}
                            onChange={e => onChange(e.target.value || null)}
                            placeholder="https://example.com/image.jpg"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                        />
                    </div>
                </div>
            )}

            {/* Library Tab */}
            {tab === 'library' && (
                <div>
                    {loadingLibrary ? (
                        <div className="py-8 text-center">
                            <span className="text-2xl animate-spin block mb-2">⏳</span>
                            <span className="text-sm text-gray-500">Loading your images...</span>
                        </div>
                    ) : libraryImages.length === 0 ? (
                        <div className="py-8 text-center">
                            <span className="text-3xl block mb-2 opacity-50">🖼️</span>
                            <span className="text-sm text-gray-500">No images found in your modules</span>
                            <p className="text-[11px] text-gray-400 mt-1">
                                Add images to your inventory modules to see them here
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-2 max-h-[280px] overflow-y-auto">
                            {libraryImages.map((img, i) => (
                                <button
                                    key={i}
                                    onClick={() => onChange(img.url)}
                                    className={`relative rounded-lg overflow-hidden border-2 transition-all aspect-square group ${value === img.url
                                        ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                                        : 'border-transparent hover:border-gray-300'
                                        }`}
                                >
                                    <img
                                        src={img.url}
                                        alt={img.label}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end">
                                        <div className="w-full px-1.5 py-1 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="text-[10px] text-white font-medium truncate">{img.label}</div>
                                            <div className="text-[9px] text-white/70 truncate">{img.source}</div>
                                        </div>
                                    </div>
                                    {value === img.url && (
                                        <div className="absolute top-1 right-1 w-5 h-5 bg-indigo-500 text-white rounded-full flex items-center justify-center text-[10px]">
                                            ✓
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
