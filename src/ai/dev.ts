
import '@/ai/genkit'; // This will now handle the admin initialization
// The .env.local file will be loaded automatically by Next.js

import '@/ai/flows/summarize-task-context.ts';
import '@/ai/flows/suggest-workflow-steps.ts';
import '@/ai/flows/manage-admin-user-flow.ts';
import '@/ai/flows/create-tenant-flow.ts';
import '@/ai/flows/update-partner-flow.ts';
import '@/ai/flows/user-management-flow.ts';
import '@/ai/flows/delete-partner-flow.ts';
import '@/ai/flows/set-user-claims-flow.ts';
import '@/ai/flows/suggest-industry-templates.ts';
import '@/ai/flows/generate-campaign-content-flow.ts';
import '@/ai/flows/generate-campaign-image-flow.ts';
import '@/ai/flows/generate-stock-pick-image-flow.ts';

