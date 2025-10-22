"use client";

import React, { useCallback, useState } from 'react';
import { Send, Sparkles, Brain, CheckCircle, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export default function TestAITab() {
  const user = useAuth();
  const { toast } = useToast();
  const [chatInput, setChatInput] = useState('');

  const [isFetchingResponse, setIsFetchingQueryResponse] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>()
  const fetchResponse = useCallback(async (query: string) => {
    try {
      setIsFetchingQueryResponse(true);
      setAiResponse(null);

      const response = await fetch(`/api/thesis-docs/query?query=${query}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.user?.customClaims?.token ?? ""}`
        },
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        toast({
          variant: "destructive",
          title: 'Error',
          description: result.error ?? "Sorry, we seem to have run into an error while getting the response"
        });
      } else {

        toast({
          title: 'Done',
          description: 'Responded'
        });
        setAiResponse(result.result);
        setChatInput("");
      }

    } catch (e) {
      console.error("Error with RAG", e);
      toast({
        variant: "destructive",
        title: "Cannot RAG",
        description: `${e}`
      });
    } finally {
      setIsFetchingQueryResponse(false);
    }
  }, [])

  const [actualDocuments, setactualDocuments] = useState<{
    url: string;
    name?: string;
    metadata: {
      companyName: string;
      companyTicker: string
    }
  }[]>([]);
  const fetchDocs = useCallback(async () => {
    const response = await fetch('/api/thesis-docs/list', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.user?.customClaims?.token ?? ""}`
      },
    })

    const json = await response.json();
    setactualDocuments(json.data ?? []);
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Test Your AI Assistant</h2>
          <p className="text-gray-600">Ask questions to verify how AI will respond using your training data</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <Brain className="w-8 h-8 text-blue-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-3">Try asking questions like:</h3>
              <div className="space-y-2">
                {[
                  "What's your outlook on emerging markets?",
                  "Should I diversify into international bonds?",
                  "How do rising interest rates affect my portfolio?",
                  "What's your strategy for tax-loss harvesting?"
                ].map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => setChatInput(question)}
                    className="w-full text-left bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all"
                  >
                    💬 {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Question
          </label>
          <textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type a client question here to see how AI responds..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
          />
          <button className="mt-3 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md font-medium" onClick={() => fetchResponse(chatInput)} disabled={isFetchingResponse}>
            <Send className="w-5 h-5" />
            {isFetchingResponse ? "Thinking..." : "Test AI Response"}
          </button>
        </div>

        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            AI will show you the response, source documents used, and confidence level
          </p>
        </div>
        {aiResponse && <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            RESPONSE: {aiResponse}
          </p>
        </div>}
      </div>

      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Testing Best Practices
        </h3>
        <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-700">
          <div className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>Test with actual questions clients have asked</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>Verify AI uses correct source documents</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>Check responses match your expertise</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>Test edge cases and complex scenarios</span>
          </div>
        </div>
      </div>
    </div>
  );
}
