'use client';
import { useRef, useEffect, useState } from 'react';
import { useStreamingChat } from '@/app/hooks/useStreamingChat';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import type { Conversation, Message } from '@/app/lib/types';
import { api } from '@/app/lib/api';
import { refreshConversations } from '@/app/components/sidebar/ConversationList';

export default function ChatWindow({ conversation, onUpdate }: {
  conversation: Conversation;
  onUpdate: (c: Conversation) => void;
}) {
  const { sendMessage, streamingContent, isStreaming } = useStreamingChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>(conversation.messages);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSend = async (content: string, attachedFiles: string[]) => {
    const userMsg: Message = {
      id: crypto.randomUUID(), conversationId: conversation.id,
      role: 'user', content, attachedFiles, provider: '', model: '', createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);

    await sendMessage(conversation.id, content, (finalContent, provider: string) => {
      const assistantMsg: Message = {
        id: crypto.randomUUID(), conversationId: conversation.id,
        role: 'assistant', content: finalContent, provider: provider, model: '',
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      api.getConversation(conversation.id).then(updated => {
        onUpdate(updated);
        setMessages(updated.messages);
        refreshConversations();
      });
    });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#25253a]">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#25253a] px-6 py-3 flex items-center gap-3">
        <h2 className="font-medium text-gray-900 dark:text-white">{conversation.title || 'Untitled Chat'}</h2>
        <span className="text-xs bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded capitalize">
          {conversation.mode}
        </span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4 chat-scroll">
        {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
        {isStreaming && (
          <MessageBubble message={{
            id: 'streaming', conversationId: conversation.id,
            role: 'assistant', content: streamingContent,
            provider: '', model: '', createdAt: '',
          }} isStreaming />
        )}
      </div>

      <MessageInput 
        onSend={handleSend} 
        disabled={isStreaming} 
        conversationId={conversation.id} 
      />
    </div>
  );
}