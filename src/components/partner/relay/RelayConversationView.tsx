'use client';

import { cn } from '@/lib/utils';
import type { RelayConversation, RelayMessage } from '@/lib/types-relay';

interface RelayConversationViewProps {
  conversation: RelayConversation;
}

function MessageBubble({ message }: { message: RelayMessage }) {
  const isVisitor = message.role === 'visitor';
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={cn('flex', isVisitor ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-xs lg:max-w-md', isVisitor ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'px-3 py-2 rounded-2xl text-sm',
            isVisitor
              ? 'bg-indigo-600 text-white rounded-br-sm'
              : 'bg-gray-100 text-gray-900 rounded-bl-sm'
          )}
        >
          {message.text && <p>{message.text}</p>}
          {message.block && (
            <div>
              <p>{message.block.text}</p>
              {message.block.items && message.block.items.length > 0 && (
                <p className="text-xs opacity-70 mt-1">
                  [{message.block.type} block — {message.block.items.length} items]
                </p>
              )}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1 px-1">{time}</p>
      </div>
    </div>
  );
}

export function RelayConversationView({ conversation }: RelayConversationViewProps) {
  return (
    <div className="space-y-3 p-4 max-h-80 overflow-y-auto">
      <div className="text-xs text-muted-foreground text-center py-1">
        Conversation started {new Date(conversation.startedAt).toLocaleString()}
      </div>
      {conversation.messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {conversation.convertedAt && (
        <div className="text-xs text-green-600 text-center py-1 bg-green-50 rounded-lg">
          ✓ Converted via {conversation.conversionType?.replace('_', ' ')} —{' '}
          {new Date(conversation.convertedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}
