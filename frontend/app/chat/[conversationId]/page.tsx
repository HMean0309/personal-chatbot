'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/app/lib/api';
import ChatWindow from '@/app/components/chat/ChatWindow';
import type { Conversation } from '@/app/lib/types';

export default function ConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [conversation, setConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    api.getConversation(conversationId).then(setConversation);
  }, [conversationId]);

  if (!conversation) return <div className="flex-1 flex items-center justify-center text-gray-400">Loading...</div>;

  return <ChatWindow conversation={conversation} onUpdate={setConversation} />;
}