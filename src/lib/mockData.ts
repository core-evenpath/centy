
// src/lib/mockData.ts
import { Bot, CheckCircle, Database, FileText, Globe, Mail, Target, Users, Zap, Shield, Building, UserPlus, BarChart3, Activity, AlertTriangle, Send, Copy, ExternalLink, PlayCircle, PauseCircle, RotateCcw, Cpu, Network, Layers, Clock } from "lucide-react";
import type { Industry, Partner, WorkflowTemplate, AdminUser } from './types';

export const industries: Industry[] = [
    { 
      id: 'd8f8f8f8-f8f8-f8f8-f8f8-f8f8f8f8f8f8',
      name: 'Property Management', 
      slug: 'property-management',
      icon: '🏢',
      description: 'Manage rental properties, tenants, and maintenance',
      workflowPatterns: [],
      successMetrics: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    { 
      id: 'd8f8f8f8-f8f8-f8f8-f8f8-f8f8f8f8f8f9',
      name: 'HVAC Services',
      slug: 'hvac-services',
      icon: '🔧',
      description: 'Heating, ventilation, and air conditioning',
      workflowPatterns: [],
      successMetrics: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
     { 
      id: 'd8f8f8f8-f8f8-f8f8-f8f8-f8f8f8f8f810',
      name: 'Independent Hotels',
      slug: 'independent-hotels',
      icon: '🏨',
      description: 'Boutique and independent hotel operations',
      workflowPatterns: [],
      successMetrics: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    { 
      id: 'd8f8f8f8-f8f8-f8f8-f8f8-f8f8f8f8f811',
      name: 'E-commerce',
      slug: 'ecommerce',
      icon: '🛒',
      description: 'Online retail and digital storefronts',
      workflowPatterns: [],
      successMetrics: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'd8f8f8f8-f8f8-f8f8-f8f8-f8f8f8f8f812',
      name: 'Healthcare Clinics',
      slug: 'healthcare-clinics',
      icon: '⚕️',
      description: 'Private medical, dental, and wellness clinics',
      workflowPatterns: [],
      successMetrics: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'd8f8f8f8-f8f8-f8f8-f8f8-f8f8f8f8f813',
      name: 'Financial Services',
      slug: 'financial-services',
      icon: '💼',
      description: 'Banking, investment, and insurance services',
      workflowPatterns: [],
      successMetrics: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'd8f8f8f8-f8f8-f8f8-f8f8-f8f8f8f8f814',
      name: 'Real Estate Agencies',
      slug: 'real-estate-agencies',
      icon: '🏘️',
      description: 'Agencies for buying, selling, and renting properties',
      workflowPatterns: [],
      successMetrics: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'd8f8f8f8-f8f8-f8f8-f8f8-f8f8f8f8f815',
      name: 'Software as a Service (SaaS)',
      slug: 'saas',
      icon: '💻',
      description: 'Subscription-based software businesses',
      workflowPatterns: [],
      successMetrics: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'd8f8f8f8-f8f8-f8f8-f8f8-f8f8f8f8f816',
      name: 'Restaurants & Cafes',
      slug: 'restaurants-cafes',
      icon: '🍔',
      description: 'Food and beverage service businesses',
      workflowPatterns: [],
      successMetrics: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'd8f8f8f8-f8f8-f8f8-f8f8-f8f8f8f8f817',
      name: 'Marketing Agencies',
      slug: 'marketing-agencies',
      icon: '📢',
      description: 'Digital marketing, advertising, and creative agencies',
      workflowPatterns: [],
      successMetrics: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'd8f8f8f8-f8f8-f8f8-f8f8-f8f8f8f8f818',
      name: 'Education & Tutoring',
      slug: 'education-tutoring',
      icon: '🎓',
      description: 'Online courses, tutoring centers, and educational institutions',
      workflowPatterns: [],
      successMetrics: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'd8f8f8f8-f8f8-f8f8-f8f8-f8f8f8f8f819',
      name: 'Logistics & Transportation',
      slug: 'logistics-transportation',
      icon: '🚚',
      description: 'Supply chain, freight, and transportation services',
      workflowPatterns: [],
      successMetrics: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
];

export const mockAdminUsers: AdminUser[] = [
  {
    id: '1',
    name: 'Super Admin',
    email: 'core@socket.com',
    role: 'Super Admin',
    status: 'active',
    avatar: 'https://placehold.co/40x40.png?text=SA',
    lastActive: 'Online',
    joinedDate: '2023-01-01',
    permissions: ['all']
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@flowfactory.com',
    role: 'Admin',
    status: 'active',
    avatar: 'https://placehold.co/40x40.png?text=JS',
    lastActive: '2 hours ago',
    joinedDate: '2023-03-15',
    permissions: ['read', 'write', 'partners-manage', 'workflows-manage']
  },
  {
    id: '3',
    name: 'John Doe',
    email: 'john.doe@flowfactory.com',
    role: 'Admin',
    status: 'invited',
    avatar: 'https://placehold.co/40x40.png?text=JD',
    lastActive: 'Never',
    joinedDate: '2024-07-30',
    permissions: ['read', 'partners-view']
  },
];


// Mock Data for Admin
export const mockPartners: Partner[] = [
  {
    id: "Pmx3vlcyczT9laCSr3Xq",
    name: "Brew & BonBon Cafe",
    businessName: "Brew & BonBon Cafe",
    contactPerson: "Sivagami Ravi",
    email: "sigiravi2@gmail.com",
    phone: "9655574591",
    status: "active",
    plan: "Enterprise",
    joinedDate: "2025-08-01",
    industry: null,
    businessSize: "small",
    employeeCount: 3,
    monthlyRevenue: "50000",
    location: { city: "New York", state: "NY" },
    aiProfileCompleteness: 90,
    stats: {
      activeWorkflows: 12,
      totalExecutions: 12,
      successRate: 98,
      avgROI: 250,
      timeSaved: "400 hours/month",
    },
    businessProfile: null,
    aiMemory: null,
  }
];

export const mockWorkflowTemplates: WorkflowTemplate[] = [
   {
    id: '1',
    title: "Cafe Daily Operations",
    description: "Complete daily workflow for cafe management from opening to closing",
    category: "Hospitality",
    complexity: "simple",
    steps: [],
    aiAgents: 2,
    estimatedTime: "8 hours",
    usageCount: 45,
    lastModified: "2024-07-30",
    tags: ["Daily Operations", "Food Service", "Inventory"],
    icon: "☕",
    templateType: 'custom',
    isFeatured: false,
    successRate: 88,
    avgSetupTimeHours: 4,
    roiPercentage: 150,
    apiIntegrations: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    title: "Customer Support AI Pipeline",
    description: "Multi-stage AI-powered customer support with escalation and sentiment analysis",
    category: "Customer Service",
    complexity: "complex",
    steps: [],
    aiAgents: 5,
    estimatedTime: "2-6 hours",
    usageCount: 128,
    lastModified: "2024-07-28",
    tags: ["AI Support", "Escalation", "Sentiment Analysis"],
    icon: "🎧",
    templateType: 'ai_generated',
    isFeatured: true,
    successRate: 92,
    avgSetupTimeHours: 8,
    roiPercentage: 400,
    apiIntegrations: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    title: "Content Creation & Review",
    description: "AI-assisted content creation workflow with human review and approval",
    category: "Content",
    complexity: "medium",
    steps: [],
    aiAgents: 3,
    estimatedTime: "2-4 hours",
    usageCount: 89,
    lastModified: "2024-07-29",
    tags: ["Content AI", "Review", "Publishing"],
    icon: "✍️",
    templateType: 'custom',
    isFeatured: false,
    successRate: 95,
    avgSetupTimeHours: 3,
    roiPercentage: 250,
    apiIntegrations: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '4',
    title: "Financial Document Processing",
    description: "Complex financial document analysis with multi-model AI verification",
    category: "Finance",
    complexity: "complex",
    steps: [],
    aiAgents: 8,
    estimatedTime: "1-3 hours",
    usageCount: 67,
    lastModified: "2024-07-27",
    tags: ["Finance AI", "Document Analysis", "Compliance"],
    icon: "💰",
    templateType: 'ai_generated',
    isFeatured: false,
    successRate: 98,
    avgSetupTimeHours: 12,
    roiPercentage: 500,
    apiIntegrations: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const mockSystemStats = {
  totalPartners: 15,
  activeWorkflows: 42,
  totalTasks: 12456,
  systemUptime: "99.9%",
  avgResponseTime: "245ms",
  dailyActiveUsers: 342,
  monthlyGrowth: "+23%",
  storageUsed: "2.4TB"
};

export const mockSystemLogs = [
  {
    id: 1,
    timestamp: "2024-07-30 14:30:22",
    level: "info",
    action: "Partner Created",
    user: "admin@socket.com",
    details: "New partner 'StartupHub' created successfully",
    ip: "192.168.1.100"
  },
  {
    id: 2,
    timestamp: "2024-07-30 14:25:15",
    level: "warning",
    action: "Workflow Assignment",
    user: "admin@socket.com",
    details: "Workflow 'Document Review' assigned to TechCorp Industries",
    ip: "192.168.1.100"
  },
  {
    id: 3,
    timestamp: "2024-07-30 14:20:08",
    level: "error",
    action: "API Limit Exceeded",
    user: "system",
    details: "Partner 'Marketing Solutions Ltd' exceeded API rate limit",
    ip: "10.0.0.15"
  }
];

// Mock Data for Partner Admin
export const mockTeamMembers: any[] = [
  {
    id: 1,
    name: "Sarah Wilson",
    email: "sarah@techcorp.com",
    role: "Senior Analyst",
    status: "active",
    avatar: "https://placehold.co/40x40.png?text=SW",
    tasksCompleted: 42,
    avgCompletionTime: "2.3h",
    lastActive: "2 hours ago",
    workspaces: ["Main", "Marketing"],
    skills: ["Document Review", "Data Analysis"],
    joinedDate: "2024-01-15"
  },
  {
    id: 2,
    name: "Mike Chen",
    email: "mike@techcorp.com",
    role: "Process Specialist",
    status: "active",
    avatar: "https://placehold.co/40x40.png?text=MC",
    tasksCompleted: 38,
    avgCompletionTime: "3.1h",
    lastActive: "1 day ago",
    workspaces: ["Main", "Operations"],
    skills: ["Workflow Design", "Quality Control"],
    joinedDate: "2024-02-20"
  },
  {
    id: 3,
    name: "Emma Davis",
    email: "emma@techcorp.com",
    role: "Junior Analyst",
    status: "invited",
    avatar: "https://placehold.co/40x40.png?text=ED",
    tasksCompleted: 0,
    avgCompletionTime: "-",
    lastActive: "Never",
    workspaces: ["Main"],
    skills: [],
    joinedDate: "2024-07-28"
  }
];

export const mockAssignedWorkflows = [
  {
    id: 1,
    title: "Document Review & Approval",
    description: "Complete document review process with AI analysis",
    originalTemplate: "Admin Template - Document Review",
    status: "active",
    isCustomized: true,
    steps: 6,
    assignedWorkers: 3,
    completedTasks: 24,
    pendingTasks: 5,
    avgCompletionTime: "2.4h",
    lastModified: "2024-07-28",
    tags: ["AI Analysis", "Approval", "Document"],
    category: "Document Management"
  },
  {
    id: 2,
    title: "Invoice Processing Pipeline",
    description: "Automated invoice processing with custom approval steps",
    originalTemplate: "Admin Template - Invoice Processing",
    status: "active",
    isCustomized: true,
    steps: 7,
    assignedWorkers: 2,
    completedTasks: 18,
    pendingTasks: 3,
    avgCompletionTime: "45min",
    lastModified: "2024-07-26",
    tags: ["Finance", "Automation", "Approval"],
    category: "Finance"
  },
  {
    id: 3,
    title: "Customer Onboarding Flow",
    description: "Standard customer onboarding workflow",
    originalTemplate: "Admin Template - Customer Onboarding",
    status: "draft",
    isCustomized: false,
    steps: 8,
    assignedWorkers: 0,
    completedTasks: 0,
    pendingTasks: 0,
    avgCompletionTime: "-",
    lastModified: "2024-07-30",
    tags: ["Onboarding", "CRM"],
    category: "Customer Management"
  }
];

export const mockTasks = [
    { id: 1, title: "Review Q4 Marketing Proposal", workflow: "Document Review", priority: "high", status: "assigned", dueDate: "2024-08-10", assignee: "Sarah Wilson", avatar: "https://placehold.co/32x32.png" },
    { id: 2, title: "Verify Client Data: Acme Corp", workflow: "Customer Onboarding", priority: "medium", status: "in_progress", dueDate: "2024-08-12", assignee: "Mike Chen", avatar: "https://placehold.co/32x32.png" },
    { id: 3, title: "Process Invoice #INV-2024-812", workflow: "Invoice Processing", priority: "low", status: "assigned", dueDate: "2024-08-15", assignee: "Emma Davis", avatar: "https://placehold.co/32x32.png" },
    { id: 4, title: "Generate Content Brief for Blog", workflow: "Content Creation", priority: "medium", status: "in_progress", dueDate: "2024-08-11", assignee: "Sarah Wilson", avatar: "https://placehold.co/32x32.png" },
    { id: 5, title: "Submit Final Expense Report", workflow: "Financial Reporting", priority: "high", status: "completed", dueDate: "2024-08-01", assignee: "Mike Chen", avatar: "https://placehold.co/32x32.png" },
    { id: 6, title: "Onboard New Client: Peak Industries", workflow: "Customer Onboarding", priority: "high", status: "assigned", dueDate: "2024-08-09", assignee: "Emma Davis", avatar: "https://placehold.co/32x32.png" },
    { id: 7, title: "Final Approval for Ad Campaign", workflow: "Document Review", priority: "high", status: "awaiting_approval", dueDate: "2024-08-09", assignee: "Partner Admin", avatar: "https://placehold.co/32x32.png" },
    { id: 8, title: "Review Social Media Analytics", workflow: "Marketing Analysis", priority: "low", status: "completed", dueDate: "2024-08-02", assignee: "Sarah Wilson", avatar: "https://placehold.co/32x32.png" },
];

export const mockPendingApprovals = [
  {
    id: 1,
    taskTitle: "Review Marketing Proposal",
    workflow: "Document Review & Approval",
    assignee: "Sarah Wilson",
    submittedAt: "2024-07-30 14:30",
    priority: "high",
    type: "document_review",
    currentStep: "Manager Approval",
    details: "Marketing proposal for Q4 campaign needs final approval"
  },
  {
    id: 2,
    taskTitle: "Process Invoice #INV-2024-789",
    workflow: "Invoice Processing Pipeline",
    assignee: "Mike Chen",
    submittedAt: "2024-07-30 13:15",
    priority: "medium",
    type: "financial_approval",
    currentStep: "Financial Approval",
    details: "Office supplies invoice for $2,450.00"
  },
  {
    id: 3,
    taskTitle: "Client Data Verification",
    workflow: "Customer Onboarding Flow",
    assignee: "Sarah Wilson",
    submittedAt: "2024-07-30 11:45",
    priority: "low",
    type: "data_verification",
    currentStep: "Data Review",
    details: "New client information needs verification"
  }
];

export const mockWorkspaceStats = {
  totalTasks: 156,
  completedTasks: 89,
  pendingApprovals: 12,
  activeWorkers: 8,
  avgCompletionTime: "2.1h",
  successRate: "94%",
  monthlyTasks: "+18%",
  teamEfficiency: "87%"
};

// Data for Workflow Builder
export const aiProviders = [
  { id: 'openai', name: 'OpenAI GPT', models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'], icon: '🤖' },
  { id: 'anthropic', name: 'Claude', models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'], icon: '🧠' },
  { id: 'google', name: 'Gemini', models: ['gemini-pro', 'gemini-pro-vision', 'gemini-ultra'], icon: '⭐' }
];

export const stepTypes = [
  { id: 'ai_agent', name: 'AI Agent', description: 'Use AI to process, analyze, or generate content', icon: Bot, color: 'bg-blue-500' },
  { id: 'human_input', name: 'Human Input', description: 'Collect information from users', icon: Users, color: 'bg-green-500' },
  { id: 'approval', name: 'Approval', description: 'Require human approval before proceeding', icon: CheckCircle, color: 'bg-yellow-500' },
  { id: 'notification', name: 'Notification', description: 'Send alerts via email, SMS, or chat', icon: Mail, color: 'bg-purple-500' },
  { id: 'api_call', name: 'API Call', description: 'Connect to external services and APIs', icon: Globe, color: 'bg-indigo-500' },
  { id: 'condition', name: 'Conditional', description: 'Branch workflow based on conditions', icon: Target, color: 'bg-orange-500' },
  { id: 'data_processing', name: 'Data Processing', description: 'Transform, filter, or validate data', icon: Database, color: 'bg-gray-500' },
  { id: 'file_handling', name: 'File Handling', description: 'Upload, download, or process files', icon: FileText, color: 'bg-pink-500' }
];

export const mockAssignedPartners = [
    { id: 1, name: "TechCorp Industries", members: 45, tasksCompleted: 156, lastUsed: "2 hours ago" },
    { id: 2, name: "Marketing Solutions", members: 28, tasksCompleted: 89, lastUsed: "1 day ago" },
    { id: 3, name: "StartupHub", members: 12, tasksCompleted: 23, lastUsed: "3 days ago" }
];

export const mockStepOverview = [
    { id: 1, name: "Collect Customer Information", type: "human_input", icon: Users, color: "bg-green-500" },
    { id: 2, name: "AI Sentiment Analysis", type: "ai_agent", icon: Bot, color: "bg-blue-500", aiProvider: "OpenAI GPT-4" },
    { id: 3, name: "Manager Approval", type: "approval", icon: CheckCircle, color: "bg-yellow-500" },
    { id: 4, name: "Send Welcome Email", type: "notification", icon: Mail, color: "bg-purple-500" }
];
