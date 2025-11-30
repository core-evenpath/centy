'use server';

import { GoogleGenAI } from '@google/genai';
import type { VaultFileTags, TagExtractionResult } from '@/lib/types-vault';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const TAG_EXTRACTION_PROMPT = `You are an expert document analyzer. Analyze the provided document content and extract structured metadata tags.

DOCUMENT CONTENT:
{CONTENT}

DOCUMENT NAME: {FILENAME}
DOCUMENT TYPE: {MIMETYPE}

Extract the following information and return ONLY a valid JSON object (no markdown, no code blocks):

{
  "primaryCategory": "The main category (e.g., 'Financial Report', 'Legal Document', 'Technical Documentation', 'Marketing Material', 'Research Paper', 'Meeting Notes', 'Policy Document', 'Training Material', 'Product Specification', 'Customer Communication')",
  "topics": ["Array of 3-8 main topics discussed in the document"],
  "entities": ["Array of named entities: company names, person names, product names, locations, organizations mentioned"],
  "keywords": ["Array of 10-20 search-optimized keywords that someone might use to find this document"],
  "documentType": "Specific document type (e.g., 'PDF Report', 'Spreadsheet', 'Presentation', 'Memo', 'Contract', 'Invoice', 'Whitepaper')",
  "sentiment": "Overall sentiment: 'positive', 'neutral', or 'negative'",
  "language": "Primary language of the document (e.g., 'English', 'Spanish')",
  "dateReferences": ["Any specific dates or time periods mentioned (e.g., 'Q3 2024', 'January 2025', 'FY2024')"],
  "confidence": 0.85
}

Guidelines:
- Be specific and accurate with categories and topics
- Keywords should be diverse and cover different aspects of the document
- Include acronyms and their full forms as separate keywords
- Extract ALL named entities mentioned
- Confidence should reflect how well you understood the document (0.0-1.0)
- If document is too short or unclear, lower the confidence score

Return ONLY the JSON object, nothing else.`;

export async function extractDocumentTags(
    content: string,
    fileName: string,
    mimeType: string,
    maxContentLength: number = 50000
): Promise<TagExtractionResult> {
    const startTime = Date.now();

    try {
        if (!content || content.trim().length < 50) {
            return {
                success: false,
                message: 'Document content too short for meaningful tag extraction',
            };
        }

        const truncatedContent = content.length > maxContentLength
            ? content.substring(0, maxContentLength) + '\n\n[Content truncated...]'
            : content;

        const prompt = TAG_EXTRACTION_PROMPT
            .replace('{CONTENT}', truncatedContent)
            .replace('{FILENAME}', fileName)
            .replace('{MIMETYPE}', mimeType);

        console.log('🏷️ Starting tag extraction for:', fileName);
        console.log('📊 Content length:', content.length, 'chars');

        const response = await genAI.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                temperature: 0.3,
                maxOutputTokens: 2048,
            }
        });

        const responseText = response.text?.trim() || '';

        let jsonText = responseText;
        const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            jsonText = jsonMatch[1];
        } else {
            const firstBrace = responseText.indexOf('{');
            const lastBrace = responseText.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                jsonText = responseText.substring(firstBrace, lastBrace + 1);
            }
        }

        const parsed = JSON.parse(jsonText);

        const tags: VaultFileTags = {
            primaryCategory: parsed.primaryCategory || 'Uncategorized',
            topics: Array.isArray(parsed.topics) ? parsed.topics.slice(0, 10) : [],
            entities: Array.isArray(parsed.entities) ? parsed.entities.slice(0, 20) : [],
            keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 25) : [],
            documentType: parsed.documentType || mimeType,
            sentiment: ['positive', 'neutral', 'negative'].includes(parsed.sentiment)
                ? parsed.sentiment
                : 'neutral',
            language: parsed.language || 'English',
            dateReferences: Array.isArray(parsed.dateReferences) ? parsed.dateReferences : [],
            confidence: typeof parsed.confidence === 'number'
                ? Math.min(1, Math.max(0, parsed.confidence))
                : 0.7,
            extractedAt: new Date().toISOString(),
            version: 1,
        };

        const processingTimeMs = Date.now() - startTime;
        console.log('✅ Tags extracted successfully in', processingTimeMs, 'ms');
        console.log('📋 Primary category:', tags.primaryCategory);
        console.log('📋 Topics:', tags.topics.length);
        console.log('📋 Keywords:', tags.keywords.length);

        return {
            success: true,
            message: 'Tags extracted successfully',
            tags,
            processingTimeMs,
        };

    } catch (error: any) {
        console.error('❌ Tag extraction failed:', error.message);
        return {
            success: false,
            message: `Tag extraction failed: ${error.message}`,
            processingTimeMs: Date.now() - startTime,
        };
    }
}

export async function generateQueryTags(query: string): Promise<string[]> {
    try {
        const response = await genAI.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `Extract 3-5 key search terms from this query. Return ONLY a JSON array of strings, nothing else.

Query: "${query}"

Example output: ["financial report", "Q3 2024", "revenue"]`,
            config: {
                temperature: 0.2,
                maxOutputTokens: 256,
            }
        });

        const text = response.text?.trim() || '[]';
        let jsonText = text;

        const match = text.match(/\[[\s\S]*\]/);
        if (match) {
            jsonText = match[0];
        }

        const parsed = JSON.parse(jsonText);
        return Array.isArray(parsed) ? parsed.filter(t => typeof t === 'string').slice(0, 5) : [];
    } catch (error) {
        console.warn('Failed to generate query tags:', error);
        return [];
    }
}

export async function findRelevantFilesByTags(
    partnerId: string,
    queryTags: string[],
    allFiles: Array<{ id: string; tags?: VaultFileTags }>
): Promise<string[]> {
    if (!queryTags.length || !allFiles.length) {
        return allFiles.map(f => f.id);
    }

    const queryTagsLower = queryTags.map(t => t.toLowerCase());

    const scored = allFiles.map(file => {
        if (!file.tags) {
            return { id: file.id, score: 0.5 };
        }

        let score = 0;
        const allFileTags = [
            file.tags.primaryCategory,
            ...file.tags.topics,
            ...file.tags.keywords,
            ...file.tags.entities,
        ].map(t => t.toLowerCase());

        for (const queryTag of queryTagsLower) {
            for (const fileTag of allFileTags) {
                if (fileTag.includes(queryTag) || queryTag.includes(fileTag)) {
                    score += 1;
                }
            }
        }

        return { id: file.id, score };
    });

    scored.sort((a, b) => b.score - a.score);

    const relevant = scored.filter(s => s.score > 0).map(s => s.id);

    if (relevant.length === 0) {
        return allFiles.map(f => f.id);
    }

    return relevant;
}