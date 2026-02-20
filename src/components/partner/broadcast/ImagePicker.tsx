"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { getPartnerModulesAction, getModuleItemsAction } from '@/actions/modules-actions';
import { generateBroadcastImageAction, suggestImagePromptsAction } from '@/actions/broadcast-image-actions';

interface ImagePickerProps {
    partnerId: string;
    value: string | null;
    onChange: (url: string | null) => void;
    broadcastMessage?: string;
    businessName?: string;
    industry?: string;
}

type Tab = 'upload' | 'library' | 'ai-generate';

interface LibraryImage {
    url: string;
    label: string;
    source: string;
}

export function ImagePicker({ partnerId, value, onChange, broadcastMessage, businessName, industry }: ImagePickerProps) {
    const [tab, setTab] = useState<Tab>('upload');
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [libraryImages, setLibraryImages] = useState<LibraryImage[]>([]);
    const [loadingLibrary, setLoadingLibrary] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    // AI Generate state
    const [aiPrompt, setAiPrompt] = useState('');
    const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
    const [isGeneratingAi, setIsGeneratingAi] = useState(false);
    const [isUploadingGenerated, setIsUploadingGenerated] = useState(false);
    const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);
    const [aiError, setAiError] = useState<string | null>(null);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [modifyingExisting, setModifyingExisting] = useState(false);

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
                        if (item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.startsWith('http')) {
                            images.push({
                                url: item.imageUrl,
                                label: item.name || 'Untitled',
                                source: mod.name || mod.moduleSlug || 'Module',
                            });
                        }
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

    // Fetch AI suggested prompts when tab opens
    useEffect(() => {
        if (tab !== 'ai-generate' || suggestedPrompts.length > 0) return;
        if (!broadcastMessage) return;

        const fetchSuggestions = async () => {
            setLoadingSuggestions(true);
            try {
                const res = await suggestImagePromptsAction(
                    broadcastMessage,
                    businessName || 'Business',
                    industry || 'general'
                );
                if (res.success && res.prompts) {
                    setSuggestedPrompts(res.prompts);
                }
            } catch (err) {
                console.error('Failed to load suggested prompts:', err);
            } finally {
                setLoadingSuggestions(false);
            }
        };

        fetchSuggestions();
    }, [tab, broadcastMessage, businessName, industry, suggestedPrompts.length]);

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

    // AI image generation handler
    const handleAiGenerate = useCallback(async () => {
        if (!aiPrompt.trim()) return;
        setIsGeneratingAi(true);
        setAiError(null);
        setGeneratedPreview(null);

        try {
            let referenceImage: { base64: string; mimeType: string } | undefined;

            if (modifyingExisting && value) {
                try {
                    const response = await fetch(value);
                    const blob = await response.blob();
                    const base64 = await new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve((reader.result as string).split(',')[1]);
                        reader.readAsDataURL(blob);
                    });
                    referenceImage = { base64, mimeType: blob.type || 'image/png' };
                } catch {
                    console.warn('Could not fetch reference image, generating from scratch');
                }
            }

            const result = await generateBroadcastImageAction(aiPrompt, referenceImage);
            if (result.success && result.dataUri) {
                setGeneratedPreview(result.dataUri);
            } else {
                setAiError(result.error || 'Failed to generate image');
            }
        } catch (err: any) {
            setAiError(err.message || 'Generation failed');
        } finally {
            setIsGeneratingAi(false);
        }
    }, [aiPrompt, modifyingExisting, value]);

    // Upload generated image to Firebase Storage
    const handleUseGenerated = useCallback(async () => {
        if (!generatedPreview) return;
        setIsUploadingGenerated(true);

        try {
            const response = await fetch('/api/upload-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: generatedPreview,
                    partnerId,
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Upload failed');
            }

            const result = await response.json();
            onChange(result.url);
            setGeneratedPreview(null);
            setAiPrompt('');
            setModifyingExisting(false);
        } catch (err: any) {
            setAiError(err.message || 'Failed to upload generated image');
        } finally {
            setIsUploadingGenerated(false);
        }
    }, [generatedPreview, partnerId, onChange]);

    return (
        <div className="space-y-4">
            {/* Current image preview */}
            {value && (
                <div className="relative rounded-lg border border-gray-200 overflow-hidden">
                    <img src={value} alt="Selected" className="w-full h-36 object-cover" />
                    <div className="absolute top-2 right-2 flex gap-1.5">
                        <button
                            onClick={() => {
                                setTab('ai-generate');
                                setModifyingExisting(true);
                                setAiPrompt('');
                            }}
                            className="w-7 h-7 bg-indigo-500/80 hover:bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
                            title="Modify with AI"
                        >
                            ✨
                        </button>
                        <button
                            onClick={() => onChange(null)}
                            className="w-7 h-7 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center text-xs transition-colors"
                        >
                            ✕
                        </button>
                    </div>
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
                <button
                    onClick={() => { setTab('ai-generate'); setModifyingExisting(false); }}
                    className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${tab === 'ai-generate' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    ✨ AI Generate
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

            {/* AI Generate Tab */}
            {tab === 'ai-generate' && (
                <div className="space-y-3">
                    {modifyingExisting && (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2 text-xs text-indigo-700 flex items-center gap-1.5">
                            ✨ Modifying existing image — describe what changes you want
                        </div>
                    )}

                    {/* Auto-suggested prompts */}
                    {loadingSuggestions ? (
                        <div className="space-y-1.5">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : suggestedPrompts.length > 0 ? (
                        <div>
                            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                Suggested Prompts
                            </div>
                            <div className="space-y-1.5">
                                {suggestedPrompts.map((p, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setAiPrompt(p)}
                                        className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                                            aiPrompt === p
                                                ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                                                : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                        }`}
                                    >
                                        ✨ {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {/* Custom prompt input */}
                    <div>
                        <textarea
                            value={aiPrompt}
                            onChange={e => setAiPrompt(e.target.value)}
                            placeholder={modifyingExisting ? "Describe how to modify the image..." : "Describe the image you want..."}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 resize-none"
                        />
                    </div>

                    {/* Generate button */}
                    <button
                        onClick={handleAiGenerate}
                        disabled={!aiPrompt.trim() || isGeneratingAi}
                        className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                        {isGeneratingAi ? (
                            <>
                                <span className="animate-spin">⏳</span> Generating...
                            </>
                        ) : (
                            <>✨ {modifyingExisting ? 'Modify Image' : 'Generate Image'}</>
                        )}
                    </button>

                    {/* Generated image preview */}
                    {generatedPreview && (
                        <div className="space-y-2">
                            <img
                                src={generatedPreview}
                                alt="AI Generated"
                                className="w-full rounded-lg border border-gray-200"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleUseGenerated}
                                    disabled={isUploadingGenerated}
                                    className="flex-1 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
                                >
                                    {isUploadingGenerated ? 'Uploading...' : 'Use This Image'}
                                </button>
                                <button
                                    onClick={handleAiGenerate}
                                    disabled={isGeneratingAi}
                                    className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                                >
                                    🔄 Regenerate
                                </button>
                            </div>
                        </div>
                    )}

                    {/* AI generation error */}
                    {aiError && (
                        <div className="text-xs text-red-600 flex items-center gap-1.5 px-1">
                            ⚠️ {aiError}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
