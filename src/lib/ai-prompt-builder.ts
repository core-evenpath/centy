import { AIContext } from './ai-context-builder';

export function buildSystemPrompt(context: AIContext): string {
    let prompt = `You are a helpful assistant for ${context.businessProfile.name}.`;

    // Business info section
    prompt += `\n\n## BUSINESS INFORMATION\n`;
    if (context.businessProfile.industry) {
        prompt += `- Industry: ${context.businessProfile.industry}`;
        if (context.businessProfile.subcategory) {
            prompt += ` > ${context.businessProfile.subcategory}`;
        }
        prompt += '\n';
    }
    if (context.businessProfile.hours) {
        prompt += `- Business Hours: ${context.businessProfile.hours}\n`;
    }
    if (context.businessProfile.phone) {
        prompt += `- Phone: ${context.businessProfile.phone}\n`;
    }
    if (context.businessProfile.email) {
        prompt += `- Email: ${context.businessProfile.email}\n`;
    }
    if (context.businessProfile.website) {
        prompt += `- Website: ${context.businessProfile.website}\n`;
    }
    if (context.businessProfile.address) {
        prompt += `- Address: ${context.businessProfile.address}\n`;
    }
    if (context.businessProfile.description) {
        prompt += `- About: ${context.businessProfile.description}\n`;
    }

    // Module items section (CRITICAL - always include)
    if (context.moduleItems.length > 0) {
        prompt += `\n## PRODUCTS & SERVICES\n`;

        // Group by source module
        const byModule: Record<string, typeof context.moduleItems> = {};
        for (const item of context.moduleItems) {
            if (!byModule[item.sourceModule]) {
                byModule[item.sourceModule] = [];
            }
            byModule[item.sourceModule].push(item);
        }

        for (const [module, items] of Object.entries(byModule)) {
            const moduleName = module.replace(/-/g, ' ').replace(/_/g, ' ')
                .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            prompt += `\n### ${moduleName}\n`;
            for (const item of items) {
                prompt += `- **${item.name}**`;
                if (item.price) {
                    const symbol = item.currency === 'INR' ? '₹' : item.currency === 'USD' ? '$' : item.currency || '';
                    prompt += ` - ${symbol}${item.price}`;
                    if (item.priceUnit) {
                        prompt += ` ${item.priceUnit}`;
                    }
                }
                if (item.description) {
                    prompt += `\n  ${item.description}`;
                }
                // Include detailed metadata from Core Hub (inventory fields, specs, etc.)
                if (item.metadata && Object.keys(item.metadata).length > 0) {
                    for (const [key, value] of Object.entries(item.metadata)) {
                        if (value === null || value === undefined || value === '') continue;
                        const displayKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
                        const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
                        if (displayValue.length > 0 && displayValue.length <= 500) {
                            prompt += `\n  ${displayKey}: ${displayValue}`;
                        }
                    }
                }
                prompt += '\n';
            }
        }
    }

    // Industry skills section
    if (context.industrySkills) {
        prompt += `\n## RESPONSE GUIDELINES\n${context.industrySkills}\n`;
    }

    // RAG documents section
    if (context.ragResults.length > 0) {
        prompt += `\n## RELEVANT DOCUMENTS\n`;
        for (const doc of context.ragResults) {
            prompt += `\n### From: ${doc.source}\n${doc.content}\n`;
        }
    }

    // Customer context section
    if (context.customerProfile) {
        prompt += `\n## CUSTOMER CONTEXT\n`;
        if (context.customerProfile.name) {
            prompt += `- Name: ${context.customerProfile.name}\n`;
        }
        if (context.customerProfile.tags?.length) {
            prompt += `- Tags: ${context.customerProfile.tags.join(', ')}\n`;
        }
        if (context.customerProfile.notes) {
            prompt += `- Notes: ${context.customerProfile.notes}\n`;
        }
        if (context.customerProfile.previousInteractions) {
            prompt += `- Previous conversations: ${context.customerProfile.previousInteractions}\n`;
        }
    }

    return prompt;
}

export function buildUserPrompt(
    customerMessage: string,
    conversationHistory: AIContext['conversationHistory']
): string {
    let prompt = '';

    if (conversationHistory.length > 0) {
        prompt += `## CONVERSATION HISTORY\n`;
        for (const msg of conversationHistory) {
            const role = msg.role === 'customer' ? 'Customer' : 'You';
            prompt += `${role}: ${msg.content}\n`;
        }
        prompt += '\n';
    }

    prompt += `## CURRENT MESSAGE\nCustomer: "${customerMessage}"\n\n`;
    prompt += `Generate a helpful, professional reply (2-3 sentences). Be specific and use information from the business profile, products/services, and documents when relevant.`;

    return prompt;
}
