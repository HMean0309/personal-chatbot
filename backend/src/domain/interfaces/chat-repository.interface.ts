import { Conversation, ConversationMode } from "../entities/conversation.entity"
import type { Message } from "../entities/message.entity"

export interface CreateConversationDTO {
    userId: string;
    title?: string;
    isPublic?: boolean;
    systemPrompt?: string | null;
    mode?: ConversationMode;
}

export interface UpdateConversationDTO {
    title?: string;
    isPublic?: boolean;
    systemPrompt?: string | null;
    mode?: ConversationMode;
}

export interface CreateMessageDTO {
    conversationId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    provider: string;
    model: string;
    tokenCount?: number;
}

export interface IChatRepository {
    findConversationById(id: string): Promise<Conversation | null>;
    findConversationsByUserId(userId: string): Promise<Conversation[]>;
    createConversation(data: CreateConversationDTO): Promise<Conversation>;
    updateConversation(id: string, dto: UpdateConversationDTO): Promise<Conversation>;
    deleteConversation(id: string): Promise<void>;
    searchConversations(userId: string, query: string): Promise<Conversation[]>;
    createMessage(dto: CreateMessageDTO): Promise<Message>;
    findMessagesByConversationId(conversationId: string): Promise<Message[]>;
}