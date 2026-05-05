import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatController } from '../presentation/chat/chat.controller';
import { SendMessageUseCase } from '../application/use-cases/send-message/send-message.use-case';
import { GetConversationHistoryUseCase } from '../application/use-cases/get-conversation-history/get-conversation.use-case';
import { CreateConversationUseCase } from '../application/use-cases/create-conversation/create-conversation.use-case';
import { UpdateConversationUseCase } from '../application/use-cases/update-conversation/update-conversation.use-case';
import { DeleteConversationUseCase } from '../application/use-cases/delete-conversation/delete-conversation.use-case';
import { SearchConversationsUseCase } from '../application/use-cases/search-conversations/search-conversation.use-case';
import { UploadDocumentUseCase } from '../application/use-cases/upload-document/upload-document.use-case';
import { GroqAdapter } from '../infrastructure/ai/groq/groq.adapter';
import { LMStudioAdapter } from '../infrastructure/ai/lmstudio/lmstudio.adapter';
import { LMStudioEmbeddingAdapter } from '../infrastructure/ai/lmstudio/lmstudio-embedding.adapter';
import { PrismaChatRepository } from '../infrastructure/database/prisma-chat.repository';
import { PrismaDocumentRepository } from '../infrastructure/database/prisma-document.repository';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { AI_PROVIDERS, CHAT_REPOSITORY, EMBEDDING_PROVIDER, DOCUMENT_REPOSITORY } from '../application/constants/injection-tokens';
import type { IAIProvider } from '../domain/interfaces/ai-provider.interface';
import { GetAllConversationsUseCase } from '../application/use-cases/get-all-conversations/get-all-conversations.use-case';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [ChatController],
  providers: [
    // Use Cases
    SendMessageUseCase,
    GetConversationHistoryUseCase,
    CreateConversationUseCase,
    UpdateConversationUseCase,
    DeleteConversationUseCase,
    SearchConversationsUseCase,
    GetAllConversationsUseCase,
    UploadDocumentUseCase,

    // Infrastructure
    GroqAdapter,
    LMStudioAdapter,
    LMStudioEmbeddingAdapter,
    PrismaChatRepository,
    PrismaDocumentRepository,

    // DI Bindings
    // Bind CHAT_REPOSITORY → PrismaChatRepository
    {
      provide: CHAT_REPOSITORY,
      useExisting: PrismaChatRepository,
    },
    // Bind DOCUMENT_REPOSITORY → PrismaDocumentRepository
    {
      provide: DOCUMENT_REPOSITORY,
      useExisting: PrismaDocumentRepository,
    },
    // Bind EMBEDDING_PROVIDER → LMStudioEmbeddingAdapter
    {
      provide: EMBEDDING_PROVIDER,
      useExisting: LMStudioEmbeddingAdapter,
    },

    // Bind AI_PROVIDERS → [GroqAdapter, LMStudioAdapter] theo thứ tự ưu tiên
    // Groq trước (cloud, rẻ hơn) → LMStudio sau (fallback)
    {
      provide: AI_PROVIDERS,
      useFactory: (groq: GroqAdapter, lm: LMStudioAdapter): IAIProvider[] => [groq, lm],
      inject: [GroqAdapter, LMStudioAdapter],
    },
  ],
})
export class ChatModule {}