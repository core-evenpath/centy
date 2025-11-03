// src/components/partner/messaging/MessageBubble.tsx
"use client";

import React from 'react';
import { CheckCheck, Check, Clock, AlertCircle, FileText, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import type { SMSMessage, WhatsAppMessage } from '@/lib/types';

type Platform = 'sms' | 'whatsapp';
type UnifiedMessage = (SMSMessage | WhatsAppMessage) & { platform: Platform };

interface MessageBubbleProps {
  message: UnifiedMessage;
  showTimestamp?: boolean;
  formattedTimestamp?: string;
}

export default function MessageBubble({ message, showTimestamp, formattedTimestamp }: MessageBubbleProps) {
  const isOutbound = message.direction === 'outbound';
  const isOptimistic = message.id.startsWith('optimistic-');

  const getStatusIcon = () => {
    if (message.direction === 'inbound') return null;
    
    // Show loading for optimistic messages
    if (isOptimistic) {
      return <Loader2 className="w-3 h-3 animate-spin text-blue-300" />;
    }
    
    const status = 'smsMetadata' in message 
      ? message.smsMetadata?.twilioStatus 
      : ('whatsappMetadata' in message ? message.whatsappMetadata?.twilioStatus : undefined);
    
    if (status === 'delivered') return <CheckCheck className="w-3 h-3 text-blue-500" />;
    if (status === 'sent') return <Check className="w-3 h-3 text-gray-400" />;
    if (status === 'failed') return <AlertCircle className="w-3 h-3 text-red-500" />;
    if (status === 'sending') return <Loader2 className="w-3 h-3 animate-spin text-blue-300" />;
    return <Clock className="w-3 h-3 text-gray-400" />;
  };

  const renderContent = () => {
    const attachments = message.attachments || [];
    
    if (attachments.length > 0) {
      return (
        <div className="space-y-2">
          {attachments.map((attachment, index) => {
            const attachmentUrl = attachment.url || attachment.mediaUrl || '';
            const attachmentType = attachment.type || attachment.contentType || '';
            
            if (attachmentType.startsWith('image/')) {
              return (
                <img 
                  key={index}
                  src={attachmentUrl} 
                  alt="attachment" 
                  className="max-w-xs rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => window.open(attachmentUrl, '_blank')}
                />
              );
            } else if (attachmentType.startsWith('video/')) {
              return (
                <video 
                  key={index}
                  src={attachmentUrl} 
                  controls 
                  className="max-w-xs rounded-lg"
                >
                  Your browser does not support the video tag.
                </video>
              );
            } else if (attachmentType.startsWith('audio/')) {
              return (
                <audio 
                  key={index}
                  src={attachmentUrl} 
                  controls 
                  className="w-full max-w-sm"
                >
                  Your browser does not support the audio tag.
                </audio>
              );
            } else {
              return (
                <a 
                  key={index}
                  href={attachmentUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <FileText className="w-5 h-5 text-gray-500" />
                  <span className="text-sm">{attachment.name || 'File'}</span>
                  <Download className="w-4 h-4 ml-auto text-gray-500" />
                </a>
              );
            }
          })}
          {message.content && (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}
        </div>
      );
    }
    
    if (!message.content) {
      return <p className="text-sm italic text-gray-400">[No content]</p>;
    }
    
    return <p className="whitespace-pre-wrap break-words">{message.content}</p>;
  };

  const getMessageTime = () => {
    try {
      const date = message.createdAt?.toDate ? message.createdAt.toDate() : new Date(message.createdAt);
      return format(date, 'h:mm a');
    } catch (error) {
      return '';
    }
  };

  return (
    <div className="w-full">
      {showTimestamp && formattedTimestamp && (
        <div className="flex justify-center my-4">
          <span className="text-xs text-muted-foreground bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-sm">
            {formattedTimestamp}
          </span>
        </div>
      )}
      <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'} mb-2`}>
        <div 
          className={`max-w-[70%] rounded-lg p-3 shadow-sm transition-opacity ${
            isOptimistic ? 'opacity-70' : 'opacity-100'
          } ${
            isOutbound 
              ? 'bg-blue-600 text-white rounded-br-none' 
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none'
          }`}
        >
          {renderContent()}
          <div className={`flex items-center gap-1 mt-1 text-xs ${isOutbound ? 'text-blue-100' : 'text-muted-foreground'}`}>
            <span>{getMessageTime()}</span>
            {getStatusIcon()}
          </div>
        </div>
      </div>
    </div>
  );
}