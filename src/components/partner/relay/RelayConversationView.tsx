'use client';

import type { RelayConversation, RelayMessage } from '@/lib/types-relay';
import { Bot, User, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Props {
  conversation: RelayConversation;
}

export function RelayConversationView({ conversation }: Props) {
  const messages = conversation.messages || [];

  if (messages.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-gray-400">
        No messages in this conversation
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 max-h-80 overflow-y-auto bg-[#fafafa]">
      {/* Visitor info banner */}
      {(conversation.visitorName || conversation.visitorContact) && (
        <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-100 rounded-lg">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-3 h-3 text-blue-600" />
          </div>
          <div className="text-xs">
            {conversation.visitorName && <span className="font-medium text-blue-800">{conversation.visitorName}</span>}
            {conversation.visitorContact && (
              <span className="text-blue-600 ml-1">· {conversation.visitorContact}</span>
            )}
            {conversation.visitorContactType && (
              <span className="text-blue-500 ml-1">({conversation.visitorContactType})</span>
            )}
          </div>
        </div>
      )}

      {messages.map((msg, i) => (
        <MessageBubble key={msg.id || i} message={msg} />
      ))}

      {/* Conversion event */}
      {conversation.conversionType && (
        <div className="flex items-center gap-2 justify-center py-1">
          <div className="h-px flex-1 bg-green-200" />
          <div className="flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded-full text-xs text-green-700">
            <Zap className="w-3 h-3" />
            Converted: {conversation.conversionType.replace(/_/g, ' ')}
          </div>
          <div className="h-px flex-1 bg-green-200" />
        </div>
      )}

      {/* Source info */}
      {conversation.sourceUrl && (
        <p className="text-xs text-gray-400 text-center pt-1">
          Source: {conversation.sourceUrl}
        </p>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: RelayMessage }) {
  const isBot = message.role === 'bot';

  return (
    <div className={cn('flex items-start gap-2', !isBot && 'flex-row-reverse')}>
      {/* Avatar */}
      <div className={cn(
        'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
        isBot ? 'bg-[#111]' : 'bg-indigo-100'
      )}>
        {isBot
          ? <Bot className="w-3 h-3 text-white" />
          : <User className="w-3 h-3 text-indigo-600" />
        }
      </div>

      {/* Content */}
      <div className={cn('max-w-[80%] space-y-1', !isBot && 'items-end')}>
        <div className={cn(
          'px-3 py-2 rounded-xl text-xs',
          isBot
            ? 'bg-white border border-[#e5e5e5] text-[#111]'
            : 'bg-indigo-500 text-white'
        )}>
          {message.text || message.block?.text || ''}
          {message.block && message.block.type !== 'text' && (
            <div className="mt-1">
              <Badge variant="secondary" className="text-[10px]">
                {message.block.type} block
              </Badge>
              {message.block.items && message.block.items.length > 0 && (
                <span className="text-[10px] text-gray-500 ml-1">
                  ({message.block.items.length} items)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Suggestions */}
        {isBot && message.block?.suggestions && message.block.suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1 pl-1">
            {message.block.suggestions.map((s, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full border border-gray-200">
                {s}
              </span>
            ))}
          </div>
        )}

        <p className={cn('text-[10px] text-gray-400', !isBot && 'text-right')}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
