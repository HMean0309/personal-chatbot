import { Inject, Injectable } from '@nestjs/common';
import type { IChatRepository } from '../../../domain/interfaces/chat-repository.interface';
import { CHAT_REPOSITORY } from '../../constants/injection-tokens';
import type { Conversation, ConversationMode } from '../../../domain/entities/conversation.entity';

@Injectable()
export class CreateConversationUseCase {
  constructor(@Inject(CHAT_REPOSITORY) private readonly repo: IChatRepository) {}

  async execute(
    userId: string,
    options?: { title?: string; isPublic?: boolean; mode?: ConversationMode; systemPrompt?: string },
  ): Promise<Conversation> {
    return this.repo.createConversation({
      userId,
      title: options?.title,
      isPublic: options?.isPublic ?? true,
      mode: options?.mode ?? 'general',
      systemPrompt: options?.systemPrompt ?? null,
    });
  }
}