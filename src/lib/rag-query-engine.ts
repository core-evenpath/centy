'use server';

import { GoogleGenAI } from '@google/genai';
import { db } from '@/lib/firebase-admin';
import type { VaultQueryResult, GroundingChunk, VaultQuerySource, VaultFile } from '@/lib/types-vault';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const RAG_SYSTEM_INSTRUCTION = `You are an intelligent assistant that answers questions based ONLY on the documents provided in the knowledge base.

CRITICAL RULES:
1. ONLY use information from the retrieved documents to answer questions
2. If the documents contain relevant information, provide a clear, comprehensive answer
3. If the documents do NOT contain relevant information, clearly state: "I couldn't find information about that in the uploaded documents."
4. Always cite your sources by mentioning which document the information came from
5. Be specific and quote relevant passages when appropriate
6. Do NOT make up information or use external knowledge
7. If information is partial or incomplete, acknowledge that
8. Structure your response clearly with key points

When citing sources, use this format: "According to [Document Name]..." or "In [Document Name], it states..."`;

interface DocumentNameMapping {
    geminiName: string;
    displayName: string;
    fileId: string;
}

async function buildDocumentMapping(ragStoreName: string, partnerId: string): Promise<Map<string, DocumentNameMapping>> {
    const mapping = new Map<string, DocumentNameMapping>();

    try {
        if (db) {
            const filesSnapshot = await db
                .collection(`partners/${partnerId}/vaultFiles`)
                .where('state', '==', 'ACTIVE')
                .get();

            for (const doc of filesSnapshot.docs) {
                const data = doc.data();
                if (data.geminiFileName) {
                    mapping.set(data.geminiFileName, {
                        geminiName: data.geminiFileName,
                        displayName: data.displayName || data.name,
                        fileId: doc.id,
                    });

                    const shortName = data.geminiFileName.split('/').pop() || '';
                    if (shortName) {
                        mapping.set(shortName, {
                            geminiName: data.geminiFileName,
                            displayName: data.displayName || data.name,
                            fileId: doc.id,
                        });
                    }
                }
            }
        }

        let pageToken: string | undefined;
        do {
            const listParams: any = {
                parent: ragStoreName,
                config: { pageSize: 20 }
            };
            if (pageToken) {
                listParams.config.pageToken = pageToken;
            }

            const response = await genAI.fileSearchStores.documents.list(listParams) as any;

            if (response.documents) {
                for (const doc of response.documents) {
                    if (doc.name && !mapping.has(doc.name)) {
                        const fileIdMeta = doc.customMetadata?.find((m: any) => m.key === 'fileId');
                        const fileNameMeta = doc.customMetadata?.find((m: any) => m.key === 'fileName');

                        mapping.set(doc.name, {
                            geminiName: doc.name,
                            displayName: fileNameMeta?.stringValue || doc.displayName || doc.name.split('/').pop() || 'Document',
                            fileId: fileIdMeta?.stringValue || '',
                        });

                        const shortName = doc.name.split('/').pop() || '';
                        if (shortName && !mapping.has(shortName)) {
                            mapping.set(shortName, {
                                geminiName: doc.name,
                                displayName: fileNameMeta?.stringValue || doc.displayName || shortName,
                                fileId: fileIdMeta?.stringValue || '',
                            });
                        }
                    }
                }
            }

            pageToken = response.nextPageToken;
        } while (pageToken);

        console.log(`📋 Document mapping built with ${mapping.size} entries`);
    } catch (error) {
        console.warn('⚠️ Error building document mapping:', error);
    }

    return mapping;
}

function buildMetadataFilter(fileIds: string[]): string | undefined {
    if (!fileIds.length) return undefined;

    const filterParts = fileIds.map(id => `fileId="${id}"`);
    let filter = filterParts.join(' OR ');

    if (filter.length > 5000) {
        console.warn('⚠️ Filter too long, truncating to first 50 files');
        filter = filterParts.slice(0, 50).join(' OR ');
    }

    return filter;
}

export async function queryVaultRAG(
    partnerId: string,
    question: string,
    options?: {
        selectedFileIds?: string[];
        maxChunks?: number;
    }
): Promise<VaultQueryResult> {
    const startTime = Date.now();
    const maxChunks = options?.maxChunks || 15;

    console.log('═══════════════════════════════════════');
    console.log('🔍 RAG QUERY STARTING');
    console.log('═══════════════════════════════════════');
    console.log(`📊 Partner: ${partnerId}`);
    console.log(`📊 Question: "${question}"`);
    console.log(`📊 Selected files: ${options?.selectedFileIds?.length || 'ALL'}`);

    try {
        if (!db) {
            return { success: false, message: 'Database not available' };
        }

        const storesSnapshot = await db
            .collection(`partners/${partnerId}/fileSearchStores`)
            .where('state', '==', 'ACTIVE')
            .limit(1)
            .get();

        if (storesSnapshot.empty) {
            return {
                success: false,
                message: 'No document vault found. Please upload documents first.',
            };
        }

        const ragStoreName = storesSnapshot.docs[0].data().name;
        console.log(`✅ RAG Store: ${ragStoreName}`);

        let effectiveFileIds = options?.selectedFileIds || [];

        if (effectiveFileIds.length === 0) {
            console.log('🔵 No files selected, fetching all active files...');
            const activeFilesSnapshot = await db
                .collection(`partners/${partnerId}/vaultFiles`)
                .where('state', '==', 'ACTIVE')
                .get();

            effectiveFileIds = activeFilesSnapshot.docs.map(doc => doc.id);
            console.log(`✅ Found ${effectiveFileIds.length} active files`);

            if (effectiveFileIds.length === 0) {
                return {
                    success: true,
                    message: 'No active documents found',
                    response: "I don't have any documents to search. Please upload some documents first.",
                    sources: [],
                    groundingChunks: [],
                };
            }
        }

        const docMapping = await buildDocumentMapping(ragStoreName, partnerId);

        const metadataFilter = buildMetadataFilter(effectiveFileIds);
        console.log(`📤 Metadata filter: ${metadataFilter ? `${effectiveFileIds.length} files` : 'NONE'}`);

        const retrievalStart = Date.now();

        const fileSearchConfig: any = {
            fileSearchStoreNames: [ragStoreName],
        };

        if (metadataFilter) {
            fileSearchConfig.metadataFilter = metadataFilter;
        }

        console.log('🔵 Calling Gemini with File Search...');

        const response = await genAI.models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: question,
            config: {
                systemInstruction: RAG_SYSTEM_INSTRUCTION,
                tools: [{ fileSearch: fileSearchConfig }],
                temperature: 0.3,
                maxOutputTokens: 4096,
            }
        });

        const retrievalTime = Date.now() - retrievalStart;
        const responseText = response.text || '';

        console.log(`✅ Response received in ${retrievalTime}ms`);
        console.log(`📝 Response length: ${responseText.length} chars`);

        let groundingChunks: GroundingChunk[] = [];
        const sourcesMap = new Map<string, VaultQuerySource>();

        if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            const rawChunks = response.candidates[0].groundingMetadata.groundingChunks;
            console.log(`📚 Retrieved ${rawChunks.length} grounding chunks`);

            for (const chunk of rawChunks) {
                const ctx = chunk.retrievedContext;
                if (!ctx?.text) continue;

                let sourceInfo: DocumentNameMapping | undefined;

                if (ctx.uri) {
                    sourceInfo = docMapping.get(ctx.uri);
                    if (!sourceInfo) {
                        const uriParts = ctx.uri.split('/');
                        for (let i = uriParts.length - 1; i >= 0; i--) {
                            sourceInfo = docMapping.get(uriParts[i]);
                            if (sourceInfo) break;
                        }
                    }
                }

                if (!sourceInfo && ctx.title) {
                    for (const [, info] of docMapping) {
                        if (info.displayName === ctx.title) {
                            sourceInfo = info;
                            break;
                        }
                    }
                }

                const displayName = sourceInfo?.displayName || ctx.title || 'Document';
                const fileId = sourceInfo?.fileId || '';

                groundingChunks.push({
                    content: ctx.text.substring(0, 1500),
                    source: displayName,
                    sourceFileId: fileId,
                    sourceFileName: displayName,
                    score: 0.85,
                });

                if (fileId && !sourcesMap.has(fileId)) {
                    sourcesMap.set(fileId, {
                        fileId,
                        fileName: displayName,
                        relevanceScore: 0.85,
                        excerpts: [ctx.text.substring(0, 300)],
                    });
                } else if (fileId) {
                    const existing = sourcesMap.get(fileId)!;
                    if (existing.excerpts.length < 3) {
                        existing.excerpts.push(ctx.text.substring(0, 300));
                    }
                }
            }
        }

        groundingChunks = groundingChunks.slice(0, maxChunks);
        const sources = Array.from(sourcesMap.values());

        const consolidatedTags: string[] = [];
        if (sources.length > 0 && db) {
            try {
                const fileIds = sources.map(s => s.fileId).filter(Boolean);
                if (fileIds.length > 0) {
                    const filesSnapshot = await db
                        .collection(`partners/${partnerId}/vaultFiles`)
                        .where('__name__', 'in', fileIds.slice(0, 10))
                        .get();

                    const tagSet = new Set<string>();
                    filesSnapshot.docs.forEach(doc => {
                        const data = doc.data();
                        if (data.tags) {
                            if (data.tags.primaryCategory) tagSet.add(data.tags.primaryCategory);
                            data.tags.topics?.forEach((t: string) => tagSet.add(t));
                            data.tags.keywords?.slice(0, 5).forEach((k: string) => tagSet.add(k));
                        }
                    });
                    consolidatedTags.push(...Array.from(tagSet).slice(0, 15));
                }
            } catch (error) {
                console.warn('⚠️ Could not fetch consolidated tags:', error);
            }
        }

        const totalTime = Date.now() - startTime;

        console.log('═══════════════════════════════════════');
        console.log('✅ RAG QUERY COMPLETE');
        console.log(`⏱️ Total time: ${totalTime}ms`);
        console.log(`📚 Sources: ${sources.length}`);
        console.log(`📚 Chunks: ${groundingChunks.length}`);
        console.log(`🏷️ Tags: ${consolidatedTags.length}`);
        console.log('═══════════════════════════════════════');

        return {
            success: true,
            message: 'Query successful',
            response: responseText,
            sources,
            groundingChunks,
            consolidatedTags,
            usage: {
                model: 'gemini-3.1-pro-preview',
            },
            timings: {
                totalMs: totalTime,
                retrievalMs: retrievalTime,
                generationMs: totalTime - retrievalTime,
            },
        };

    } catch (error: any) {
        console.error('═══════════════════════════════════════');
        console.error('❌ RAG QUERY FAILED');
        console.error('Error:', error.message);
        console.error('═══════════════════════════════════════');

        return {
            success: false,
            message: `Query failed: ${error.message}`,
        };
    }
}

export async function getActiveFileIds(partnerId: string): Promise<string[]> {
    if (!db) return [];

    try {
        const snapshot = await db
            .collection(`partners/${partnerId}/vaultFiles`)
            .where('state', '==', 'ACTIVE')
            .get();

        return snapshot.docs.map(doc => doc.id);
    } catch (error) {
        console.error('Failed to get active file IDs:', error);
        return [];
    }
}