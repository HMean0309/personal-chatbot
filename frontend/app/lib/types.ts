export type ConversationMode = 'general' | 'coding' | 'docs';

export interface Conversation {
  id: string;
  title: string;
  isPublic: boolean;
  mode: ConversationMode;
  systemPrompt?: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  provider: string;
  model: string;
  tokenCount?: number;
  attachedFiles?: string[];
  createdAt: string;
}