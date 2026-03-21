import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export const AI_MODEL = 'claude-sonnet-4-20250514';

export default anthropic;
