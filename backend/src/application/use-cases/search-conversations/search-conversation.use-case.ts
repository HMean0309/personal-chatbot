import { Inject, Injectable } from '@nestjs/common';
import type { IChatRepository } from '../../../domain/interfaces/chat-repository.interface';
import { CHAT_REPOSITORY } from '../../constants/injection-tokens';
import type { Conversation } from '../../../domain/entities/conversation.entity';

@Injectable()
export class SearchConversationsUseCase {
  constructor(@Inject(CHAT_REPOSITORY) private readonly repo: IChatRepository) {}

  async execute(userId: string, query: string): Promise<Conversation[]> {
    if (!query || query.trim().length < 2) return [];
    return this.repo.searchConversations(userId, query.trim());
  }
}