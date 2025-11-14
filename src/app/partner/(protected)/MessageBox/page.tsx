"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sendWhatsAppMessageAction } from '@/actions/whatsapp-actions';
import { MessageCircle, Send, Search, MoreVertical, User, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface Conversation {
  id: string;
  customerPhone: string;
  customerName?: string;
  lastMessageAt: any;
  messageCount: number;
}

interface Message {
  id: string;
  conversationId: string;
  content: string;
  direction: 'inbound' | 'outbound';
  createdAt: any;
}

export default function MessageBoxPage() {
  const { user, currentWorkspace } = useMultiWorkspaceAuth();
  const partnerId = currentWorkspace?.partnerId || user?.customClaims?.partnerId;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConv = conversations.find(c => c.id === selectedConvId);

  // Load conversations
  useEffect(() => {
    if (!partnerId || !db) return;

    console.log('🔄 Loading conversations for partner:', partnerId);

    const q = query(
      collection(db, 'whatsappConversations'),
      where('partnerId', '==', partnerId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('📦 Conversations snapshot:', snapshot.size);
      
      const convs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Conversation));

      convs.sort((a, b) => {
        const timeA = a.lastMessageAt?.seconds || 0;
        const timeB = b.lastMessageAt?.seconds || 0;
        return timeB - timeA;
      });

      console.log('✅ Loaded conversations:', convs.length);
      setConversations(convs);
    });

    return () => unsubscribe();
  }, [partnerId]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConvId || !db) {
      setMessages([]);
      return;
    }

    console.log('🔄 Loading messages for conversation:', selectedConvId);
    setLoading(true);

    const q = query(
      collection(db, 'whatsappMessages'),
      where('conversationId', '==', selectedConvId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('📨 Messages snapshot size:', snapshot.size);
      console.log('📨 Messages snapshot empty:', snapshot.empty);

      const msgs = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Message:', {
          id: doc.id,
          conversationId: data.conversationId,
          direction: data.direction,
          content: data.content?.substring(0, 30)
        });
        return {
          id: doc.id,
          ...data
        } as Message;
      });

      msgs.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeA - timeB;
      });

      console.log('✅ Loaded messages:', msgs.length);
      console.log('Messages:', msgs.map(m => ({ 
        id: m.id.substring(0, 8), 
        dir: m.direction, 
        content: m.content?.substring(0, 20) 
      })));

      setMessages(msgs);
      setLoading(false);
    }, (error) => {
      console.error('❌ Error loading messages:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedConvId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Manual refresh function
  const refreshMessages = async () => {
    if (!selectedConvId || !db) return;
    
    console.log('🔄 Manual refresh for:', selectedConvId);
    setLoading(true);

    try {
      const q = query(
        collection(db, 'whatsappMessages'),
        where('conversationId', '==', selectedConvId)
      );

      const snapshot = await getDocs(q);
      console.log('📦 Manual fetch got:', snapshot.size, 'messages');

      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message));

      msgs.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeA - timeB;
      });

      setMessages(msgs);
    } catch (error) {
      console.error('❌ Error refreshing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConv || !partnerId) return;

    const text = messageInput;
    setMessageInput('');

    try {
      await sendWhatsAppMessageAction({
        partnerId,
        to: selectedConv.customerPhone,
        message: text,
        conversationId: selectedConv.id,
      });
    } catch (error) {
      console.error('Send failed:', error);
      setMessageInput(text);
      alert('Failed to send message');
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
      return format(date, 'h:mm a');
    } catch {
      return '';
    }
  };

  const filteredConvs = conversations.filter(c =>
    c.customerPhone.includes(searchTerm) ||
    c.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!partnerId) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p>No partner ID found</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-[#111b21]">
      {/* Left Sidebar */}
      <div className="w-[400px] bg-[#111b21] border-r border-[#2a3942] flex flex-col">
        <div className="h-[60px] bg-[#202c33] px-4 flex items-center justify-between">
          <div className="w-10 h-10 rounded-full bg-[#6b7c85] flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div className="flex items-center gap-6">
            <MoreVertical className="w-5 h-5 text-[#aebac1] cursor-pointer" />
          </div>
        </div>

        <div className="p-2 bg-[#111b21]">
          <div className="bg-[#202c33] rounded-lg px-4 py-2 flex items-center gap-3">
            <Search className="w-4 h-4 text-[#aebac1]" />
            <input
              type="text"
              placeholder="Search or start new chat"
              className="flex-1 bg-transparent text-[#e9edef] text-sm outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConvs.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-[#8696a0]">
              <MessageCircle className="w-16 h-16 mb-4 opacity-40" />
              <p>No conversations</p>
            </div>
          )}

          {filteredConvs.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setSelectedConvId(conv.id)}
              className={`px-4 py-3 cursor-pointer hover:bg-[#202c33] ${
                selectedConvId === conv.id ? 'bg-[#2a3942]' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#6b7c85] flex items-center justify-center flex-shrink-0">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-[#e9edef] font-normal truncate">
                      {conv.customerName || conv.customerPhone}
                    </h3>
                    <span className="text-xs text-[#8696a0]">
                      {formatTime(conv.lastMessageAt)}
                    </span>
                  </div>
                  <p className="text-sm text-[#8696a0] truncate">
                    {conv.messageCount} messages
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Chat Area */}
      <div className="flex-1 flex flex-col">
        {!selectedConv ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#222e35]">
            <div className="w-80 text-center">
              <div className="w-80 h-80 mx-auto mb-8 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <MessageCircle className="w-32 h-32 text-[#3b4a54]" />
                </div>
              </div>
              <h1 className="text-[#e9edef] text-3xl font-light mb-4">
                WhatsApp Web
              </h1>
              <p className="text-[#8696a0] text-sm leading-relaxed">
                Send and receive messages without keeping your phone online.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="h-[60px] bg-[#202c33] px-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#6b7c85] flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-[#e9edef] font-normal">
                  {selectedConv.customerName || selectedConv.customerPhone}
                </h2>
                <p className="text-xs text-[#8696a0]">{selectedConv.customerPhone}</p>
              </div>
              <button
                onClick={refreshMessages}
                disabled={loading}
                className="p-2 hover:bg-[#2a3942] rounded-full"
                title="Refresh messages"
              >
                <RefreshCw className={`w-5 h-5 text-[#aebac1] ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div
              className="flex-1 overflow-y-auto px-16 py-6"
              style={{
                backgroundImage: 'url(https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png)',
                backgroundColor: '#0b141a'
              }}
            >
              {loading && messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-[#8696a0]">Loading messages...</p>
                </div>
              )}

              {!loading && messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-[#8696a0]">No messages yet</p>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex mb-2 ${
                    msg.direction === 'outbound' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[65%] rounded-lg px-3 py-2 shadow-md ${
                      msg.direction === 'outbound'
                        ? 'bg-[#005c4b]'
                        : 'bg-[#202c33]'
                    }`}
                  >
                    <p className="text-[#e9edef] text-sm whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-[10px] text-[#8696a0]">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="bg-[#202c33] px-4 py-2 flex items-center gap-2">
              <input
                type="text"
                placeholder="Type a message"
                className="flex-1 bg-[#2a3942] text-[#e9edef] rounded-lg px-4 py-3 outline-none text-sm"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}