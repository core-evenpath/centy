'use server';

import { generateImage } from '@/lib/gemini-service';
import { GoogleGenAI } from '@google/genai';

/**
 * Generate a broadcast marketing image from a text prompt.
 * Optionally accepts a reference image for AI-powered editing.
 */
export async function generateBroadcastImageAction(
    prompt: string,
    referenceImage?: { base64: string; mimeType: string }
): Promise<{ success: boolean; dataUri?: string; error?: string }> {
    try {
        const dataUri = await generateImage(prompt, referenceImage);
        return { success: true, dataUri };
    } catch (error: any) {
        console.error('[BroadcastImage] Generation error:', error);
        return { success: false, error: error.message || 'Image generation failed' };
    }
}

/**
 * Generate suggested image prompts based on broadcast message content + business context.
 * Returns 4 short image generation prompts.
 */
export async function suggestImagePromptsAction(
    message: string,
    businessName: string,
    industry: string
): Promise<{ success: boolean; prompts?: string[]; error?: string }> {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are a marketing image prompt specialist.

Based on this WhatsApp broadcast message for a ${industry} business called "${businessName}":

"${message}"

Generate 4 SHORT image generation prompts (1-2 sentences each) that would create effective marketing images for this broadcast. The images should be:
- Professional and clean
- Suitable for WhatsApp header images (1200x628px landscape)
- Eye-catching but not cluttered
- Relevant to the message content

Return ONLY a JSON array of 4 strings, no other text:
["prompt 1", "prompt 2", "prompt 3", "prompt 4"]`,
            config: {
                temperature: 0.8,
                responseMimeType: 'application/json',
            },
        });

        const parsed = JSON.parse(result.text || '[]');
        const prompts = Array.isArray(parsed) ? parsed.slice(0, 4).map(String) : [];
        return { success: true, prompts };
    } catch (error: any) {
        console.error('[BroadcastImage] Prompt suggestion error:', error);
        return { success: false, error: error.message || 'Failed to suggest prompts' };
    }
}
