export interface IndustrySkill {
    id: string;
    name: string;
    triggers?: string[]; // Keywords that activate this skill
    instructions: string;
}

export const DEFAULT_SKILLS: Record<string, IndustrySkill[]> = {
    'study-abroad': [
        {
            id: 'visa-inquiry',
            name: 'Visa & Documentation',
            triggers: ['visa', 'passport', 'documents', 'i-20', 'ds-160'],
            instructions: `When discussing visas:
- Always mention required documents
- Provide typical processing timelines
- Recommend scheduling early appointments
- Never guarantee visa approval`
        },
        {
            id: 'university-selection',
            name: 'University Selection',
            triggers: ['university', 'college', 'program', 'course', 'ranking'],
            instructions: `When recommending universities:
- Consider student's budget, scores, and preferences
- Mention application deadlines
- Include scholarship opportunities
- Provide acceptance rate context`
        },
        {
            id: 'pricing-inquiry',
            name: 'Pricing & Packages',
            triggers: ['price', 'cost', 'fee', 'package', 'payment'],
            instructions: `When discussing pricing:
- Quote exact prices from module items when available
- Explain what's included in packages
- Mention payment plans if available
- Be transparent about additional costs`
        }
    ],
    'restaurant': [
        {
            id: 'menu-inquiry',
            name: 'Menu & Ordering',
            triggers: ['menu', 'order', 'dish', 'food', 'price'],
            instructions: `When discussing menu:
- Reference exact items and prices from modules
- Mention popular dishes
- Note dietary options (veg/non-veg/vegan)
- Suggest combos or deals`
        },
        {
            id: 'reservation',
            name: 'Reservations',
            triggers: ['book', 'table', 'reservation', 'seats'],
            instructions: `When handling reservations:
- Confirm date, time, party size
- Mention any minimum orders for groups
- Note special occasions if mentioned`
        }
    ],
    'default': [
        {
            id: 'general-inquiry',
            name: 'General Inquiry',
            triggers: [],
            instructions: `General response guidelines:
- Be helpful and professional
- Reference specific products/services when relevant
- Include pricing when asked
- Offer to connect with a human for complex queries`
        },
        {
            id: 'pricing-inquiry',
            name: 'Pricing',
            triggers: ['price', 'cost', 'how much', 'rate', 'fee'],
            instructions: `When discussing pricing:
- Quote exact prices from your product/service list
- Be specific about what's included
- Mention any discounts or packages available`
        }
    ]
};

export function getSkillsForIndustry(industryCategory: string): IndustrySkill[] {
    const industry = (industryCategory || '').toLowerCase().replace(/\s+/g, '-');
    return DEFAULT_SKILLS[industry] || DEFAULT_SKILLS['default'];
}

export function getApplicableSkills(
    skills: IndustrySkill[],
    customerMessage: string
): IndustrySkill[] {
    const message = (customerMessage || '').toLowerCase();

    // Always include skills without triggers (general rules)
    const applicable = skills.filter(s => !s.triggers || s.triggers.length === 0);

    // Add skills whose triggers match the message
    for (const skill of skills) {
        if (skill.triggers?.some(t => message.includes(t.toLowerCase()))) {
            if (!applicable.find(s => s.id === skill.id)) {
                applicable.push(skill);
            }
        }
    }

    return applicable;
}

export function buildSkillsPrompt(skills: IndustrySkill[]): string {
    if (skills.length === 0) return '';

    return skills.map(s => s.instructions).join('\n\n');
}
