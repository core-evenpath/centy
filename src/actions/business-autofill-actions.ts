'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/lib/firebase-admin';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface ResearchDataItem {
    id: string;
    category: string;
    label: string;
    value: string | string[] | Record<string, any>;
    fieldPath?: string; // Maps to BusinessPersona field path
    isNegative?: boolean; // Negative feedback/reviews
    confidence?: number; // 0-1 confidence score
    source?: string; // Where the data came from
}

export interface BusinessResearchResult {
    businessName: string;
    summary?: string;
    rating?: number;
    reviewCount?: number;
    items: ResearchDataItem[];
}

interface SearchResult {
    success: boolean;
    data?: BusinessResearchResult;
    message?: string;
}

export interface AddressSuggestion {
    id: string;
    mainText: string;
    secondaryText?: string;
    displayName: string;
    type?: string;
    placeId?: string;
}

interface SuggestionsResult {
    success: boolean;
    suggestions?: AddressSuggestion[];
    message?: string;
}

/**
 * Gets address/business suggestions based on user input query.
 * Uses AI to generate realistic suggestions for businesses and places.
 */
export async function getAddressSuggestionsAction(
    query: string
): Promise<SuggestionsResult> {
    try {
        if (!query || query.length < 2) {
            return { success: true, suggestions: [] };
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const suggestionsPrompt = `You are a business/place search autocomplete assistant. Generate 5-8 realistic business or place suggestions based on this search query.

Search Query: "${query}"

Return a JSON array of suggestions. Each suggestion should include:
- id: unique identifier
- mainText: The primary name of the business/place
- secondaryText: Address or location details
- displayName: Full display name (mainText + location context)
- type: Category like "Restaurant", "Retail Store", "Cafe", "Salon", "Clinic", "Hotel", etc.

Consider that the user might be searching for:
1. A specific business name
2. A type of business + location (e.g., "coffee shop in Mumbai")
3. A neighborhood or area + business type
4. Just a business type (suggest popular/common ones)

Make the suggestions diverse and realistic. Include:
- Different business types if the query is generic
- Specific locations if the query mentions an area
- Well-known chains and local businesses mix

Return ONLY a valid JSON array, no markdown:
[
  {
    "id": "1",
    "mainText": "Starbucks",
    "secondaryText": "Koramangala, Bangalore",
    "displayName": "Starbucks, Koramangala, Bangalore",
    "type": "Cafe"
  }
]`;

        const result = await model.generateContent(suggestionsPrompt);
        const response = result.response.text();

        // Parse the JSON response
        let suggestions: AddressSuggestion[];
        try {
            const cleanedResponse = response
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();

            suggestions = JSON.parse(cleanedResponse);
        } catch (parseError) {
            console.error('Failed to parse suggestions:', parseError);
            return { success: true, suggestions: [] };
        }

        // Validate array
        if (!Array.isArray(suggestions)) {
            return { success: true, suggestions: [] };
        }

        // Ensure proper structure
        suggestions = suggestions.map((s, i) => ({
            id: s.id || `suggestion-${i}`,
            mainText: s.mainText || query,
            secondaryText: s.secondaryText || '',
            displayName: s.displayName || s.mainText || query,
            type: s.type || 'Business',
        }));

        return {
            success: true,
            suggestions: suggestions.slice(0, 8), // Max 8 suggestions
        };

    } catch (error: any) {
        console.error('Suggestions error:', error);
        return {
            success: true,
            suggestions: [], // Return empty on error, don't fail
        };
    }
}

/**
 * Searches for business information and uses AI to research and extract
 * comprehensive data for the business profile knowledge base.
 */
export async function searchBusinessAndResearchAction(
    partnerId: string,
    searchQuery: string
): Promise<SearchResult> {
    try {
        if (!searchQuery.trim()) {
            return { success: false, message: 'Please enter a search query' };
        }

        // Use AI to research and generate comprehensive business data
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const researchPrompt = `You are a business research assistant. Your task is to research and generate comprehensive, realistic business information based on the search query.

Search Query: "${searchQuery}"

Research this business and extract ALL available information that would be useful for creating a comprehensive business profile knowledge base. Include:

1. **Business Identity**
   - Official business name
   - Business type/category
   - Description/About
   - Tagline
   - Year founded
   - Team size estimate

2. **Contact Information**
   - Phone number
   - Email (if available or can infer format)
   - Website URL
   - Physical address
   - City, State, Country
   - Landmarks nearby

3. **Operating Hours**
   - Weekly schedule
   - Special hours (holidays, etc.)
   - 24/7 status

4. **Services & Products**
   - List of main services/products offered
   - Pricing information (ranges)
   - Popular/featured items
   - Categories

5. **Reviews & Reputation**
   - Overall rating
   - Total review count
   - POSITIVE highlights from reviews (what customers love)
   - NEGATIVE feedback from reviews (complaints, issues) - MARK THESE AS NEGATIVE

6. **Credentials & Trust**
   - Certifications
   - Awards
   - Years of experience
   - Licenses

7. **Common FAQs**
   - Questions customers typically ask
   - With suggested answers

8. **Social Media**
   - Instagram
   - Facebook
   - Twitter/X
   - LinkedIn
   - YouTube

9. **Payment Methods**
   - Accepted payment types

10. **Unique Selling Points**
    - What makes this business special

Return your response as a valid JSON object with this structure:
{
  "businessName": "Exact business name",
  "summary": "Brief 1-2 sentence summary of the business",
  "rating": 4.5,
  "reviewCount": 150,
  "items": [
    {
      "id": "unique-id",
      "category": "identity|contact|hours|services|pricing|reviews_positive|reviews_negative|faqs|credentials|social",
      "label": "Human readable label",
      "value": "The actual value or data",
      "fieldPath": "identity.name",
      "isNegative": false,
      "confidence": 0.9,
      "source": "web research"
    }
  ]
}

IMPORTANT RULES:
1. For negative reviews/feedback, set "isNegative": true and "category": "reviews_negative"
2. Include at least 3-5 negative feedback items if any exist (common complaints, issues mentioned in reviews)
3. Provide realistic, detailed data - not generic placeholders
4. Use proper field paths that map to a business profile schema
5. Be comprehensive - extract as much useful data as possible
6. Include confidence scores (0.9+ for verified data, 0.7-0.9 for inferred data)
7. Generate realistic FAQs with actual answers
8. If you cannot find real data, generate realistic plausible data based on the business type

Field path mappings:
- identity.name, identity.phone, identity.email, identity.website
- identity.address.street, identity.address.city, identity.address.state, identity.address.country
- identity.operatingHours.schedule
- personality.description, personality.tagline, personality.uniqueSellingPoints
- knowledge.productsOrServices, knowledge.pricingHighlights, knowledge.acceptedPayments
- knowledge.faqs (array of {question, answer})
- knowledge.policies.returnPolicy, knowledge.policies.cancellationPolicy
- identity.socialMedia.instagram, identity.socialMedia.facebook, etc.

Return ONLY the JSON object, no markdown formatting or explanation.`;

        const result = await model.generateContent(researchPrompt);
        const response = result.response.text();

        // Parse the JSON response
        let parsedData: BusinessResearchResult;
        try {
            // Clean up the response - remove any markdown code blocks
            const cleanedResponse = response
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();

            parsedData = JSON.parse(cleanedResponse);
        } catch (parseError) {
            console.error('Failed to parse AI response:', parseError);
            console.log('Raw response:', response);
            return { success: false, message: 'Failed to process research results. Please try again.' };
        }

        // Validate and ensure proper structure
        if (!parsedData.businessName || !parsedData.items || !Array.isArray(parsedData.items)) {
            return { success: false, message: 'Invalid research results. Please try a different search.' };
        }

        // Ensure all items have unique IDs
        parsedData.items = parsedData.items.map((item, index) => ({
            ...item,
            id: item.id || `item-${index}-${Date.now()}`,
            isNegative: item.isNegative || item.category === 'reviews_negative',
            confidence: item.confidence || 0.8,
            source: item.source || 'AI Research',
        }));

        // Sort items: non-negative first, then negative
        parsedData.items.sort((a, b) => {
            if (a.isNegative && !b.isNegative) return 1;
            if (!a.isNegative && b.isNegative) return -1;
            return 0;
        });

        // Log the search for analytics (optional)
        try {
            await db.collection('partners').doc(partnerId).collection('autofillSearches').add({
                query: searchQuery,
                businessName: parsedData.businessName,
                itemCount: parsedData.items.length,
                timestamp: new Date(),
            });
        } catch (logError) {
            // Non-critical, continue
            console.warn('Failed to log search:', logError);
        }

        return {
            success: true,
            data: parsedData,
        };

    } catch (error: any) {
        console.error('Business search error:', error);
        return {
            success: false,
            message: error.message || 'An error occurred during research. Please try again.',
        };
    }
}

/**
 * Applies selected auto-fill data to the business persona
 */
export async function applyAutoFillDataAction(
    partnerId: string,
    selectedItems: ResearchDataItem[]
): Promise<{ success: boolean; message?: string }> {
    try {
        if (!selectedItems.length) {
            return { success: false, message: 'No items selected' };
        }

        // Build the update object from selected items
        const updateData: Record<string, any> = {};

        selectedItems.forEach(item => {
            if (item.fieldPath) {
                const keys = item.fieldPath.split('.');
                let current = updateData;

                for (let i = 0; i < keys.length - 1; i++) {
                    if (!current[keys[i]]) {
                        current[keys[i]] = {};
                    }
                    current = current[keys[i]];
                }

                current[keys[keys.length - 1]] = item.value;
            }
        });

        // Save to Firestore
        const partnerRef = db.collection('partners').doc(partnerId);
        const partnerDoc = await partnerRef.get();

        if (!partnerDoc.exists) {
            return { success: false, message: 'Partner not found' };
        }

        const existingPersona = partnerDoc.data()?.businessPersona || {};

        // Deep merge the update data with existing persona
        const mergedPersona = deepMerge(existingPersona, updateData);

        await partnerRef.update({
            'businessPersona': mergedPersona,
            'businessPersona.updatedAt': new Date(),
        });

        // Log the auto-fill application
        await partnerRef.collection('autofillApplications').add({
            itemCount: selectedItems.length,
            categories: [...new Set(selectedItems.map(i => i.category))],
            timestamp: new Date(),
        });

        return { success: true };

    } catch (error: any) {
        console.error('Apply auto-fill error:', error);
        return {
            success: false,
            message: error.message || 'Failed to apply auto-fill data',
        };
    }
}

/**
 * Deep merge utility for nested objects
 */
function deepMerge(target: any, source: any): any {
    const output = { ...target };

    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            if (isObject(source[key]) && isObject(target[key])) {
                output[key] = deepMerge(target[key], source[key]);
            } else if (Array.isArray(source[key]) && Array.isArray(target[key])) {
                // For arrays, merge by adding new items
                output[key] = [...target[key], ...source[key].filter(
                    (item: any) => !target[key].some((existing: any) =>
                        JSON.stringify(existing) === JSON.stringify(item)
                    )
                )];
            } else {
                output[key] = source[key];
            }
        }
    }

    return output;
}

function isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
}
