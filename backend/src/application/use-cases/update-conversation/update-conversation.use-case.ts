import { Inject, Injectable } from '@nestjs/common';
import type { IChatRepository, UpdateConversationDTO } from '../../../domain/interfaces/chat-repository.interface';
import { CHAT_REPOSITORY } from '../../constants/injection-tokens';
import type { Conversation } from '../../../domain/entities/conversation.entity';
import { ConversationNotFoundException } from '../../../domain/exceptions/domain.exceptions';

@Injectable()
export class UpdateConversationUseCase {
  constructor(@Inject(CHAT_REPOSITORY) private readonly repo: IChatRepository) {}

  async execute(id: string, dto: UpdateConversationDTO): Promise<Conversation> {
    const existing = await this.repo.findConversationById(id);
    if (!existing) throw new ConversationNotFoundException(id);
    return this.repo.updateConversation(id, dto);
  }
}