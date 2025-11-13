// Mock RAG service to simulate conversation history queries
export interface RAGSuggestion {
    suggestedReply: string;
    confidence: number;
    reasoning: string;
    sources: Array<{
      type: 'conversation' | 'document';
      name: string;
      excerpt: string;
      relevance: number;
    }>;
    alternativeReplies?: string[];
  }
  
  interface MockConversationHistory {
    [customerPhone: string]: Array<{
      timestamp: string;
      sender: 'customer' | 'partner';
      message: string;
    }>;
  }
  
  // Mock conversation history database
  const MOCK_CONVERSATIONS: MockConversationHistory = {
    '+1234567890': [
      { timestamp: '2025-11-01 10:23', sender: 'customer', message: 'Hi, what are your rates?' },
      { timestamp: '2025-11-01 10:25', sender: 'partner', message: 'Our rates start at 2.5% for standard accounts. We also offer volume discounts for family accounts.' },
      { timestamp: '2025-11-01 10:30', sender: 'customer', message: 'That sounds good. How do I get started?' },
      { timestamp: '2025-11-01 10:32', sender: 'partner', message: 'Great! You can start by filling out our online application at app.centy.dev/apply or I can send you the forms via email.' },
      { timestamp: '2025-11-05 14:15', sender: 'customer', message: 'Do you offer family accounts?' },
      { timestamp: '2025-11-05 14:17', sender: 'partner', message: 'Yes! We have family account packages that include up to 5 members with a 15% discount on management fees.' },
    ],
    '+1987654321': [
      { timestamp: '2025-11-10 09:00', sender: 'customer', message: 'I need help with my account' },
      { timestamp: '2025-11-10 09:02', sender: 'partner', message: 'I\'d be happy to help! What specific issue are you experiencing?' },
      { timestamp: '2025-11-10 09:05', sender: 'customer', message: 'I can\'t log into the portal' },
      { timestamp: '2025-11-10 09:07', sender: 'partner', message: 'Let me help you reset your password. I\'ll send you a reset link to your email on file.' },
    ],
  };
  
  // Mock knowledge base documents
  const MOCK_DOCUMENTS = [
    {
      name: 'Pricing_Policy_2025.pdf',
      content: 'Standard rates: 2.5% for individual accounts, 2.0% for family accounts. Volume discounts available for portfolios over $500K. Weekend consultations available by appointment.',
    },
    {
      name: 'Office_Hours_Policy.pdf',
      content: 'Office hours: Monday-Friday 9 AM - 5 PM. Saturday 9 AM - 2 PM. Sunday by appointment only. After-hours emergency line: 1-800-555-0123.',
    },
    {
      name: 'Account_Setup_Guide.pdf',
      content: 'New account setup: 1) Complete online application 2) Upload ID documents 3) Schedule onboarding call 4) Fund initial deposit. Average setup time: 3-5 business days.',
    },
  ];
  
  // Simulate RAG query with delay
  export async function getMockRAGSuggestion(
    customerPhone: string,
    incomingMessage: string,
    conversationContext?: string[]
  ): Promise<RAGSuggestion> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
  
    const customerHistory = MOCK_CONVERSATIONS[customerPhone] || [];
    const normalizedMessage = incomingMessage.toLowerCase();
  
    // Pattern matching for different query types
    if (normalizedMessage.includes('rate') || normalizedMessage.includes('price') || normalizedMessage.includes('cost')) {
      return {
        suggestedReply: "Our standard rates are 2.5% for individual accounts and 2.0% for family accounts. We also offer volume discounts for portfolios over $500K. Based on our previous conversation, I know you were interested in family accounts - would you like me to provide more details on that package?",
        confidence: 0.92,
        reasoning: "Customer has asked about pricing before on Nov 1st and showed interest in family accounts on Nov 5th. Combined with pricing policy document.",
        sources: [
          {
            type: 'conversation',
            name: 'Previous conversation (Nov 1, 2025)',
            excerpt: 'Customer asked: "Hi, what are your rates?" We responded with standard pricing.',
            relevance: 0.95,
          },
          {
            type: 'conversation',
            name: 'Previous conversation (Nov 5, 2025)',
            excerpt: 'Customer asked: "Do you offer family accounts?" We confirmed availability with 15% discount.',
            relevance: 0.88,
          },
          {
            type: 'document',
            name: 'Pricing_Policy_2025.pdf',
            excerpt: 'Standard rates: 2.5% for individual accounts, 2.0% for family accounts...',
            relevance: 0.90,
          },
        ],
        alternativeReplies: [
          "Our rates start at 2.5% for standard accounts. Since you previously asked about family accounts, I should mention we offer those at 2.0% with additional member discounts.",
          "Based on your interest in family accounts from our last conversation, I'd recommend our family package at 2.0% which includes up to 5 members.",
        ],
      };
    }
  
    if (normalizedMessage.includes('hour') || normalizedMessage.includes('open') || normalizedMessage.includes('weekend') || normalizedMessage.includes('saturday') || normalizedMessage.includes('sunday')) {
      return {
        suggestedReply: "We're open Monday-Friday 9 AM - 5 PM, and Saturday 9 AM - 2 PM. Sunday appointments are available upon request. Would you like to schedule a time to come in?",
        confidence: 0.95,
        reasoning: "Direct question about hours. High confidence match with office hours policy document.",
        sources: [
          {
            type: 'document',
            name: 'Office_Hours_Policy.pdf',
            excerpt: 'Office hours: Monday-Friday 9 AM - 5 PM. Saturday 9 AM - 2 PM. Sunday by appointment only.',
            relevance: 0.98,
          },
        ],
        alternativeReplies: [
          "Our regular hours are Monday-Friday 9 AM - 5 PM. We're also open Saturdays until 2 PM!",
          "Yes, we have Saturday hours from 9 AM - 2 PM. Would that work for you?",
        ],
      };
    }
  
    if (normalizedMessage.includes('start') || normalizedMessage.includes('sign up') || normalizedMessage.includes('apply') || normalizedMessage.includes('open account')) {
      return {
        suggestedReply: "Great! Getting started is easy. Based on our previous discussions about pricing and family accounts, I can help you begin the application process. You can either complete the online application at app.centy.dev/apply, or I can email you the forms directly. Which would you prefer?",
        confidence: 0.88,
        reasoning: "Customer previously showed interest in rates and family accounts, now asking about setup. Context from Nov 1st conversation where they asked 'How do I get started?'",
        sources: [
          {
            type: 'conversation',
            name: 'Previous conversation (Nov 1, 2025)',
            excerpt: 'Customer asked: "How do I get started?" We provided application options.',
            relevance: 0.93,
          },
          {
            type: 'document',
            name: 'Account_Setup_Guide.pdf',
            excerpt: 'New account setup: 1) Complete online application 2) Upload ID documents 3) Schedule onboarding call...',
            relevance: 0.85,
          },
        ],
        alternativeReplies: [
          "You can start by filling out our online application at app.centy.dev/apply. The whole process takes about 3-5 business days.",
          "I'd be happy to help you get started! Let me send you the application forms via email. What's the best email address to use?",
        ],
      };
    }
  
    if (normalizedMessage.includes('help') || normalizedMessage.includes('issue') || normalizedMessage.includes('problem')) {
      return {
        suggestedReply: "I'm here to help! Could you please let me know what specific issue you're experiencing? That way I can assist you more effectively.",
        confidence: 0.75,
        reasoning: "Generic help request. No specific context to provide detailed answer.",
        sources: [
          {
            type: 'conversation',
            name: 'Best practices',
            excerpt: 'When customers request help without specifics, ask clarifying questions.',
            relevance: 0.70,
          },
        ],
        alternativeReplies: [
          "I'd be happy to help! What can I assist you with today?",
          "Of course! Please describe the issue you're facing and I'll do my best to resolve it.",
        ],
      };
    }
  
    // Default/generic response
    return {
      suggestedReply: "Thank you for reaching out! I'd be happy to help you with that. Could you provide a bit more detail so I can give you the most accurate information?",
      confidence: 0.65,
      reasoning: "Generic inquiry. No clear match in conversation history or documents. Requesting more information.",
      sources: [
        {
          type: 'conversation',
          name: 'General context',
          excerpt: `Customer has ${customerHistory.length} previous interactions with us.`,
          relevance: 0.60,
        },
      ],
      alternativeReplies: [
        "Thanks for your message! I want to make sure I give you accurate information. Can you tell me a bit more about what you're looking for?",
        "I appreciate you reaching out. To better assist you, could you provide some additional details?",
      ],
    };
  }
  
  // Get conversation summary for display
  export function getMockConversationSummary(customerPhone: string): string {
    const history = MOCK_CONVERSATIONS[customerPhone];
    if (!history || history.length === 0) {
      return "No previous conversation history.";
    }
  
    const topics = [];
    const messages = history.map(h => h.message.toLowerCase()).join(' ');
  
    if (messages.includes('rate') || messages.includes('price')) topics.push('pricing');
    if (messages.includes('family account')) topics.push('family accounts');
    if (messages.includes('start') || messages.includes('apply')) topics.push('account setup');
    if (messages.includes('help') || messages.includes('issue')) topics.push('support');
  
    return `${history.length} previous messages. Topics discussed: ${topics.join(', ') || 'general inquiries'}`;
  }
  
  // Check if we have history for this customer
  export function hasMockConversationHistory(customerPhone: string): boolean {
    return !!MOCK_CONVERSATIONS[customerPhone] && MOCK_CONVERSATIONS[customerPhone].length > 0;
  }