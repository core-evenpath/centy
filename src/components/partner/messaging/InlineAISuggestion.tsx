'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  X, 
  ThumbsUp, 
  RefreshCw,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  MessageSquare,
} from 'lucide-react';
import type { RAGSuggestion } from '@/lib/mock-rag-service';

interface InlineAISuggestionProps {
  suggestion: RAGSuggestion | null;
  isLoading: boolean;
  isVisible: boolean;
  onAccept: (text: string) => void;
  onDismiss: () => void;
  onRegenerate: () => void;
  incomingMessage: string;
}

export default function InlineAISuggestion({
  suggestion,
  isLoading,
  isVisible,
  onAccept,
  onDismiss,
  onRegenerate,
  incomingMessage,
}: InlineAISuggestionProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (!isVisible) return null;

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className="border-t border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-purple-200 bg-white/50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-900">AI Suggestion</span>
          {suggestion && (
            <Badge 
              variant="outline" 
              className={`text-xs px-2 py-0 ${getConfidenceColor(suggestion.confidence)}`}
            >
              {getConfidenceLabel(suggestion.confidence)} ({Math.round(suggestion.confidence * 100)}%)
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {suggestion && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="h-7 text-xs"
            >
              {showDetails ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Details
                </>
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-7 w-7 p-0"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="p-4 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-purple-700">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
            Analyzing conversation...
          </div>
        </div>
      )}

      {/* Suggestion Content */}
      {!isLoading && suggestion && (
        <div className="p-4 space-y-3">
          {/* Main Suggested Reply */}
          <div className="bg-white rounded-lg border-2 border-purple-200 p-3 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-gray-900 flex-1">{suggestion.suggestedReply}</p>
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAccept(suggestion.suggestedReply)}
                  className="h-8 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
                >
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  Use
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRegenerate}
                  className="h-8"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Expanded Details */}
          {showDetails && (
            <div className="space-y-2 pt-2 border-t border-purple-200">
              {/* Reasoning */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                <p className="text-xs font-semibold text-blue-900 mb-1">Why this suggestion?</p>
                <p className="text-xs text-blue-700">{suggestion.reasoning}</p>
              </div>

              {/* Incoming Message Context */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                <p className="text-xs font-semibold text-gray-700 mb-1">Customer asked:</p>
                <p className="text-xs text-gray-600">{incomingMessage}</p>
              </div>

              {/* Sources */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">Sources ({suggestion.sources.length})</p>
                <div className="space-y-1.5">
                  {suggestion.sources.slice(0, 2).map((source, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-200 rounded-lg p-2 text-xs"
                    >
                      <div className="flex items-start gap-2">
                        {source.type === 'conversation' ? (
                          <MessageSquare className="h-3 w-3 text-blue-600 mt-0.5 shrink-0" />
                        ) : (
                          <FileText className="h-3 w-3 text-green-600 mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{source.name}</p>
                          <p className="text-gray-600 line-clamp-1 mt-0.5">{source.excerpt}</p>
                        </div>
                        <span className="text-xs text-gray-500 shrink-0">
                          {Math.round(source.relevance * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}