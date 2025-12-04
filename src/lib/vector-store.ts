import { DocumentMetadata } from './partnerhub-types';

export interface VectorSearchResult {
    docId: string;
    score: number;
    text: string;
    name: string;
}

// Naive Cosine Similarity for Client-Side Demo
const cosineSimilarity = (vecA: number[], vecB: number[]) => {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

    if (magnitudeA === 0 || magnitudeB === 0) return 0;

    return dotProduct / (magnitudeA * magnitudeB);
};

interface SearchOptions {
    filter?: (doc: DocumentMetadata) => boolean;
}

export const searchDocuments = (
    queryEmbedding: number[],
    documents: DocumentMetadata[],
    topK: number = 3,
    options?: SearchOptions
): VectorSearchResult[] => {
    // 1. Filter active documents
    const activeDocs = documents.filter(d => {
        const isActive = d.status === 'ACTIVE' && d.embedding && d.extractedText;
        if (!isActive) return false;

        if (options?.filter) {
            return options.filter(d);
        }

        return true;
    });

    // 2. Calculate Scores
    const scoredDocs = activeDocs.map(doc => ({
        docId: doc.id,
        name: doc.name,
        text: doc.extractedText!,
        score: cosineSimilarity(queryEmbedding, doc.embedding!)
    }));

    // 3. Sort by score descending
    scoredDocs.sort((a, b) => b.score - a.score);

    return scoredDocs.slice(0, topK);
};
