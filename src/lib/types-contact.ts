import { Timestamp } from 'firebase/firestore';

export type CommunicationTone = 'formal' | 'casual' | 'neutral' | 'empathetic' | 'direct' | 'unknown';
export type CommunicationLength = 'brief' | 'detailed' | 'moderate' | 'unknown';
export type SentimentLabel = 'positive' | 'neutral' | 'negative' | 'mixed' | 'unknown';
export type CustomerStage = 'prospect' | 'new' | 'active' | 'vip' | 'at-risk' | 'churned' | 'unknown';
export type BuyingIntent = 'high' | 'medium' | 'low' | 'unknown';

export interface CommunicationStyle {
    tone: CommunicationTone;
    lengthPreference: CommunicationLength;
    keywords: string[];
}

export interface CustomerSentiment {
    label: SentimentLabel;
    score: number; // -1 to 1
    trend: 'improving' | 'declining' | 'stable';
}

export interface ContactPersona {
    summary: string; // High-level executive summary
    communicationStyle: CommunicationStyle;
    sentiment: CustomerSentiment;
    customerStage: CustomerStage;
    buyingIntent: BuyingIntent;

    interests: string[];
    painPoints: string[];
    keyFacts: string[]; // Important extracted facts (e.g., "Has 2 kids", "Budget $5k")

    preferredLanguage: string;
    generatedAt: Date | Timestamp | null;
    generatedFromMessageCount: number;
    manualOverrides: Record<string, any>;
}

export const DEFAULT_CONTACT_PERSONA: ContactPersona = {
    summary: '',
    communicationStyle: {
        tone: 'unknown',
        lengthPreference: 'unknown',
        keywords: []
    },
    sentiment: {
        label: 'unknown',
        score: 0,
        trend: 'stable'
    },
    customerStage: 'unknown',
    buyingIntent: 'unknown',
    interests: [],
    painPoints: [],
    keyFacts: [],
    preferredLanguage: 'en',
    generatedAt: null,
    generatedFromMessageCount: 0,
    manualOverrides: {},
};

export interface PersonaGenerationResult {
    success: boolean;
    persona?: ContactPersona;
    error?: string;
}

export const PERSONA_GENERATION_THRESHOLD = 10;

export const PERSONA_TONE_LABELS: Record<CommunicationTone, string> = {
    formal: 'Formal & Professional',
    casual: 'Casual & Friendly',
    neutral: 'Neutral',
    empathetic: 'Empathetic',
    direct: 'Direct',
    unknown: 'Not yet determined',
};

export const PERSONA_SENTIMENT_LABELS: Record<SentimentLabel, string> = {
    positive: 'Positive',
    neutral: 'Neutral',
    negative: 'Negative',
    mixed: 'Mixed',
    unknown: 'Not yet determined',
};

export const PERSONA_STAGE_LABELS: Record<CustomerStage, string> = {
    prospect: 'Prospect',
    new: 'New Customer',
    active: 'Active Customer',
    vip: 'VIP',
    'at-risk': 'At Risk',
    churned: 'Churned',
    unknown: 'Unknown',
};
