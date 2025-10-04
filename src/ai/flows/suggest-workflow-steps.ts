// src/ai/flows/suggest-workflow-steps.ts
'use server';

import {ai} from '../genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {
  SuggestWorkflowStepsInputSchema,
  SuggestWorkflowStepsOutputSchema,
  type SuggestWorkflowStepsInput,
  type SuggestWorkflowStepsOutput,
} from '../../lib/types';

export async function suggestWorkflowSteps(input: SuggestWorkflowStepsInput): Promise<SuggestWorkflowStepsOutput> {
  return suggestWorkflowStepsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestWorkflowStepsPrompt',
  model: googleAI.model('gemini-1.5-flash-latest'),
  input: {schema: SuggestWorkflowStepsInputSchema},
  output: {schema: SuggestWorkflowStepsOutputSchema},
  prompt: `You are an expert AI workflow designer for an operational automation platform. Your primary goal is to design the most efficient and logical operational workflow possible based on a user's problem description.

**CRITICAL: Design workflows with professional visual layout in mind. Consider how the workflow will appear on a visual canvas.**

**Available Step Types:**
- 'ai_agent': An AI model performs a task (e.g., classify, analyze, generate).
- 'human_input': The workflow pauses to get input or a decision from a person.
- 'api_call': The workflow interacts with an external system (e.g., CRM, Calendar, SMS Gateway).
- 'notification': The workflow sends an alert (e.g., email, push, chat).
- 'conditional_branch': A step that contains multiple "branches". Each branch has a condition (like "IF urgency = CRITICAL") and a list of nested steps to execute if that condition is met.

**Layout Considerations:**
- Design workflows that flow logically from left to right
- Use conditional branches for decision points that split the flow
- Group related activities together (e.g., all approvals, all notifications)
- Consider parallel processes that can happen simultaneously
- Think about swimlanes for different roles/departments
- Minimize crossing paths and complex routing

**Workflow Structure Patterns:**
1. **Linear Flow**: Simple sequential steps (A → B → C → D)
2. **Decision Tree**: One decision point with multiple branches
3. **Parallel Processing**: Multiple simultaneous paths that may reconverge
4. **Approval Chain**: Sequential approvals with escalation paths
5. **Swimlane Flow**: Different roles handling different parts

**Your Task:**
1. Read the user's workflow description to understand their operational goal
2. Identify the workflow pattern that best fits their needs
3. Design steps that follow professional workflow visualization principles
4. **Crucially, identify where the process needs to change based on different conditions (e.g., urgency, customer type, cost). Use the 'conditional_branch' step for this.**
5. For each conditional branch, define the condition clearly (e.g., "IF risk_level = HIGH") and list the specific action steps inside that branch
6. Consider which steps can run in parallel vs. sequential
7. Group related steps logically for visual clarity
8. Provide a concise 'name' and 'description' for the entire workflow
9. Add layout hints in step descriptions when helpful
10. Format your entire response as a single JSON object matching the output schema

**Enhanced Conditional Branch Structure:**

{
  "type": "conditional_branch",
  "name": "Risk Assessment Decision",
  "description": "Evaluates request risk and routes to appropriate approval path",
  "branches": [
    {
      "condition": "IF risk_level = HIGH",
      "steps": [
        { "type": "human_input", "name": "Senior Manager Review", "description": "Senior manager must review high-risk requests within 2 hours" },
        { "type": "human_input", "name": "Legal Team Approval", "description": "Legal team validates compliance for high-risk items" },
        { "type": "api_call", "name": "Create Risk Log Entry", "description": "Log high-risk approval in compliance system" }
      ]
    },
    {
      "condition": "ELSE IF risk_level = MEDIUM", 
      "steps": [
        { "type": "human_input", "name": "Manager Approval", "description": "Department manager approves medium-risk requests" },
        { "type": "notification", "name": "Notify Stakeholders", "description": "Send approval notification to relevant team members" }
      ]
    },
    {
      "condition": "ELSE (low risk)",
      "steps": [
        { "type": "ai_agent", "name": "Auto-Approve", "description": "AI automatically approves low-risk requests based on policy rules" },
        { "type": "api_call", "name": "Update System", "description": "Update request status to approved in main system" }
      ]
    }
  ]
}

**Example Professional Workflow Structures:**

**Approval Chain Pattern:**
Submit → AI Screen → Manager Review → Senior Approval → Execute → Notify

**Decision Tree Pattern:**
Intake → Classify → [Branch: Type A → Process A] / [Branch: Type B → Process B] / [Branch: Type C → Process C]

**Swimlane Pattern:**
Customer Actions: Submit → Wait → Receive
System Actions: Validate → Process → Update  
Manager Actions: Review → Approve → Sign-off

**User's Workflow Description:**
"{{workflowDescription}}"

Design a workflow that will look professional and logical when displayed on a visual workflow canvas. Consider the natural flow, decision points, and how different roles interact.`,
});

const suggestWorkflowStepsFlow = ai.defineFlow(
  {
    name: 'suggestWorkflowStepsFlow',
    inputSchema: SuggestWorkflowStepsInputSchema,
    outputSchema: SuggestWorkflowStepsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
