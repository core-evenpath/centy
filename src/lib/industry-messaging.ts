/**
 * Industry-Aware Messaging
 *
 * Provides industry-specific greetings, suggestions, and AI response context
 * so that broadcast messaging adapts to each partner's industry automatically.
 */

/**
 * Get the greeting shown when a SystemTemplate is loaded in the studio.
 * Adapts language to the partner's industry.
 */
export function getIndustryGreeting(
    industry: string,
    templateName: string,
    variableCount: number
): string {
    const varNote = variableCount > 0
        ? `\n\nThis template has ${variableCount} personalization field${variableCount > 1 ? 's' : ''} that will be filled with each recipient's details.`
        : '';

    const greetings: Record<string, string> = {
        'real-estate': `Loaded template: *${templateName}*${varNote}\n\nFeel free to customize the message or proceed to select recipients!`,
        'food-beverage': `Loaded template: *${templateName}*${varNote}\n\nCustomize the message or select recipients to continue!`,
        'beauty-wellness': `Loaded template: *${templateName}*${varNote}\n\nReady to customize or send!`,
        'financial-services': `Loaded template: *${templateName}*${varNote}\n\nAdjust the details or proceed to select recipients!`,
        'default': `Loaded template: *${templateName}*${varNote}\n\nYou can customize the message or proceed!`,
    };

    return greetings[industry] || greetings['default'];
}

/**
 * Get the default AI greeting when starting the studio without a template.
 * Adapts to the partner's industry so no hardcoded real-estate language appears.
 */
export function getDefaultGreeting(industry: string, userName?: string): string {
    const name = userName?.split(' ')[0] || 'there';

    const greetings: Record<string, string> = {
        'real-estate': `Hi ${name}! I'm your AI broadcast assistant.\n\nWhat would you like to send? New listing alert, open house invite, or market update?`,
        'food-beverage': `Hi ${name}! Ready to create a campaign!\n\nDaily special, event announcement, or menu update?`,
        'beauty-wellness': `Hi ${name}! Let's create a campaign!\n\nService promotion, appointment reminder, or special offer?`,
        'financial-services': `Hi ${name}! Let's craft your broadcast.\n\nMarket insight, portfolio update, or investment opportunity?`,
        'default': `Hi ${name}! I'm your AI broadcast assistant.\n\nWhat would you like to send to your contacts today?`,
    };

    return greetings[industry] || greetings['default'];
}

/**
 * Get industry-specific quick-action suggestions for the studio.
 */
export function getIndustrySuggestions(industry: string): string[] {
    const suggestions: Record<string, string[]> = {
        'real-estate': ['New listing alert', 'Open house invite', 'Market update'],
        'food-beverage': ['Daily special', 'Event announcement', 'Menu update'],
        'beauty-wellness': ['Service promotion', 'Appointment reminder', 'Special offer'],
        'financial-services': ['Market insight', 'Portfolio update', 'New opportunity'],
        'default': ['Announcement', 'Promotion', 'Update'],
    };

    return suggestions[industry] || suggestions['default'];
}

/**
 * Get industry-aware AI response triggers.
 * Returns a set of response objects that adapt to the partner's industry,
 * replacing all hardcoded real-estate terminology.
 */
export function getIndustryAiResponses(industry: string) {
    // Industry-specific terminology
    const terms = getIndustryTerms(industry);

    return [
        {
            trigger: ['listing', 'property', 'announce', 'home', 'house', 'menu', 'service', 'product', 'item', 'new'],
            response: `${terms.emoji} *New ${terms.itemTitle} Alert*\n\nHi {{name}},\n\nI'm excited to share a new ${terms.itemNoun} that fits your criteria:\n\n${terms.detailLine}\n\n${terms.featureLine}\n\nReply to learn more.\n\n— {{company}}`,
            suggestions: ['Make it shorter', 'Add urgency', 'Perfect! →'],
        },
        {
            trigger: ['shorter', 'concise', 'brief'],
            response: `${terms.emoji} *New ${terms.itemTitle}*\n\nHi {{name}}!\n\n${terms.shortDetail}\n\nReply for details!\n\n— {{company}}`,
            suggestions: ['Add urgency', 'Perfect! →'],
        },
        {
            trigger: ['sale', 'promo', 'offer', 'discount'],
            response: `🎉 *Special Offer Just for You*\n\nHi {{name}},\n\nWe have a special promotion available for a limited time.\n\nGet exclusive benefits when you ${terms.cta} this week.\n\nReply 'YES' to hear more!`,
            suggestions: ['Make it urgent', 'Perfect! →'],
        },
        {
            trigger: ['urgency', 'urgent', 'fast', 'now'],
            response: `🔥 *Last Chance!*\n\nHi {{name}},\n\nDon't miss out! Our special offer ends soon.\n\n⚡ *Only a few spots left!*\n\nReply NOW to secure yours.`,
            suggestions: ['Perfect! →'],
        },
        {
            trigger: ['update', 'news', 'info'],
            response: `📰 *Latest Update*\n\nHi {{name}},\n\nHere is the latest news from {{company}}:\n\n• ${terms.updateBullet1}\n• ${terms.updateBullet2}\n\nStay tuned for more updates!`,
            suggestions: ['Perfect! →'],
        },
        {
            trigger: ['hi', 'hello', 'start', 'help'],
            response: `Hi there! I can help you draft a broadcast message.\n\nTry saying:\n• '${terms.suggestion1}'\n• 'Special sale'\n• 'Weekly update'`,
            suggestions: [terms.suggestion1, 'Sale', 'Update'],
        },
        {
            trigger: ['perfect', 'good', 'continue', 'done', 'next', 'ready', '→'],
            response: null as string | null,
            action: 'next' as const,
        },
    ];
}

interface IndustryTerms {
    emoji: string;
    itemTitle: string;
    itemNoun: string;
    detailLine: string;
    featureLine: string;
    shortDetail: string;
    cta: string;
    updateBullet1: string;
    updateBullet2: string;
    suggestion1: string;
}

function getIndustryTerms(industry: string): IndustryTerms {
    const terms: Record<string, IndustryTerms> = {
        'real-estate': {
            emoji: '🏡',
            itemTitle: 'Property Listing',
            itemNoun: 'property',
            detailLine: '📍 *Great location & features*\n💰 Competitive pricing',
            featureLine: '✨ Features:\n• Spacious layout\n• Great location\n• Newly renovated',
            shortDetail: 'Great location & layout! Viewings available this weekend.',
            cta: 'book a viewing',
            updateBullet1: 'Market is moving fast',
            updateBullet2: 'New listings available',
            suggestion1: 'New listing',
        },
        'food-beverage': {
            emoji: '🍽️',
            itemTitle: 'Menu Special',
            itemNoun: 'dish',
            detailLine: '🍴 *Fresh & delicious*\n💰 Great value',
            featureLine: '✨ Highlights:\n• Fresh ingredients\n• Chef\'s special\n• Limited availability',
            shortDetail: 'Chef\'s special is here! Available this week only.',
            cta: 'book a table',
            updateBullet1: 'New menu items just added',
            updateBullet2: 'Weekend specials available',
            suggestion1: 'Daily special',
        },
        'beauty-wellness': {
            emoji: '💆',
            itemTitle: 'Service Package',
            itemNoun: 'service',
            detailLine: '💅 *Premium service package*\n💰 Special rate',
            featureLine: '✨ Includes:\n• Expert styling\n• Premium products\n• Relaxing experience',
            shortDetail: 'New service package available! Book this week for a special rate.',
            cta: 'book an appointment',
            updateBullet1: 'New services just launched',
            updateBullet2: 'Special packages available',
            suggestion1: 'Service promotion',
        },
        'financial-services': {
            emoji: '📊',
            itemTitle: 'Investment Opportunity',
            itemNoun: 'opportunity',
            detailLine: '📈 *Strong performance outlook*\n💰 Competitive returns',
            featureLine: '✨ Highlights:\n• Diversified portfolio\n• Expert management\n• Strong track record',
            shortDetail: 'New opportunity with strong returns. Get in touch for details.',
            cta: 'schedule a consultation',
            updateBullet1: 'Markets showing strong signals',
            updateBullet2: 'New opportunities available',
            suggestion1: 'Market insight',
        },
        'default': {
            emoji: '📢',
            itemTitle: 'Offering',
            itemNoun: 'offering',
            detailLine: '📌 *Exciting details inside*\n💰 Great value',
            featureLine: '✨ Highlights:\n• Quality service\n• Great value\n• Limited time',
            shortDetail: 'Something new and exciting! Reply to learn more.',
            cta: 'get in touch',
            updateBullet1: 'Exciting developments ahead',
            updateBullet2: 'New options available',
            suggestion1: 'Announcement',
        },
    };

    return terms[industry] || terms['default'];
}
