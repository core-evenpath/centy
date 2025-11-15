'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  X, 
  Send,
  Edit3,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  MessageSquare,
  Search,
  Brain,
  CheckCircle2,
  Clock,
  Archive,
} from 'lucide-react';

interface RAGSuggestion {
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

interface InlineAISuggestionProps {
  suggestion: RAGSuggestion | null;
  isLoading: boolean;
  isVisible: boolean;
  onEdit: (text: string) => void;
  onSend: (text: string) => void;
  onDismiss: () => void;
  onRegenerate: () => void;
  incomingMessage: string;
}

type LoadingStage = 'searching' | 'analyzing' | 'generating' | 'complete';

export default function InlineAISuggestion({
  suggestion,
  isLoading,
  isVisible,
  onEdit,
  onSend,
  onDismiss,
  onRegenerate,
  incomingMessage,
}: InlineAISuggestionProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>('searching');
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Simulate loading stages for better UX
  useEffect(() => {
    if (!isLoading) {
      setLoadingStage('complete');
      return;
    }

    setLoadingStage('searching');
    const timer1 = setTimeout(() => setLoadingStage('analyzing'), 400);
    const timer2 = setTimeout(() => setLoadingStage('generating'), 900);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isLoading]);

  // Typewriter effect for suggestion
  useEffect(() => {
    if (!suggestion?.suggestedReply || isLoading) {
      setDisplayedText('');
      return;
    }

    setIsTyping(true);
    setDisplayedText('');
    
    const text = suggestion.suggestedReply;
    let currentIndex = 0;

    const typingInterval = setInterval(() => {
      if (currentIndex <= text.length) {
        setDisplayedText(text.slice(0, currentIndex));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typingInterval);
      }
    }, 20);

    return () => clearInterval(typingInterval);
  }, [suggestion?.suggestedReply, isLoading]);

  if (!isVisible) return null;

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-700 border-green-300';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    return 'bg-red-100 text-red-700 border-red-300';
  };

  const documentSources = suggestion?.sources?.filter(s => s.type === 'document').length || 0;

  const getLoadingStageInfo = () => {
    switch (loadingStage) {
      case 'searching':
        return {
          icon: Search,
          text: 'Searching the vault...',
          subtext: 'Looking through your documents',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
        };
      case 'analyzing':
        return {
          icon: Brain,
          text: 'Analyzing conversation...',
          subtext: `Reading "${incomingMessage.slice(0, 40)}${incomingMessage.length > 40 ? '...' : ''}"`,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
        };
      case 'generating':
        return {
          icon: Sparkles,
          text: 'Crafting your response...',
          subtext: 'Almost ready',
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50',
        };
      default:
        return null;
    }
  };

  const handleEdit = () => {
    onEdit(displayedText);
  };

  const handleSend = () => {
    onSend(displayedText);
  };

  return (
    <div className="border-t-2 border-indigo-300 bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 shadow-lg">
      {/* Compact header */}
      <div className="px-4 py-2 flex items-center justify-between bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
            <Archive className={`h-4 w-4 text-white ${isLoading ? 'animate-pulse' : ''}`} />
          </div>
          <span className="text-sm font-semibold text-gray-900">From the Vault</span>
          
          {suggestion && !isLoading && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-xs px-2 py-0.5 ${getConfidenceColor(suggestion.confidence)}`}>
                {Math.round(suggestion.confidence * 100)}%
              </Badge>
              
              {documentSources > 0 && (
                <Badge variant="outline" className="text-xs px-2 py-0.5 bg-blue-50 border-blue-200 text-blue-700">
                  <FileText className="h-3 w-3 mr-1" />
                  {documentSources}
                </Badge>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {suggestion && !isLoading && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="h-7 text-xs text-gray-600 hover:text-gray-900"
            >
              {showDetails ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  More
                </>
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-7 w-7 p-0 text-gray-500 hover:text-gray-900"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Engaging loading state with stages */}
      {isLoading && (() => {
        const stageInfo = getLoadingStageInfo();
        if (!stageInfo) return null;
        
        const Icon = stageInfo.icon;
        
        return (
          <div className="px-4 py-4">
            <div className={`${stageInfo.bgColor} rounded-lg p-4 border-2 border-gray-200`}>
              <div className="flex items-start gap-4">
                <div className="shrink-0">
                  <div className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center animate-bounce">
                    <Icon className={`h-5 w-5 ${stageInfo.color}`} />
                  </div>
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-semibold ${stageInfo.color}`}>
                      {stageInfo.text}
                    </p>
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-600">
                    {stageInfo.subtext}
                  </p>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full ${stageInfo.color.replace('text-', 'bg-')} rounded-full transition-all duration-500`}
                      style={{ 
                        width: loadingStage === 'searching' ? '33%' : loadingStage === 'analyzing' ? '66%' : '95%'
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Stage indicators */}
              <div className="flex items-center justify-between mt-4 px-2">
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${loadingStage === 'searching' || loadingStage === 'analyzing' || loadingStage === 'generating' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                  <span className="text-xs text-gray-500">Search</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${loadingStage === 'analyzing' || loadingStage === 'generating' ? 'bg-purple-500' : 'bg-gray-300'}`}></div>
                  <span className="text-xs text-gray-500">Analyze</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${loadingStage === 'generating' ? 'bg-indigo-500' : 'bg-gray-300'}`}></div>
                  <span className="text-xs text-gray-500">Generate</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Suggestion content with typewriter effect */}
      {!isLoading && suggestion && (
        <div className="px-4 py-3">
          <div className="bg-white rounded-lg border-2 border-indigo-200 shadow-md hover:shadow-lg transition-shadow">
            <div className="p-4">
              <div className="space-y-3">
                {/* Display text */}
                <div className="text-sm text-gray-900 leading-relaxed">
                  {displayedText}
                  {isTyping && <span className="inline-block w-0.5 h-4 bg-indigo-600 ml-1 animate-pulse"></span>}
                </div>
                
                {!isTyping && (
                  <>
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">Generated just now</span>
                      {suggestion.sources.length > 0 && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs text-gray-500">
                            From {suggestion.sources.length} source{suggestion.sources.length > 1 ? 's' : ''}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={handleSend}
                        className="flex-1 h-9 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all"
                      >
                        <Send className="h-4 w-4 mr-1.5" />
                        Send
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEdit}
                        className="h-9 px-4 border-gray-300 hover:bg-gray-50"
                      >
                        <Edit3 className="h-4 w-4 mr-1.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onRegenerate}
                        className="h-9 px-3 border-gray-300 hover:bg-gray-50"
                        title="Regenerate"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Expandable details */}
          {showDetails && !isTyping && (
            <div className="mt-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
              {/* Customer message context */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 text-gray-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-700 mb-1">Customer asked:</p>
                    <p className="text-xs text-gray-600 italic leading-relaxed">"{incomingMessage}"</p>
                  </div>
                </div>
              </div>

              {/* Sources with previews */}
              {suggestion.sources && suggestion.sources.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <p className="text-xs font-semibold text-blue-900">
                      Information Sources ({suggestion.sources.length})
                    </p>
                  </div>
                  <div className="space-y-2">
                    {suggestion.sources.slice(0, 3).map((source, index) => (
                      <div 
                        key={index} 
                        className="bg-white rounded-md p-2 border border-blue-100 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-blue-900 mb-0.5 truncate">
                              {source.name}
                            </p>
                            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                              {source.excerpt}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Confidence explanation */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-green-900 mb-1">
                  Confidence: {Math.round(suggestion.confidence * 100)}%
                </p>
                <p className="text-xs text-green-700 leading-relaxed">
                  {suggestion.reasoning}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}