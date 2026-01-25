'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Loader2,
  RefreshCw,
  MessageSquare,
  Building2,
  Package,
  HelpCircle,
  Clock,
} from 'lucide-react';
import { chatWithPersonaManagerAction } from '@/actions/business-persona-actions';
import type { BusinessPersona } from '@/lib/business-persona-types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface TestAIResponseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId: string;
  persona: BusinessPersona | null;
}

// Sample customer questions based on common queries
const SAMPLE_QUESTIONS = [
  { icon: Clock, label: 'Opening hours', prompt: "What are your business hours?" },
  { icon: Package, label: 'Products', prompt: "What products or services do you offer?" },
  { icon: Building2, label: 'About you', prompt: "Tell me about your business" },
  { icon: HelpCircle, label: 'Policies', prompt: "What is your return policy?" },
  { icon: MessageSquare, label: 'Contact', prompt: "How can I contact you?" },
];

export default function TestAIResponseModal({
  open,
  onOpenChange,
  partnerId,
  persona,
}: TestAIResponseModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset messages when modal opens
  useEffect(() => {
    if (open) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `Hi! I'm the AI assistant for ${persona?.identity?.name || 'your business'}. Ask me anything a customer might ask, and I'll respond using your business profile data.\n\nTry one of the sample questions below, or type your own!`,
          timestamp: new Date(),
        },
      ]);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, persona?.identity?.name]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (messageOverride?: string) => {
    const messageText = messageOverride || input.trim();
    if (!messageText || isLoading || !persona) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build message history
      const messageHistory = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }));
      messageHistory.push({ role: 'user', content: messageText });

      // Add system context to simulate customer interaction
      const customerContext = `[SIMULATION MODE] A customer is asking: "${messageText}".
Respond as if you are the AI customer support assistant for this business.
Use ONLY the information available in the business profile.
Be helpful, concise, and match the configured voice tone.
If you don't have specific information, politely suggest they contact the business directly.`;

      const result = await chatWithPersonaManagerAction(
        partnerId,
        [{ role: 'user', content: customerContext }],
        persona
      );

      if (result.success && result.response) {
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: result.response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered an error generating a response. Please try again.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${error.message || 'Something went wrong'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Hi! I'm the AI assistant for ${persona?.identity?.name || 'your business'}. Ask me anything a customer might ask, and I'll respond using your business profile data.\n\nTry one of the sample questions below, or type your own!`,
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] max-h-[700px] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Bot className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <DialogTitle>Test AI Response</DialogTitle>
              <DialogDescription>
                See how your AI responds to customer questions
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-indigo-600" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[80%] rounded-xl px-4 py-2.5',
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-900'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p
                    className={cn(
                      'text-xs mt-1',
                      message.role === 'user' ? 'text-indigo-200' : 'text-slate-400'
                    )}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-slate-600" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="bg-slate-100 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Thinking...
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Sample Questions */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2">
            <p className="text-xs font-medium text-slate-500 mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_QUESTIONS.map((q, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs h-8"
                  onClick={() => handleSend(q.prompt)}
                  disabled={isLoading}
                >
                  <q.icon className="w-3.5 h-3.5" />
                  {q.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="px-4 py-3 border-t bg-white">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              className="flex-shrink-0"
              title="Reset conversation"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask a customer question..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Data Source Indicator */}
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <Sparkles className="w-3 h-3" />
            <span>
              Responses powered by your business profile data
              {persona?.setupProgress?.overallPercentage !== undefined && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {persona.setupProgress.overallPercentage}% profile data
                </Badge>
              )}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
