// src/lib/types.ts
// ============================================================================
// FIREBASE BACKEND VARIABLES
// ============================================================================
import { z } from 'zod';
import type { UserInfo } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';


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
    [key: string]: any;
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
  id: string;
  uid?: string;
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
  lastAccessedAt?: FirebaseTimestamp;
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
  createdAt?: any | string;
  updatedAt?: any | string;
  tasksCompleted?: number;
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
  billingEmail?: string;
  paymentMethod?: PaymentMethod;
}

export interface PaymentMethod {
  type: 'card' | 'bank_account';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

export interface Industry {
  id: string;
  name: string;
  description: string;
  commonPainPoints: string[];
  typicalWorkflows: string[];
  keyMetrics: string[];
  regulatoryConsiderations: string[];
}

export interface BusinessProfile {
  goals: string[];
  challenges: string[];
  currentProcesses: CurrentProcess[];
  tools: Tool[];
  team: TeamComposition;
}

export interface CurrentProcess {
  name: string;
  description: string;
  timeSpent: string;
  frequency: string;
  painPoints: string[];
  desiredOutcome: string;
}

export interface Tool {
  name: string;
  category: string;
  integrationType: 'native' | 'api' | 'manual';
  isConnected: boolean;
}

export interface TeamComposition {
  totalSize: number;
  roles: TeamRole[];
}

export interface TeamRole {
  title: string;
  count: number;
  responsibilities: string[];
}

export interface AIMemory {
  lastUpdated: Date;
  preferences: {
    communicationStyle: string;
    decisionMakingStyle: string;
    priorities: string[];
  };
  learnings: {
    successfulPatterns: Pattern[];
    challenges: Pattern[];
    improvements: Pattern[];
  };
  recommendations: string[];
}

export interface Pattern {
  context: string;
  observation: string;
  confidence: number;
  frequency: number;
  lastSeen: Date;
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
  id: string;
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
  dayOfWeek: number;
  startTime: string;
  endTime: string;
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
  totalExecutions?: number;
  successRate?: number;
  averageExecutionTime?: number;
  errorRate?: number;
  topPerformingWorkflows?: WorkflowStat[];
  bottleneckSteps?: StepStat[];
  teamProductivity?: number;
  averageTaskCompletionTime?: number;
  teamUtilization?: number;
  topPerformers?: TeamMemberStat[];
  timesSaved?: number;
  costReduction?: number;
  revenueGenerated?: number;
  customerSatisfactionImpact?: number;
  activeUsers?: number;
  workflowsCreated?: number;
  apiCallsCount?: number;
  storageUsed?: number;
}

export interface WorkflowStat {
  workflowId: string;
  workflowName: string;
  executionCount: number;
  successRate: number;
  averageTime: number;
}

export interface StepStat {
  stepId: string;
  stepName: string;
  averageTime: number;
  failureRate: number;
}

export interface TeamMemberStat {
  memberId: string;
  memberName: string;
  tasksCompleted: number;
  averageCompletionTime: number;
  qualityScore: number;
}

// ============================================================================
// 11. NOTIFICATIONS & COMMUNICATIONS VARIABLES
// ============================================================================

export interface Notification {
  id: string;
  partnerId: string;
  userId: string;
  type: 'workflow' | 'system' | 'team' | 'billing' | 'integration';
  title: string;
  message: string;
  data: any;
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
  participants: ConversationParticipant[] | string[];
  workflowId?: string;
  isActive: boolean;
  lastMessageAt?: any;
  messageCount: number;
  createdBy: string;
  createdAt: any;
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
  createdAt: any;
  sentAt?: any;
}

export interface Contact {
  id: string;
  partnerId: string;
  name: string;
  phone: string;
  email?: string;
  groups?: string[];
  tags?: string[];
  notes?: string;
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
  isActive?: boolean;
  status?: 'active' | 'inactive';
  lifetimeValue?: string;
  company?: string;
  category?: string;
}

export interface ContactGroup {
  id: string;
  name: string;
  partnerId: string;
  description?: string;
  contactCount: number;
  createdAt?: any;
}

export interface TradingPick {
  id?: string;
  partnerId: string;
  ticker: string;
  companyName: string;
  sector: string;
  action: 'buy' | 'sell' | 'hold';
  thesis: string;
  priceTarget: string;
  currentPrice?: string;
  timeframe: string;
  riskLevel: 'low' | 'medium' | 'high';
  keyRisks?: string;
  catalysts?: string;
  marketContext?: string;
  sectorTrends?: string;
  ideaType?: string;
  imageUrl?: string;
  createdAt?: any;
  updatedAt?: any;
  broadcasted?: boolean;
  broadcastHistory?: BroadcastRecord[];
  views?: number;
  analystNotes?: string;
  lastBroadcastAt?: any;
}

export interface BroadcastRecord {
  id: string;
  partnerId: string;
  partnerName: string;
  method: 'whatsapp' | 'sms';
  message: string;
  mediaUrl?: string;
  ideaId?: string;
  ideaDetails?: {
    ideaId: string;
    ticker: string;
    companyName: string;
    action: string;
  };
  recipientCount: number;
  recipients: string[];
  status: 'processing' | 'completed';
  successCount: number;
  failedCount: number;
  results: Array<{
    phoneNumber: string;
    status: 'success' | 'failed';
    messageSid?: string | null;
    error?: string;
  }>;
  createdAt: any;
  completedAt?: any;
}

// ============================================================================
// WHATSAPP MESSAGING TYPES
// ============================================================================

export interface WhatsAppMessage extends ChatMessage {
  direction: 'outbound' | 'inbound';
  platform: 'whatsapp';
  whatsappMetadata: {
    twilioSid?: string;
    twilioStatus?: 'queued' | 'sent' | 'delivered' | 'read' | 'failed' | 'undelivered' | 'received';
    to: string;
    from: string;
    errorCode?: string | null;
    errorMessage?: string | null;
    numMedia?: number;
    mediaUrls?: string[];
  };
}

export interface WhatsAppConversation extends Conversation {
  platform: 'whatsapp';
  customerPhone: string;
  customerName?: string;
  lastWhatsAppStatus?: 'active' | 'opt_out' | 'blocked';
  recentMessages?: WhatsAppMessage[];
  contactId?: string;
}

export interface TwilioWebhookPayload {
  MessageSid: string;
  AccountSid: string;
  MessagingServiceSid?: string;
  From: string;
  To: string;
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
  to: string;
  message?: string;
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
  direction: 'outbound' | 'inbound';
  platform: 'sms';
  smsMetadata: {
    twilioSid?: string;
    twilioStatus?: 'queued' | 'sent' | 'delivered' | 'failed' | 'undelivered' | 'received';
    to: string;
    from: string;
    errorCode?: string | null;
    errorMessage?: string | null;
  };
}

export interface SMSConversation extends Conversation {
  platform: 'sms';
  customerPhone: string;
  customerName?: string;
  lastSMSStatus?: 'active' | 'opt_out' | 'blocked';
  recentMessages?: SMSMessage[];
  contactId?: string;
}

export interface TwilioSMSWebhookPayload {
  MessageSid: string;
  AccountSid: string;
  MessagingServiceSid?: string;
  From: string;
  To: string;
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
  to: string;
  message?: string;
  conversationId?: string;
  mediaUrl?: string;
}

export interface SendSMSResult {
  success: boolean;
  message: string;
  messageId?: string;
  twilioSid?: string;
  conversationId?: string;
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
// MULTI-WORKSPACE & SECURITY VARIABLES
// ============================================================================

export interface MultiWorkspaceCustomClaims {
  role: 'Super Admin' | 'Admin' | 'partner_admin' | 'employee';
  partnerId?: string;
  tenantId?: string;
  partnerIds?: string[];
  workspaces?: WorkspaceAccess[];
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

export interface MultiWorkspaceFirebaseAuthUser extends Omit<FirebaseAuthUser, 'customClaims'> {
  customClaims?: MultiWorkspaceCustomClaims;
}

export interface WorkspaceInvitation {
  id?: string;
  email?: string;
  phoneNumber?: string;
  partnerId: string;
  tenantId: string;
  role: 'partner_admin' | 'employee';
  invitedBy: string;
  invitedAt: FirebaseTimestamp;
  expiresAt: any;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  inviteCode?: string;
  partnerName: string;
  inviterName: string;
  inviterEmail: string;
}

export interface MultiWorkspaceAuthState extends AuthState {
  user: MultiWorkspaceFirebaseAuthUser | null;
  currentWorkspace: WorkspaceAccess | null;
  availableWorkspaces: WorkspaceAccess[];
  switchWorkspace: (partnerId: string) => Promise<boolean>;
  refreshWorkspaces: () => Promise<void | (() => void)>;
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
// API INTEGRATION VARIABLES
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

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'email' | 'url' | 'custom';
  value?: any;
  errorMessage: string;
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
  credentials: Record<string, any>;
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
  credentials: Record<string, any>;
}

export interface EscalationRule {
  condition: string;
  escalateTo: string;
  delayMinutes: number;
  notificationMessage: string;
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
// RESOURCE ACCESS VARIABLES
// ============================================================================

export interface ResourceAccess {
  resource: string;
  action: 'read' | 'write' | 'delete' | 'admin';
}

// ============================================================================
// VAULT & FILE SEARCH TYPES
// ============================================================================
export interface VaultFile {
  id: string;
  name: string;
  displayName: string;
  mimeType: string;
  sizeBytes: number;
  uri: string;
  state: 'PROCESSING' | 'ACTIVE' | 'FAILED';
  uploadedAt: string;
  uploadedBy: string;
  uploadedByEmail?: string;
  partnerId: string;
  geminiFileUri?: string;
  geminiFileName?: string;
  createdAt: string;
  errorMessage?: string;
  firebaseStoragePath: string;
  metadata?: Record<string, any>;
  sourceType?: 'upload' | 'training' | 'conversation';
  conversationId?: string;
  conversationPlatform?: 'sms' | 'whatsapp';
  customerPhone?: string;
  customerName?: string;
  processingStep?: number;
  processingDescription?: string;
  ragMetadata?: {
    chunkSize?: number;
    chunkOverlap?: number;
    embeddingModel?: string;
    embeddingDimension?: number;
    estimatedChunks?: number;
    actualChunks?: number;
    actualEmbeddings?: number;
    extractedTextLength?: number;
    indexedAt?: string;
    processingTimeMs?: number;
    processingStartedAt?: string;
    processingCompletedAt?: string;
    hasMetadata?: boolean;
    metadataKeys?: string[];
  };
  extractedText?: string;
  trainingData?: string;
}

export interface FileSearchStore {
  id: string;
  name: string;
  displayName: string;
  partnerId: string;
  createdAt: string;
  updatedAt: string;
  fileCount: number;
  totalSizeBytes: number;
  state: 'ACTIVE' | 'INACTIVE';
}

export interface VaultQuery {
  id: string;
  query: string;
  response: string;
  partnerId: string;
  userId: string;
  selectedFileIds?: string[];
  selectedFileNames?: string[];
  provider?: 'gemini' | 'claude' | 'gemini-rag-haiku' | 'gemini-rag-sonnet-3.5' | 'gemini-rag-sonnet-4.5';
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
  };
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheCreationTokens?: number;
  chunksBeforeFilter?: number;
  chunksAfterFilter?: number;
  metadataFilterUsed?: string;
  createdAt: string;
}

export interface GroundingChunk {
  retrievedContext?: {
    text?: string;
    title?: string;
    uri?: string;
  };
}

export interface ConversationSyncConfig {
  partnerId: string;
  enabled: boolean;
  strategy: 'immediate' | 'batched' | 'smart';
  batchSize: number;
  batchInterval: number;
  vipCustomers: string[];
  syncInactive: boolean;
}

export interface ConversationSyncJob {
  id: string;
  type: 'conversation-sync';
  partnerId: string;
  conversationId: string;
  platform: 'sms' | 'whatsapp';
  priority: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  createdAt: any;
  processedAt?: any;
  error?: string;
}

export interface RAGQueryResult {
  success: boolean;
  message: string;
  response?: string;
  confidence?: number;
  reasoning?: string;
  sources?: RAGSource[];
  groundingChunks?: GroundingChunk[];
}

export interface RAGSource {
  type: 'conversation' | 'document';
  name: string;
  excerpt: string;
  relevance: number;
}

export type AIModelChoice =
  | 'haiku'
  | 'sonnet-3.5'
  | 'sonnet-4.5'
  | 'gpt-4o-mini'
  | 'gemini-2.5-pro';

export interface PartnerAIConfig {
  responseModel: AIModelChoice;
  updatedAt: string;
  updatedBy: string;
}

export const AI_MODEL_OPTIONS = [
  {
    value: 'haiku' as const,
    label: 'Claude Haiku 3.5',
    description: 'Fastest, Cheapest',
    costPer1000: '$0.001',
    speed: '1-2s',
    provider: 'Anthropic',
  },
  {
    value: 'sonnet-3.5' as const,
    label: 'Claude Sonnet 3.5',
    description: 'Better Quality',
    costPer1000: '$0.005',
    speed: '2-3s',
    provider: 'Anthropic',
  },
  {
    value: 'sonnet-4.5' as const,
    label: 'Claude Sonnet 4.5',
    description: 'Best Quality',
    costPer1000: '$0.015',
    speed: '3-5s',
    provider: 'Anthropic',
  },
  {
    value: 'gpt-4o-mini' as const,
    label: 'GPT-4o Mini',
    description: 'Alternative',
    costPer1000: '$0.002',
    speed: '1-2s',
    provider: 'OpenAI',
  },
  {
    value: 'gemini-2.5-pro' as const,
    label: 'Gemini 2.5 Pro',
    description: 'High Quality, Free',
    costPer1000: 'Free',
    speed: '2-3s',
    provider: 'Google',
  },
] as const;

// ============================================================================
// AI WORKFLOW TYPES
// ============================================================================

export const SuggestWorkflowStepsInputSchema = z.object({
  workflowDescription: z.string(),
});

export type SuggestWorkflowStepsInput = z.infer<typeof SuggestWorkflowStepsInputSchema>;

// Recursive step schema for conditional branches
const BaseStepSchema = z.object({
  type: z.enum(['ai_agent', 'human_input', 'api_call', 'notification', 'conditional_branch']),
  name: z.string(),
  description: z.string(),
});

export type WorkflowStep = z.infer<typeof BaseStepSchema> & {
  branches?: {
    condition: string;
    steps: WorkflowStep[];
  }[];
};

export const WorkflowStepSchema: z.ZodType<WorkflowStep> = BaseStepSchema.extend({
  branches: z.array(z.object({
    condition: z.string(),
    steps: z.lazy(() => z.array(WorkflowStepSchema)),
  })).optional(),
});

export const SuggestWorkflowStepsOutputSchema = z.object({
  name: z.string(),
  description: z.string(),
  steps: z.array(WorkflowStepSchema),
});

export type SuggestWorkflowStepsOutput = z.infer<typeof SuggestWorkflowStepsOutputSchema>;