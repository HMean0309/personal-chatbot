import { Inject, Injectable } from '@nestjs/common';
import type { IChatRepository } from '../../../domain/interfaces/chat-repository.interface';
import { CHAT_REPOSITORY } from '../../constants/injection-tokens';
import type { Conversation } from '../../../domain/entities/conversation.entity';
import { ConversationNotFoundException } from '../../../domain/exceptions/domain.exceptions';

@Injectable()
export class GetConversationHistoryUseCase {
  constructor(@Inject(CHAT_REPOSITORY) private readonly repo: IChatRepository) {}

  async execute(conversationId: string): Promise<Conversation> {
    const conv = await this.repo.findConversationById(conversationId);
    if (!conv) throw new ConversationNotFoundException(conversationId);
    return conv;
  }
}