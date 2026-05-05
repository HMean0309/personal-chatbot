import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import type {
  IChatRepository,
  CreateConversationDTO,
  UpdateConversationDTO,
  CreateMessageDTO,
} from '../../domain/interfaces/chat-repository.interface';
import { Conversation } from '../../domain/entities/conversation.entity';
import { Message } from '../../domain/entities/message.entity';

@Injectable()
export class PrismaChatRepository implements IChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findConversationById(id: string): Promise<Conversation | null> {
    const record = await this.prisma.conversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!record) return null;
    return this.toConversation(record);
  }

  async findConversationsByUserId(userId: string): Promise<Conversation[]> {
    const records = await this.prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    return records.map((r) => this.toConversation({ ...r, messages: [] }));
  }

  async createConversation(dto: CreateConversationDTO): Promise<Conversation> {
    const record = await this.prisma.conversation.create({
      data: {
        userId: dto.userId,
        title: dto.title ?? '',
        isPublic: dto.isPublic ?? true,
        mode: dto.mode ?? 'general',
        systemPrompt: dto.systemPrompt ?? null,
      },
      include: { messages: true },
    });
    return this.toConversation(record);
  }

  async updateConversation(id: string, dto: UpdateConversationDTO): Promise<Conversation> {
    const record = await this.prisma.conversation.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
        ...(dto.mode !== undefined && { mode: dto.mode }),
        ...(dto.systemPrompt !== undefined && { systemPrompt: dto.systemPrompt }),
        updatedAt: new Date(),
      },
    });
    return this.toConversation({ ...record, messages: [] });
  }

  async deleteConversation(id: string): Promise<void> {
    await this.prisma.conversation.delete({ where: { id } });
  }

  async searchConversations(userId: string, query: string): Promise<Conversation[]> {
    // Dùng 'simple' config thay vì 'english' để support tiếng Việt
    const records = await this.prisma.$queryRaw<any[]>`
      SELECT DISTINCT c.*
      FROM conversations c
      JOIN messages m ON m.conversation_id = c.id
      WHERE c.user_id = ${userId}
        AND to_tsvector('simple', m.content) @@ plainto_tsquery('simple', ${query})
      ORDER BY c.updated_at DESC
      LIMIT 20
    `;
    return records.map((r) => this.toConversation({ ...r, messages: [] }));
  }

  async createMessage(dto: CreateMessageDTO): Promise<Message> {
    const record = await this.prisma.message.create({
      data: {
        conversationId: dto.conversationId,
        role: dto.role,
        content: dto.content,
        provider: dto.provider,
        model: dto.model,
        tokenCount: dto.tokenCount,
      },
    });
    // Cập nhật updatedAt của conversation
    await this.prisma.conversation.update({
      where: { id: dto.conversationId },
      data: { updatedAt: new Date() },
    });
    return this.toMessage(record);
  }

  async findMessagesByConversationId(conversationId: string): Promise<Message[]> {
    const records = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
    return records.map(this.toMessage);
  }

  // --- Private mappers ---

  private toConversation(r: any): Conversation {
    return new Conversation(
      r.id,
      r.userId ?? r.user_id,
      r.title,
      r.createdAt ?? r.created_at,
      (r.messages ?? []).map(this.toMessage),
      r.isPublic ?? r.is_public ?? true,
      r.systemPrompt ?? r.system_prompt ?? null,
      r.mode ?? 'general',
    );
  }

  private toMessage(r: any): Message {
    return new Message(
      r.id,
      r.conversationId ?? r.conversation_id,
      r.role,
      r.content,
      r.provider,
      r.model,
      r.createdAt ?? r.created_at,
      r.tokenCount ?? r.token_count ?? undefined,
    );
  }
}