import { Inject, Injectable } from '@nestjs/common';
import type { IChatRepository } from '../../../domain/interfaces/chat-repository.interface';
import { CHAT_REPOSITORY } from '../../constants/injection-tokens';
import { ConversationNotFoundException } from '../../../domain/exceptions/domain.exceptions';

@Injectable()
export class DeleteConversationUseCase {
  constructor(@Inject(CHAT_REPOSITORY) private readonly repo: IChatRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repo.findConversationById(id);
    if (!existing) throw new ConversationNotFoundException(id);
    await this.repo.deleteConversation(id);
  }
}