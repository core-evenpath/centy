
// ============================================================================
// FIREBASE BACKEND VARIABLES
// ============================================================================
import { z } from 'zod';
import type { UserInfo } from 'firebase/auth';


// ============================================================================
// 1. FIREBASE AUTHENTICATION VARIABLES
// ============================================================================

export interface FirebaseAuthUser extends Partial<UserInfo> {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  emailVerified: boolean;
  customClaims?: {
    [key: string]: any; // Allow any custom claims
    role?: 'Super Admin' | 'Admin' | 'partner_admin' | 'employee';
    partnerId?: string;
  };
  creationTime?: string;
  lastSignInTime?: string;
  providerData: UserInfo[];
}

export interface AuthState {
  user: FirebaseAuthUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export interface AdminUser {
  id: string; // This is the UID from Firebase Auth
  uid?: string; // UID can be optional during creation
  name: string;
  email: string;
  role: 'Super Admin' | 'Admin';
  status: 'active' | 'invited' | 'suspended';
  avatar: string;
  lastActive: string;
  joinedDate: string;
  permissions: string[];
}

export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestResourceData?: any;
};

// ============================================================================
// 2. USER MANAGEMENT VARIABLES
// ============================================================================

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  role: 'admin' | 'partner' | 'employee';
  onboardingCompleted: boolean;
  workspaces?: UserWorkspaceLink[];
  preferences: UserPreferences;
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
  lastActiveAt: FirebaseTimestamp;
  isActive: boolean;
  timezone: string;
}

export interface UserWorkspaceLink {
  id?: string;
  userId: string;
  partnerId: string;
  tenantId: string;
  role: 'partner_admin' | 'employee';
  status: 'active' | 'invited' | 'suspended';
  permissions: string[];
  joinedAt: FirebaseTimestamp;
  invitedBy?: string;
  invitedAt?: FirebaseTimestamp;
  partnerName: string;
  partnerAvatar: string | null;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: NotificationPreferences;
  dashboard: DashboardPreferences;
  emailDigest: 'daily' | 'weekly' | 'never';
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  workflowCompleted: boolean;
  workflowFailed: boolean;
  newTeamMember: boolean;
  systemUpdates: boolean;
}

export interface DashboardPreferences {
  defaultView: 'overview' | 'workflows' | 'analytics';
  widgetLayout: any[];
  refreshInterval: number;
}

// ============================================================================
// 3. PARTNER & WORKSPACE VARIABLES
// ============================================================================

export interface Partner {
  id: string;
  tenantId?: string;
  name: string;
  businessName: string;
  contactPerson: string;
  email: string;
  phone: string;
  whatsAppPhone?: string;
  status: 'active' | 'pending' | 'suspended';
  isActivePlanUser?: boolean;
  plan: 'Starter' | 'Professional' | 'Enterprise';
  joinedDate: string;
  industry: Industry | null;
  businessSize: 'small' | 'medium' | 'large';
  employeeCount: number;
  monthlyRevenue: string;
  location: { city: string; state: string };
  aiProfileCompleteness: number;
  stats: {
    activeWorkflows: number;
    totalExecutions: number;
    successRate: number;
    avgROI: number;
    timeSaved: string;
  };
  businessProfile: BusinessProfile | null;
  aiMemory: AIMemory | null;
  createdAt?: any | string; // Allow for serverTimestamp or string
  updatedAt?: any | string; // Allow for serverTimestamp or string
  tasksCompleted?: number; // Added for mock data compatibility
}

export interface PartnerSettings {
  allowEmployeeCustomization: boolean;
  requireApprovalForTasks: boolean;
  chatEnabled: boolean;
  maxEmployees: number;
  workflowExecutionLimits: {
    daily: number;
    monthly: number;
  };
  apiIntegrationLimits: number;
  customBranding: boolean;
  advancedAnalytics: boolean;
}

export interface PartnerSubscription {
  plan: 'trial' | 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid';
  currentPeriodStart: FirebaseTimestamp;
  currentPeriodEnd: FirebaseTimestamp;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export interface BillingInfo {
  companyName?: string;
  address?: Address;
  taxId?: string;
  billingEmail?: string;
  paymentMethod?: PaymentMethod;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface PaymentMethod {
  type: 'card' | 'bank_account';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

// ============================================================================
// 4. INDUSTRY & BUSINESS PROFILE VARIABLES
// ============================================================================

export interface Industry {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  category?: string;
  workflowPatterns?: WorkflowPattern[];
  successMetrics?: SuccessMetric[];
  popularIntegrations?: string[];
  averageSetupTime?: number;
  averageROI?: number;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowPattern {
  name: string;
  description: string;
  frequency: 'common' | 'moderate' | 'rare';
  complexity: 'simple' | 'medium' | 'complex';
  estimatedValue: number;
}

export interface SuccessMetric {
  name: string;
  description: string;
  unit: string;
  benchmarkValue: number;
  formula?: string;
}

export interface BusinessProfile {
  id: string;
  partnerId: string;
  industryId: string;
  industry: Industry;
  businessName: string;
  businessSize: 'small' | 'medium' | 'large';
  employeeCount?: number;
  locationCity?: string;
  locationState?: string;
  locationCountry?: string;
  painPoints: string[];
  currentTools: CurrentTool[];
  goals: BusinessGoal[];
  monthlyRevenueRange?: string;
  budgetRange?: string;
  timelineExpectation?: string;
  technicalExpertise?: 'low' | 'medium' | 'high';
  createdAt?: any;
  updatedAt?: any;
}

export interface AIMemory {
  businessUnderstanding: string;
  keyInsights: string[];
  successPatterns: string;
  workflowPreferences: string;
  concernsRisks: string;
}

export interface BusinessLocation {
  city?: string;
  state?: string;
  country: string;
  timezone?: string;
}

export interface CurrentTool {
  name: string;
  category: string;
  satisfaction: 1 | 2 | 3 | 4 | 5;
  monthlySpend?: number;
  integrationRequired?: boolean;
}

export interface BusinessGoal {
  category?: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  timeline: string;
  measurable?: boolean;
}

// ============================================================================
// 5. WORKFLOW TEMPLATE VARIABLES
// ============================================================================

export const SuggestIndustryTemplatesInputSchema = z.object({
  industry: z.string().describe('The industry to generate workflow templates for (e.g., "Property Management").'),
});
export type SuggestIndustryTemplatesInput = z.infer<typeof SuggestIndustryTemplatesInputSchema>;

export const IndustryTemplateSchema = z.object({
  name: z.string().describe("A concise, descriptive name for the workflow template."),
  description: z.string().describe("A one-sentence summary of what the workflow accomplishes."),
  category: z.string().describe("A one-word category for the workflow (e.g., 'Emergency', 'Financial', 'Leasing')."),
  popularity: z.enum(['Most Popular', 'Popular', 'New']).optional().describe("A popularity ranking."),
  steps: z.number().int().describe("An estimated number of steps in the workflow."),
  icon: z.string().min(1).describe("A single emoji character to represent the workflow."),
});
export type IndustryTemplate = z.infer<typeof IndustryTemplateSchema>;

export const SuggestIndustryTemplatesOutputSchema = z.object({
  templates: z.array(IndustryTemplateSchema),
});
export type SuggestIndustryTemplatesOutput = z.infer<typeof SuggestIndustryTemplatesOutputSchema>;


export const SuggestWorkflowStepsInputSchema = z.object({
  workflowDescription: z.string().describe('A description of the workflow for which to suggest steps.'),
});
export type SuggestWorkflowStepsInput = z.infer<typeof SuggestWorkflowStepsInputSchema>;


export const StepSchema: z.ZodType<any> = z.lazy(() => z.object({
  id: z.string().optional(),
  type: z.string().describe("The type of the step, e.g., 'ai_agent', 'human_input', 'conditional_branch', 'api_call', 'notification'."),
  name: z.string().describe("A human-readable name for the step, e.g., 'Classify Request Urgency'."),
  description: z.string().describe("A brief explanation of what this step does."),
  // For conditional branches
  branches: z.array(z.object({
    condition: z.string().describe("The condition for this branch, e.g., 'IF urgency = CRITICAL'"),
    steps: z.array(StepSchema).describe("The nested steps for this branch.")
  })).optional(),
}));


export const SuggestWorkflowStepsOutputSchema = z.object({
  name: z.string().describe("A concise name for the entire workflow."),
  description: z.string().describe("A short description of what the workflow accomplishes."),
  steps: z.array(StepSchema).describe("An array of the structured steps for the workflow, which can include nested conditional branches."),
});
export type SuggestWorkflowStepsOutput = z.infer<typeof SuggestWorkflowStepsOutputSchema>;

// AI Composer Schemas
export const GenerateCampaignContentInputSchema = z.object({
  prompt: z.string().describe('The user\'s request for the campaign content.'),
});
export type GenerateCampaignContentInput = z.infer<typeof GenerateCampaignContentInputSchema>;

export const GenerateCampaignContentOutputSchema = z.object({
  content: z.string().describe('The generated marketing content.'),
});
export type GenerateCampaignContentOutput = z.infer<typeof GenerateCampaignContentOutputSchema>;

export const GenerateCampaignImageInputSchema = z.object({
  prompt: z.string().describe("The user's text prompt to generate an image from."),
});
export type GenerateCampaignImageInput = z.infer<typeof GenerateCampaignImageInputSchema>;

export const GenerateCampaignImageOutputSchema = z.object({
  imageUrl: z.string().url().describe('The data URI of the generated image.'),
});
export type GenerateCampaignImageOutput = z.infer<typeof GenerateCampaignImageOutputSchema>;


export interface WorkflowTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  industryId?: string;
  industry?: Industry;
  templateType: 'ready' | 'ai_generated' | 'custom';
  complexity: 'simple' | 'medium' | 'complex';
  steps: WorkflowStep[];
  isFeatured: boolean;
  isPublic?: boolean;
  successRate: number;
  avgSetupTimeHours: number;
  roiPercentage: number;
  usageCount: number;
  userRating?: number;
  estimatedTime: string;
  tags: string[];
  icon: string;
  thumbnail?: string;
  apiIntegrations: string[];
  requiredPermissions?: string[];
  createdBy?: string;
  createdByRole?: 'admin' | 'partner';
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
  aiAgents?: number;
  totalUses?: number; // Added for analytics
}

export interface WorkflowStep {
  id: string;
  type: 'ai_agent' | 'human_input' | 'approval' | 'notification' | 'api_call' | 'conditional_branch' | 'data_processing' | 'file_handling' | 'delay' | 'webhook';
  title: string;
  description: string;
  configuration: StepConfiguration;
  order: number;
  isRequired: boolean;
  conditions?: StepCondition[];
  errorHandling?: ErrorHandling;
  timeout?: number;
  retryPolicy?: RetryPolicy;
  aiGenerated?: boolean;
  branches?: WorkflowBranch[]; // For conditional steps
}

export interface WorkflowBranch {
  condition: string;
  steps: WorkflowStep[];
}

export interface StepConfiguration {
  // AI Agent Step
  agentType?: 'summarize' | 'classify' | 'extract' | 'generate' | 'analyze' | 'translate' | 'sentiment';
  aiModel?: string;
  prompt?: string;
  systemPrompt?: string;
  provider?: 'openai' | 'anthropic' | 'google';
  temperature?: number;
  maxTokens?: number;
  
  // Manual Input Step
  inputType?: 'text' | 'file' | 'image' | 'form' | 'signature' | 'recording';
  fields?: FormField[];
  required?: boolean;
  placeholder?: string;
  validation?: ValidationRule[];
  fileTypes?: string[];
  maxFileSize?: number;
  
  // Approval Step
  approverRole?: 'partner_admin' | 'specific_user' | 'any_admin';
  approverId?: string;
  autoApprove?: boolean;
  timeoutHours?: number;
  escalationRules?: EscalationRule[];
  
  // Notification Step
  channel?: 'email' | 'sms' | 'chat' | 'push' | 'webhook';
  template?: string;
  recipients?: string[];
  urgent?: boolean;
  customMessage?: string;
  attachments?: string[];
  
  // API Call Step
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  authentication?: APIAuthentication;
  responseMapping?: ResponseMapping;
  
  // Conditional Step
  conditions?: LogicalCondition[];
  trueSteps?: string[];
  falseSteps?: string[];
  
  // Data Processing Step
  transformations?: DataTransformation[];
  validations?: DataValidation[];
  mappings?: DataMapping[];
  
  // Delay Step
  delayType?: 'fixed' | 'until_date' | 'until_condition';
  duration?: number;
  unit?: 'seconds' | 'minutes' | 'hours' | 'days';
  targetDate?: Date;
  condition?: string;
}

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'number' | 'date' | 'select' | 'multiselect' | 'textarea' | 'file' | 'checkbox' | 'radio';
  label: string;
  placeholder?: string;
  required: boolean;
  validation?: ValidationRule[];
  options?: SelectOption[];
  defaultValue?: any;
  helpText?: string;
}

export interface ValidationRule {
  type: 'required' | 'email' | 'phone' | 'url' | 'min_length' | 'max_length' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface StepCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'exists' | 'not_exists';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface ErrorHandling {
  onError: 'stop' | 'continue' | 'retry' | 'skip' | 'escalate';
  maxRetries?: number;
  retryDelay?: number;
  fallbackSteps?: string[];
  notifyOnError?: boolean;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: 'fixed' | 'exponential' | 'linear';
  initialDelay: number;
  maxDelay?: number;
  multiplier?: number;
}

// ============================================================================
// 6. WORKFLOW INSTANCE & EXECUTION VARIABLES
// ============================================================================

export interface WorkflowInstance {
  id: string;
  templateId: string;
  template?: WorkflowTemplate;
  partnerId: string;
  businessProfileId?: string;
  name: string;
  description?: string;
  customizations: WorkflowCustomization[];
  deploymentStatus: 'draft' | 'testing' | 'live' | 'paused' | 'archived';
  triggerConfig: TriggerConfiguration;
  performanceMetrics: PerformanceMetrics;
  schedule?: ScheduleConfig;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastExecutedAt?: Date;
  nextExecutionAt?: Date;
}

export interface WorkflowCustomization {
  stepId: string;
  field: string;
  originalValue: any;
  customValue: any;
  reason?: string;
  modifiedBy: string;
  modifiedAt: Date;
}

export interface TriggerConfiguration {
  type: 'manual' | 'schedule' | 'webhook' | 'email' | 'form_submission' | 'api_event' | 'file_upload';
  settings: TriggerSettings;
  isActive: boolean;
}

export interface TriggerSettings {
  // Schedule Trigger
  frequency?: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
  cronExpression?: string;
  timezone?: string;
  
  // Webhook Trigger
  webhookUrl?: string;
  secret?: string;
  headers?: Record<string, string>;
  
  // Form Trigger
  formId?: string;
  formFields?: string[];
  
  // Email Trigger
  emailAddress?: string;
  emailFilters?: EmailFilter[];
}

export interface EmailFilter {
  field: 'subject' | 'from' | 'body';
  operator: 'contains' | 'equals' | 'starts_with' | 'ends_with';
  value: string;
}

export interface ScheduleConfig {
  enabled: boolean;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number;
  daysOfWeek?: number[];
  timeOfDay?: string;
  timezone: string;
  nextRun?: Date;
}

export interface PerformanceMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  lastSuccessAt?: Date;
  lastFailureAt?: Date;
  uptimePercentage: number;
  costPerExecution?: number;
  roiGenerated?: number;
}

export interface WorkflowExecution {
  id: string;
  workflowInstanceId: string;
  workflowInstance?: WorkflowInstance;
  triggerData: any;
  executionPath: ExecutionStep[];
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
  currentStepId?: string;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  errorDetails?: ExecutionError;
  results: ExecutionResults;
  context: ExecutionContext;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdBy?: string;
}

export interface ExecutionStep {
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  input?: any;
  output?: any;
  errorMessage?: string;
  retryCount?: number;
  assignedTo?: string;
}

export interface ExecutionError {
  code: string;
  message: string;
  stepId?: string;
  timestamp: Date;
  stackTrace?: string;
  recoverable: boolean;
}

export interface ExecutionResults {
  success: boolean;
  data: any;
  files?: ExecutionFile[];
  notifications?: NotificationResult[];
  apiCalls?: APICallResult[];
  metrics?: any;
}

export interface ExecutionFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  createdAt: Date;
}

export interface NotificationResult {
  channel: string;
  recipient: string;
  status: 'sent' | 'failed' | 'pending';
  messageId?: string;
  timestamp: Date;
}

export interface APICallResult {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  success: boolean;
  timestamp: Date;
}

export interface ExecutionContext {
  partnerId: string;
  userId?: string;
  businessProfileId?: string;
  environment: 'production' | 'testing' | 'development';
  variables: Record<string, any>;
  metadata: Record<string, any>;
}

// ============================================================================
// 7. AI & PROBLEM DESCRIPTION VARIABLES
// ============================================================================

export interface ProblemDescription {
  id: string;
  partnerId: string;
  title: string;
  description: string;
  category?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'analyzing' | 'solution_ready' | 'implemented' | 'closed';
  aiAnalysis?: AIAnalysis;
  generatedWorkflows?: GeneratedWorkflow[];
  selectedWorkflowId?: string;
  feedback?: ProblemFeedback;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIAnalysis {
  category: string;
  complexity: 'simple' | 'medium' | 'complex';
  stakeholders: string[];
  triggerEvents: string[];
  successCriteria: string[];
  estimatedTimeToSolve: string;
  confidenceScore: number;
  recommendedApproach: string;
  potentialChallenges: string[];
  requiredResources: string[];
}

export interface GeneratedWorkflow {
  id: string;
  problemDescriptionId: string;
  title: string;
  description: string;
  steps: WorkflowStep[];
  estimatedROI: number;
  estimatedSetupTime: string;
  confidenceScore: number;
  requiredIntegrations: string[];
  isSelected: boolean;
  createdAt: Date;
}

export interface ProblemFeedback {
  solutionRating: 1 | 2 | 3 | 4 | 5;
  implementationSuccess: boolean;
  comments: string;
  improvements: string[];
  wouldRecommend: boolean;
  createdAt: Date;
}

export interface AIGenerationLog {
  id: string;
  type: 'problem_analysis' | 'workflow_generation' | 'optimization_suggestion';
  inputData: any;
  outputData: any;
  model: string;
  provider: 'openai' | 'anthropic' | 'google';
  tokenUsage: TokenUsage;
  processingTime: number;
  confidenceScore?: number;
  success: boolean;
  errorMessage?: string;
  createdAt: Date;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost?: number;
}

export interface AITrainingData {
  id: string;
  type: 'problem_example' | 'workflow_template' | 'success_pattern' | 'failure_pattern';
  industryId?: string;
  category: string;
  inputData: any;
  expectedOutput: any;
  actualOutput?: any;
  performance?: number;
  isValidated: boolean;
  validatedBy?: string;
  validatedAt?: Date;
  createdAt: Date;
}

// ============================================================================
// 8. API INTEGRATION VARIABLES
// ============================================================================

export interface APIIntegration {
  id: string;
  name: string;
  provider: string;
  category: 'communication' | 'payment' | 'calendar' | 'crm' | 'storage' | 'analytics' | 'industry_specific';
  description: string;
  icon: string;
  supportedActions: APIAction[];
  authType: 'api_key' | 'oauth2' | 'basic_auth' | 'bearer_token';
  baseUrl: string;
  documentation: string;
  isActive: boolean;
  popularityScore: number;
  reliabilityScore: number;
  avgResponseTime: number;
  cost: APICosting;
  limitations: APILimitation[];
  requiredCredentials: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface APIAction {
  id: string;
  name: string;
  description: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  parameters: APIParameter[];
  responseFormat: any;
  examples: APIExample[];
}

export interface APIParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
  defaultValue?: any;
  validation?: ValidationRule[];
}

export interface APIExample {
  title: string;
  description: string;
  request: any;
  response: any;
}

export interface APICosting {
  model: 'free' | 'freemium' | 'per_request' | 'subscription';
  freeLimit?: number;
  costPerRequest?: number;
  subscriptionTiers?: SubscriptionTier[];
}

export interface SubscriptionTier {
  name: string;
  monthlyPrice: number;
  requestLimit: number;
  features: string[];
}

export interface APILimitation {
  type: 'rate_limit' | 'data_limit' | 'feature_restriction';
  description: string;
  value?: number;
  unit?: string;
}

export interface PartnerAPIConfiguration {
  id: string;
  partnerId: string;
  apiIntegrationId: string;
  apiIntegration?: APIIntegration;
  displayName?: string;
  configuration: APICredentials;
  status: 'active' | 'inactive' | 'error' | 'testing';
  lastTestAt?: Date;
  lastErrorAt?: Date;
  errorMessage?: string;
  usageStats: APIUsageStats;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface APICredentials {
  authType: string;
  credentials: Record<string, any>; // Encrypted
  endpoints?: Record<string, string>;
  settings?: Record<string, any>;
}

export interface APIUsageStats {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  lastCallAt?: Date;
  averageResponseTime: number;
  monthlyUsage: number;
  quotaUsed?: number;
  quotaLimit?: number;
}

// ============================================================================
// 9. TEAM MANAGEMENT VARIABLES
// ============================================================================

export interface Task {
  id: string;
  title: string;
  description?: string;
  workflow: string;
  priority: 'high' | 'medium' | 'low';
  status: 'assigned' | 'in_progress' | 'awaiting_approval' | 'completed';
  dueDate?: Date | null;
  assignee?: string;
  partnerId: string;
  createdAt?: any;
  updatedAt?: any;
  assigneeName?: string;
  assigneeEmail?: string;
  tenantId?: string;
  completedAt?: Date | null;
}

export interface TeamMember {
  id: string; // Should be the user's UID
  userId?: string;
  tenantId?: string;
  user?: UserProfile;
  partnerId: string;
  name: string;
  email: string;
  phone?: string;
  role: 'partner_admin' | 'employee';
  status: 'active' | 'invited' | 'suspended' | 'left';
  permissions?: TeamPermission[];
  skills: string[];
  workloadCapacity?: number;
  currentWorkload?: number;
  performanceMetrics?: TeamMemberMetrics;
  assignedWorkflows?: string[];
  availability?: Availability;
  invitedBy?: string;
  invitedAt?: Date;
  joinedDate?: string;
  lastActive?: string | Date;
  avatar: string;
  tasksCompleted: number;
  avgCompletionTime: string;
  createdAt?: any;
}

export interface TeamPermission {
  resource: string;
  actions: string[];
  conditions?: any[];
}

export interface Skill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
}

export interface TeamMemberMetrics {
  tasksCompleted: number;
  averageCompletionTime: number;
  qualityScore: number;
  customerSatisfaction: number;
  punctualityScore: number;
  communicationScore: number;
  lastReview?: TeamReview;
}

export interface TeamReview {
  reviewerId: string;
  rating: number;
  comments: string;
  areas_for_improvement: string[];
  strengths: string[];
  reviewedAt: Date;
}

export interface Availability {
  timezone: string;
  workingHours: WorkingHours[];
  holidays: Holiday[];
  timeOff: TimeOff[];
  isAvailable: boolean;
  lastUpdated: Date;
}

export interface WorkingHours {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  isActive: boolean;
}

export interface Holiday {
  name: string;
  date: Date;
  isRecurring: boolean;
}

export interface TimeOff {
  startDate: Date;
  endDate: Date;
  reason: string;
  status: 'approved' | 'pending' | 'rejected';
  approvedBy?: string;
}

// ============================================================================
// 10. ANALYTICS & REPORTING VARIABLES
// ============================================================================

export interface AnalyticsData {
  id: string;
  partnerId: string;
  type: 'workflow_performance' | 'team_metrics' | 'business_impact' | 'cost_analysis' | 'usage_stats';
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate: Date;
  data: AnalyticsMetrics;
  createdAt: Date;
}

export interface AnalyticsMetrics {
  // Workflow Performance
  totalExecutions?: number;
  successRate?: number;
  averageExecutionTime?: number;
  errorRate?: number;
  topPerformingWorkflows?: WorkflowStat[];
  bottleneckSteps?: StepStat[];
  
  // Team Metrics
  teamProductivity?: number;
  averageTaskCompletionTime?: number;
  teamUtilization?: number;
  topPerformers?: TeamMemberStat[];
  
  // Business Impact
  timesSaved?: number;
  costReduction?: number;
  revenueGenerated?: number;
  customerSatisfactionImpact?: number;
  
  // Usage Stats
  activeUsers?: number;
  workflowsCreated?: number;
  apiCallsCount?: number;
  storageUsed?: number;
}

export interface WorkflowStat {
  workflowId: string;
  workflowName: string;
  executions: number;
  successRate: number;
  avgDuration: number;
  roiGenerated: number;
}

export interface StepStat {
  stepId: string;
  stepName: string;
  stepType: string;
  failureRate: number;
  avgDuration: number;
  bottleneckScore: number;
}

export interface TeamMemberStat {
  memberId: string;
  memberName: string;
  tasksCompleted: number;
  avgCompletionTime: number;
  qualityScore: number;
  productivityScore: number;
}

export interface DashboardWidget {
  id: string;
  partnerId: string;
  type: 'chart' | 'metric' | 'table' | 'progress' | 'alert';
  title: string;
  description?: string;
  position: WidgetPosition;
  size: WidgetSize;
  configuration: WidgetConfiguration;
  dataSource: string;
  refreshInterval: number;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WidgetPosition {
  x: number;
  y: number;
  row: number;
  col: number;
}

export interface WidgetSize {
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
}

export interface WidgetConfiguration {
  chartType?: 'line' | 'bar' | 'pie' | 'doughnut' | 'area';
  metrics?: string[];
  filters?: any[];
  timeRange?: string;
  groupBy?: string;
  sortBy?: string;
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
}

// ============================================================================
// 11. COMMUNICATION & NOTIFICATION VARIABLES
// ============================================================================

export interface Notification {
  id: string;
  partnerId: string;
  userId?: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'workflow' | 'system' | 'team' | 'billing' | 'integration';
  title: string;
  message: string;
  data?: any;
  channels: NotificationChannel[];
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  actionUrl?: string;
  actionText?: string;
  isRead: boolean;
  readAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

export interface NotificationChannel {
  type: 'email' | 'sms' | 'push' | 'in_app' | 'webhook';
  address: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  deliveredAt?: Date;
  errorMessage?: string;
}

export interface Conversation {
  id: string;
  partnerId: string;
  type: 'general' | 'workflow_specific' | 'support' | 'direct_message' | 'direct' | 'group';
  title: string;
  description?: string;
  participants: ConversationParticipant[] | string[]; // Allow both formats
  workflowId?: string;
  isActive: boolean;
  lastMessageAt?: any; // Firebase Timestamp
  messageCount: number;
  createdBy: string;
  createdAt: any; // Firebase Timestamp
}

export interface ConversationParticipant {
  userId: string;
  user?: UserProfile;
  role: 'admin' | 'member' | 'observer';
  joinedAt: Date;
  lastReadAt?: Date;
  isActive: boolean;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: UserProfile;
  type: 'text' | 'file' | 'image' | 'system' | 'workflow_update';
  content: string;
  attachments?: MessageAttachment[];
  metadata?: any;
  isEdited: boolean;
  editedAt?: Date;
  reactions?: MessageReaction[];
  replyToId?: string;
  mentions?: string[];
  createdAt: any;
}

export interface MessageAttachment {
  id: string;
  type: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface MessageReaction {
  emoji: string;
  users: string[];
  count: number;
}

// ============================================================================
// 12. CAMPAIGN & CONTACTS VARIABLES
// ============================================================================
export interface Campaign {
  id: string;
  name: string;
  partnerId: string;
  status: 'draft' | 'scheduled' | 'sent' | 'archived';
  message: string;
  recipients: {
    contacts: string[];
    groups: string[];
  };
  sentCount: number;
  engagementRate: number;
  revenueGenerated: number;
  createdAt: any; // Firebase Timestamp
  sentAt?: any; // Firebase Timestamp
}

export interface Contact {
  id: string;
  name: string;
  partnerId: string;
  email?: string;
  phone: string;
  status: 'active' | 'inactive';
  groups?: string[];
  createdAt?: any;
  updatedAt?: any;
}

export interface ContactGroup {
  id: string;
  name: string;
  partnerId: string;
  description?: string;
  contactCount: number;
  createdAt?: any;
}


// ============================================================================
// SYSTEM CONFIGURATION VARIABLES
// ============================================================================

export interface SystemConfig {
  id: string;
  category: 'general' | 'ai' | 'integrations' | 'billing' | 'security';
  key: string;
  value: any;
  description: string;
  isSecret: boolean;
  environment: 'development' | 'staging' | 'production';
  lastModifiedBy: string;
  lastModifiedAt: Date;
  createdAt: Date;
}

export interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  description: string;
  isEnabled: boolean;
  conditions?: FeatureFlagCondition[];
  rolloutPercentage: number;
  targetAudience?: 'all' | 'partners' | 'admins' | 'specific_users';
  targetUserIds?: string[];
  targetPartnerIds?: string[];
  environment: 'development' | 'staging' | 'production';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureFlagCondition {
  attribute: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than';
  value: any;
}

export interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string;
  partnerId?: string;
  userId: string;
  user?: UserProfile;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// ============================================================================
// FILE MANAGEMENT VARIABLES
// ============================================================================

export interface FileUpload {
  id: string;
  partnerId: string;
  userId: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  category: 'workflow_attachment' | 'profile_image' | 'document' | 'temporary';
  workflowId?: string;
  executionId?: string;
  isPublic: boolean;
  expiresAt?: Date;
  downloadCount: number;
  lastAccessedAt?: Date;
  createdAt: Date;
}

export interface StorageQuota {
  partnerId: string;
  totalLimit: number;
  usedSpace: number;
  fileCount: number;
  lastCalculatedAt: Date;
  warningThreshold: number;
  isOverLimit: boolean;
}

// ============================================================================
// BILLING & SUBSCRIPTION VARIABLES
// ============================================================================

export interface Invoice {
  id: string;
  partnerId: string;
  invoiceNumber: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  amount: number;
  currency: string;
  taxAmount?: number;
  discountAmount?: number;
  subtotal: number;
  lineItems: InvoiceLineItem[];
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  issueDate: Date;
  dueDate: Date;
  paidAt?: Date;
  stripeInvoiceId?: string;
  paymentIntentId?: string;
  createdAt: Date;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  type: 'subscription' | 'usage' | 'one_time' | 'discount';
}

export interface UsageRecord {
  id: string;
  partnerId: string;
  type: 'workflow_execution' | 'api_call' | 'storage' | 'ai_generation';
  quantity: number;
  unit: string;
  unitPrice?: number;
  totalCost?: number;
  billingPeriod: string;
  metadata?: any;
  recordedAt: Date;
}

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingInterval: 'monthly' | 'yearly';
  features: PlanFeature[];
  limits: PlanLimit[];
  isActive: boolean;
  isPopular: boolean;
  stripeProductId?: string;
  stripePriceId?: string;
  createdAt: Date;
}

export interface PlanFeature {
  name: string;
  description: string;
  included: boolean;
  limit?: number;
}

export interface PlanLimit {
  resource: string;
  limit: number;
  unit: string;
}

// ============================================================================
// WEBHOOK & EVENT VARIABLES
// ============================================================================

export interface WebhookEndpoint {
  id: string;
  partnerId: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  failureCount: number;
  lastSuccessAt?: Date;
  lastFailureAt?: Date;
  createdAt: Date;
}

export interface WebhookDelivery {
  id: string;
  endpointId: string;
  eventType: string;
  payload: any;
  status: 'pending' | 'delivered' | 'failed';
  httpStatus?: number;
  responseBody?: string;
  attemptCount: number;
  nextRetryAt?: Date;
  createdAt: Date;
  deliveredAt?: Date;
}

export interface SystemEvent {
  id: string;
  type: string;
  data: any;
  partnerId?: string;
  userId?: string;
  workflowId?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  processed: boolean;
  createdAt: Date;
}

// ============================================================================
// UTILITY & HELPER TYPES
// ============================================================================

export interface FirebaseTimestamp {
  seconds: number;
  nanoseconds: number;
}

export interface LogicalCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'starts_with' | 'ends_with' | 'in' | 'not_in' | 'exists' | 'not_exists';
  value: any;
  logicalOperator?: 'AND' | 'OR';
  children?: LogicalCondition[];
}

export interface DataTransformation {
  type: 'map' | 'filter' | 'reduce' | 'sort' | 'group' | 'format' | 'calculate';
  field?: string;
  operation: string;
  parameters?: any;
}

export interface DataValidation {
  field: string;
  rules: ValidationRule[];
  required: boolean;
  onFailure: 'error' | 'warning' | 'skip';
}

export interface DataMapping {
  sourceField: string;
  targetField: string;
  transformation?: string;
  defaultValue?: any;
}

export interface ResponseMapping {
  successField?: string;
  dataField?: string;
  errorField?: string;
  transformations?: DataTransformation[];
}

export interface APIAuthentication {
  type: 'none' | 'api_key' | 'bearer_token' | 'basic_auth' | 'oauth2';
  credentials: Record<string, any>; // Encrypted
}

export interface EscalationRule {
  condition: string;
  escalateTo: string;
  delayMinutes: number;
  notificationMessage: string;
}

// ============================================================================
// SECURITY RULES VARIABLES
// ============================================================================

export interface ResourceAccess {
  resource: string;
  action: 'read' | 'write' | 'delete' | 'admin';
}

export interface MultiWorkspaceCustomClaims {
  role: 'Super Admin' | 'Admin' | 'partner_admin' | 'employee';
  
  // Legacy single workspace support (backward compatibility)
  partnerId?: string;
  tenantId?: string;
  
  // NEW: Multi-workspace support
  partnerIds?: string[]; // Array of partner IDs user has access to
  workspaces?: WorkspaceAccess[]; // Detailed workspace access info
  
  // Current active workspace (for UI context)
  activePartnerId?: string;
  activeTenantId?: string;
}

export interface WorkspaceAccess {
  partnerId: string;
  tenantId: string;
  role: 'partner_admin' | 'employee';
  permissions: string[];
  status: 'active' | 'invited' | 'suspended';
  partnerName: string;
  partnerAvatar?: string | null;
}

// Enhanced FirebaseAuthUser with multi-workspace support
export interface MultiWorkspaceFirebaseAuthUser extends Omit<FirebaseAuthUser, 'customClaims'> {
  customClaims?: MultiWorkspaceCustomClaims;
}

export interface WorkspaceInvitation {
  id?: string;
  email?: string;
  phoneNumber?: string; // Support for phone-based invitations
  partnerId: string;
  tenantId: string;
  role: 'partner_admin' | 'employee';
  invitedBy: string; // User ID
  invitedAt: FirebaseTimestamp;
  expiresAt: any; // Allow for serverTimestamp
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  inviteCode?: string; // Optional invite code for self-service joining
  
  // Partner details for the invitation
  partnerName: string;
  inviterName: string;
  inviterEmail: string;
}

// Multi-workspace authentication state
export interface MultiWorkspaceAuthState extends AuthState {
  user: MultiWorkspaceFirebaseAuthUser | null;
  currentWorkspace: WorkspaceAccess | null;
  availableWorkspaces: WorkspaceAccess[];
  
  // Workspace switching
  switchWorkspace: (partnerId: string) => Promise<boolean>;
  refreshWorkspaces: () => Promise<void | (() => void)>;
  
  // Multi-workspace permissions
  hasAccessToPartner: (partnerId: string) => boolean;
  isPartnerAdminFor: (partnerId: string) => boolean;
  canModifyPartner: (partnerId: string) => boolean;
}

export type PhoneAuthResult = {
    success: boolean;
    message: string;
    userId?: string;
    workspaces?: WorkspaceAccess[];
    hasMultipleWorkspaces?: boolean;
};

// ============================================================================
// WHATSAPP MESSAGING TYPES
// ============================================================================

export interface WhatsAppMessage extends ChatMessage {
  whatsappMetadata: {
    twilioSid?: string;
    twilioStatus?: 'queued' | 'sent' | 'delivered' | 'read' | 'failed' | 'undelivered';
    to: string; // WhatsApp number in format: whatsapp:+1234567890
    from: string; // Twilio WhatsApp number
    errorCode?: string;
    errorMessage?: string;
    numMedia?: number;
    mediaUrls?: string[];
  };
  direction: 'outbound' | 'inbound';
  platform: 'whatsapp';
}

export interface WhatsAppConversation extends Conversation {
  platform: 'whatsapp';
  customerPhone: string; // WhatsApp number
  customerName?: string;
  lastWhatsAppStatus?: 'active' | 'opt_out' | 'blocked';
}

export interface TwilioWebhookPayload {
  MessageSid: string;
  AccountSid: string;
  MessagingServiceSid?: string;
  From: string; // whatsapp:+1234567890
  To: string; // whatsapp:+1234567890
  Body: string;
  NumMedia?: string;
  MediaUrl0?: string;
  MediaContentType0?: string;
  SmsStatus?: string;
  MessageStatus?: string;
  ApiVersion?: string;
  SmsSid?: string;
}

export interface SendWhatsAppMessageInput {
  partnerId: string;
  to: string; // Phone number without whatsapp: prefix
  message: string;
  conversationId?: string;
  mediaUrl?: string;
}

export interface SendWhatsAppMessageResult {
  success: boolean;
  message: string;
  messageId?: string;
  twilioSid?: string;
  conversationId?: string;
}

// ============================================================================
// SMS MESSAGING TYPES
// ============================================================================

export interface SMSMessage extends ChatMessage {
  smsMetadata: {
    twilioSid?: string;
    twilioStatus?: 'queued' | 'sent' | 'delivered' | 'failed' | 'undelivered';
    to: string; // Phone number in E.164 format: +1234567890
    from: string; // Twilio phone number
    errorCode?: string;
    errorMessage?: string;
  };
  direction: 'outbound' | 'inbound';
  platform: 'sms';
}

export interface SMSConversation extends Conversation {
  platform: 'sms';
  customerPhone: string; // Phone number
  customerName?: string;
  lastSMSStatus?: 'active' | 'opt_out' | 'blocked';
}

export interface TwilioSMSWebhookPayload {
  MessageSid: string;
  AccountSid: string;
  MessagingServiceSid?: string;
  From: string; // +1234567890
  To: string; // +1234567890
  Body: string;
  NumMedia?: string;
  MediaUrl0?: string;
  MediaContentType0?: string;
  SmsStatus?: string;
  MessageStatus?: string;
  ApiVersion?: string;
  SmsSid?: string;
}

export interface SendSMSInput {
  partnerId: string;
  to: string; // Phone number in E.164 format
  message: string;
  conversationId?: string;
}

export interface SendSMSResult {
  success: boolean;
  message: string;
  messageId?: string;
  twilioSid?: string;
  conversationId?: string;
}
