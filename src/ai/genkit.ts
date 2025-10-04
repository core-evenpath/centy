
// src/ai/genkit.ts
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import './../lib/firebase-admin'; // Ensures admin is initialized

export const ai = genkit({
  plugins: [googleAI()],
});
