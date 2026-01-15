/**
 * Prompt Registry
 * 
 * Central registry of all AI prompts used across the application.
 * This allows viewing and managing prompts from the admin panel.
 */

export interface PromptDefinition {
    id: string;
    name: string;
    description: string;
    category: 'business-research' | 'rag' | 'chat' | 'workflow' | 'other';
    template: string;
    variables?: string[];
    sourceFile: string;
    lastUpdated: string;
}

/**
 * RAG System Instruction - Used for document-based Q&A
 */
export const RAG_SYSTEM_PROMPT: PromptDefinition = {
    id: 'rag-system',
    name: 'RAG System Instruction',
    description: 'System instruction for document-based Q&A using Gemini File Search. Ensures AI only uses uploaded documents.',
    category: 'rag',
    sourceFile: 'lib/rag-query-engine.ts',
    lastUpdated: '2026-01-15',
    variables: [],
    template: `You are an intelligent assistant that answers questions based ONLY on the documents provided in the knowledge base.

CRITICAL RULES:
1. ONLY use information from the retrieved documents to answer questions
2. If the documents contain relevant information, provide a clear, comprehensive answer
3. If the documents do NOT contain relevant information, clearly state: "I couldn't find information about that in the uploaded documents."
4. Always cite your sources by mentioning which document the information came from
5. Be specific and quote relevant passages when appropriate
6. Do NOT make up information or use external knowledge
7. If information is partial or incomplete, acknowledge that
8. Structure your response clearly with key points

When citing sources, use this format: "According to [Document Name]..." or "In [Document Name], it states..."`
};

/**
 * Auto-Fill Business Research Prompt Template
 */
export const AUTOFILL_RESEARCH_PROMPT: PromptDefinition = {
    id: 'autofill-research',
    name: 'Auto-Fill Business Research',
    description: 'Comprehensive prompt for researching businesses from Google and web. Includes country-specific customization for platforms, payments, and registrations.',
    category: 'business-research',
    sourceFile: 'lib/autofill-prompt-builder.ts',
    lastUpdated: '2026-01-15',
    variables: [
        'businessName',
        'address',
        'website',
        'industryHint',
        'countryCode',
        'googleRating',
        'googleReviewCount',
        'editorialSummary'
    ],
    template: `Search the web thoroughly and research "{businessName}" located at "{address}"{website ? \` with website {website}\` : ''}.

I need COMPREHENSIVE business information for auto-filling a business profile. This data will be used to train an AI agent to handle customer queries.

## BUSINESS CONTEXT
- **Country:** {countryName} ({countryCode}) {countryFlag}
- **Currency:** {currencyCode} ({currencySymbol})
- **Search Language:** {languages}
- **Search Suffix:** Add "{searchSuffix}" to searches for better local results

## SEARCH PRIORITY ({countryName}-specific platforms)
[Dynamic list of country-specific platforms with data types]

## COUNTRY-SPECIFIC REQUIREMENTS

### Currency & Pricing
- All prices in **{currencyCode}** ({currencySymbol})
- Format: {currencyFormat}

### Phone Number Format
- Include country code: {phoneCode}
- Example: {phoneCode} XXX-XXX-XXXX

### Popular Payment Methods
[Dynamic list from country config]

### Business Registrations to Find
[Dynamic list of country-specific registrations]

### Industry Certifications
[Dynamic list of industry-specific certifications]

## MANDATORY SEARCH TASKS

1. **FIND OFFICIAL SOCIAL MEDIA** - Search: "{businessName} instagram", "{businessName} facebook", "{businessName} linkedin"
2. **FIND REVIEWS** - Search on country-specific platforms
3. **FIND CONTACT INFO** - Phone, email, website
4. **FIND OPERATING HOURS** - From Google Maps or website
5. **FIND PRODUCTS/SERVICES** - Menu, catalog, service list

## OUTPUT FORMAT
Return valid JSON with:
- identity (businessName, industry, phone, website, email, address, description)
- photos (array of image URLs)
- reviews (array with text, rating, author, date, platform)
- onlinePresence (social media profiles)
- personality (uniqueSellingPoints, tagline)
- customerProfile (targetAudience)
- knowledge (productsOrServices, faqs)
- inventory (industry-specific items)
- fromTheWeb (websiteContent, otherFindings)`
};

/**
 * Chat System Prompt - For general conversation
 */
export const CHAT_SYSTEM_PROMPT: PromptDefinition = {
    id: 'chat-general',
    name: 'General Chat System',
    description: 'Default system instruction for general AI chat interactions. Supports custom instructions and context injection.',
    category: 'chat',
    sourceFile: 'lib/gemini-service.ts',
    lastUpdated: '2026-01-15',
    variables: ['customSystemInstruction', 'ragContext'],
    template: `You are a helpful AI assistant. Answer questions clearly and concisely.

{customSystemInstruction ? 'CUSTOM INSTRUCTIONS:\\n{customSystemInstruction}\\n\\n' : ''}

{ragContext ? 'CONTEXT FROM DOCUMENTS:\\n{ragContext}\\n\\nUse the above context to inform your response when relevant.' : ''}

Guidelines:
- Be helpful, harmless, and honest
- If you don't know something, say so
- Provide structured responses when appropriate
- Cite sources when using document context`
};

/**
 * Workflow Suggestion Prompt
 */
export const WORKFLOW_SUGGESTION_PROMPT: PromptDefinition = {
    id: 'workflow-suggest',
    name: 'Workflow Step Suggestion',
    description: 'Generates workflow steps from natural language descriptions using AI. Used in the workflow builder.',
    category: 'workflow',
    sourceFile: 'ai/flows/suggest-workflow-steps.ts',
    lastUpdated: '2026-01-15',
    variables: ['description', 'existingSteps'],
    template: `You are an AI assistant that helps create workflow automation steps.

Given the user's description, generate a structured workflow with:
- Clear step names
- Appropriate step types (trigger, action, condition, delay)
- Configuration parameters for each step
- Logical connections between steps

Description: {description}

{existingSteps ? 'Existing steps to build upon:\\n{existingSteps}' : ''}

Return a JSON array of workflow steps following the WorkflowStep schema.`
};

/**
 * All registered prompts
 */
export const PROMPT_REGISTRY: PromptDefinition[] = [
    RAG_SYSTEM_PROMPT,
    AUTOFILL_RESEARCH_PROMPT,
    CHAT_SYSTEM_PROMPT,
    WORKFLOW_SUGGESTION_PROMPT,
];

/**
 * Get prompt by ID
 */
export function getPromptById(id: string): PromptDefinition | undefined {
    return PROMPT_REGISTRY.find(p => p.id === id);
}

/**
 * Get prompts by category
 */
export function getPromptsByCategory(category: PromptDefinition['category']): PromptDefinition[] {
    return PROMPT_REGISTRY.filter(p => p.category === category);
}

/**
 * Get all prompt categories with counts
 */
export function getPromptCategories(): { category: string; count: number; label: string }[] {
    const categoryLabels: Record<string, string> = {
        'business-research': 'Business Research',
        'rag': 'Document Q&A (RAG)',
        'chat': 'Chat & Conversation',
        'workflow': 'Workflow Automation',
        'other': 'Other',
    };

    const categoryCounts = PROMPT_REGISTRY.reduce((acc, p) => {
        acc[p.category] = (acc[p.category] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryCounts).map(([category, count]) => ({
        category,
        count,
        label: categoryLabels[category] || category,
    }));
}
