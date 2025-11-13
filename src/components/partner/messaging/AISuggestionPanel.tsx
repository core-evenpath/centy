'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Sparkles, 
  X, 
  ThumbsUp, 
  ThumbsDown, 
  Copy, 
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText,
  MessageSquare
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { RAGSuggestion } from '@/lib/mock-rag-service';

interface AISuggestionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  suggestion: RAGSuggestion | null;
  isLoading: boolean;
  onAccept: (text: string) => void;
  onRegenerate: () => void;
  incomingMessage: string;
}

export default function AISuggestionPanel({
  isOpen,
  onClose,
  suggestion,
  isLoading,
  onAccept,
  onRegenerate,
  incomingMessage,
}: AISuggestionPanelProps) {
  const [editedReply, setEditedReply] = useState('');
  const [selectedAlternative, setSelectedAlternative] = useState<number | null>(null);
  const [showSources, setShowSources] = useState(false);

  React.useEffect(() => {
    if (suggestion) {
      setEditedReply(suggestion.suggestedReply);
      setSelectedAlternative(null);
    }
  }, [suggestion]);

  if (!isOpen) return null;

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High Confidence';
    if (confidence >= 0.6) return 'Medium Confidence';
    return 'Low Confidence';
  };

  const handleSelectAlternative = (index: number, text: string) => {
    setSelectedAlternative(index);
    setEditedReply(text);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editedReply);
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-[550px] bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AI Reply Assistant</h3>
              <p className="text-sm text-gray-600">Powered by your knowledge base</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          
          {/* Incoming Message */}
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Incoming Message</p>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-900">{incomingMessage}</p>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="p-8 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-2">Analyzing conversation history...</p>
              <p className="text-xs text-gray-500">Searching documents and past messages</p>
            </div>
          )}

          {/* Suggestion Content */}
          {!isLoading && suggestion && (
            <div className="p-6 space-y-4">
              
              {/* Confidence Badge */}
              <div className="flex items-center justify-between">
                <Badge 
                  variant="outline" 
                  className={`px-3 py-1 ${getConfidenceColor(suggestion.confidence)}`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                  {getConfidenceLabel(suggestion.confidence)} ({Math.round(suggestion.confidence * 100)}%)
                </Badge>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRegenerate}
                  className="text-xs"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Regenerate
                </Button>
              </div>

              {/* Reasoning */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-blue-900 mb-1">Why this suggestion?</p>
                <p className="text-xs text-blue-700">{suggestion.reasoning}</p>
              </div>

              {/* Suggested Reply */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-700 uppercase">Suggested Reply</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="text-xs h-7"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <Textarea
                  value={editedReply}
                  onChange={(e) => setEditedReply(e.target.value)}
                  className="min-h-[120px] text-sm"
                  placeholder="Edit the suggested reply..."
                />
              </div>

              {/* Alternative Replies */}
              {suggestion.alternativeReplies && suggestion.alternativeReplies.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-700 uppercase mb-2">Alternative Suggestions</p>
                  <div className="space-y-2">
                    {suggestion.alternativeReplies.map((alt, index) => (
                      <button
                        key={index}
                        onClick={() => handleSelectAlternative(index, alt)}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                          selectedAlternative === index
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300 bg-white'
                        }`}
                      >
                        <p className="text-sm text-gray-700">{alt}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sources */}
              <div>
                <button
                  onClick={() => setShowSources(!showSources)}
                  className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-xs font-semibold text-gray-700 uppercase">
                    Sources Used ({suggestion.sources.length})
                  </span>
                  {showSources ? (
                    <ChevronUp className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </button>

                {showSources && (
                  <div className="mt-2 space-y-2">
                    {suggestion.sources.map((source, index) => (
                      <div
                        key={index}
                        className="bg-white border border-gray-200 rounded-lg p-3"
                      >
                        <div className="flex items-start gap-2 mb-2">
                          {source.type === 'conversation' ? (
                            <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5" />
                          ) : (
                            <FileText className="h-4 w-4 text-green-600 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-gray-900">{source.name}</p>
                            <p className="text-xs text-gray-600 mt-1">{source.excerpt}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {source.type}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {Math.round(source.relevance * 100)}% relevant
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Warning for low confidence */}
              {suggestion.confidence < 0.7 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-yellow-900">Review Recommended</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      This suggestion has lower confidence. Please review and edit before sending.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!isLoading && suggestion && (
          <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-2">
            <Button
              onClick={() => onAccept(editedReply)}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              size="lg"
            >
              <ThumbsUp className="h-4 w-4 mr-2" />
              Use This Reply
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={onRegenerate}
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}