import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IAIProvider, AIStreamChunk } from '../../../domain/interfaces/ai-provider.interface';
import type { IChatRepository } from '../../../domain/interfaces/chat-repository.interface';
import { AI_PROVIDERS, CHAT_REPOSITORY } from '../../constants/injection-tokens';
import type { SendMessageInputDTO } from './dto/send-message-input.dto';
import {
  AllProvidersExhaustedException,
  ConversationNotFoundException,
  PrivateConversationNoLocalProviderException,
} from '../../../domain/exceptions/domain.exceptions';
import { DOCUMENT_REPOSITORY, EMBEDDING_PROVIDER } from '../../constants/injection-tokens';
import type { IDocumentRepository } from '../../../domain/interfaces/document-repository.interface';
import type { IEmbeddingProvider } from '../../../domain/interfaces/embedding-provider.interface';

@Injectable()
export class SendMessageUseCase {
  private readonly logger = new Logger(SendMessageUseCase.name);

  constructor(
    @Inject(AI_PROVIDERS) private readonly aiProviders: IAIProvider[],
    @Inject(CHAT_REPOSITORY) private readonly chatRepository: IChatRepository,
    @Inject(DOCUMENT_REPOSITORY) private readonly docRepo: IDocumentRepository,
    @Inject(EMBEDDING_PROVIDER) private readonly embedder: IEmbeddingProvider,
  ) {}

  async *execute(input: SendMessageInputDTO): AsyncGenerator<AIStreamChunk, void, unknown> {
    // Bước 1: Load conversation
    const conversation = await this.chatRepository.findConversationById(input.conversationId);
    if (!conversation) throw new ConversationNotFoundException(input.conversationId);

    // Bước 2: Filter providers theo isPublic
    const allowedTypes = conversation.getAllowedProviderTypes();
    const eligible = this.aiProviders.filter((p) => allowedTypes.includes(p.providerType));
    if (eligible.length === 0) throw new PrivateConversationNoLocalProviderException();

    this.logger.log(
      `Conversation "${conversation.id}" isPublic=${conversation.isPublic}. ` +
      `Eligible: ${eligible.map((p) => p.providerName).join(', ')}`,
    );

    // Bước 3: Persist user message
    await this.chatRepository.createMessage({
      conversationId: input.conversationId,
      role: 'user',
      content: input.content,
      provider: 'unknown',
      model: 'none',
    });

    // Bước 4: Context window theo token budget
    const history = conversation.getContextWindowByTokenBudget(12000);

    // Bước 5: Build system prompt
    const systemPromptContent =
      conversation.systemPrompt ?? this.buildSystemPromptByMode(conversation.mode);

    // Bước 6: Inject file attachments
    const attachmentContext =
      input.attachments
        ?.map((a) => `<file name="${a.filename}">\n${a.content}\n</file>`)
        .join('\n\n') ?? '';

    let fullSystemPrompt = systemPromptContent +
      (attachmentContext
        ? `\n\n---\nUser provided the following files:\n${attachmentContext}`
        : '');

    // Bước 7: RAG — inject chunks liên quan từ uploaded documents
    try {
      const queryEmbedding = await this.embedder.embed(input.content);
      const relevantChunks = await this.docRepo.searchSimilarChunks(
        input.conversationId,
        queryEmbedding,
        5,
      );
      if (relevantChunks.length > 0) {
        fullSystemPrompt +=
          '\n\n## Attached Documents\n' +
          relevantChunks
            .map((c, i) => `[Document ${i + 1}]\n${c.content}`)
            .join('\n\n');
      }
    } catch {
      // LM Studio offline → bỏ qua RAG, chat vẫn hoạt động bình thường
    }

    const aiMessages = [
      { role: 'system' as const, content: fullSystemPrompt },
      ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: input.content },
    ];

    // Bước 8: Thực thi với fallback chain
    yield* this.executeWithFallback(input.conversationId, aiMessages, eligible);
  }

  private async *executeWithFallback(
    conversationId: string,
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
    providers: IAIProvider[],
  ): AsyncGenerator<AIStreamChunk, void, unknown> {
    let lastError: Error | null = null;

    for (const provider of providers) {
      try {
        this.logger.log(`Attempting provider: ${provider.providerName}`);

        const stream = provider.streamCompletion({
          messages,
          model: provider.defaultModel,
          stream: true,
          temperature: 0.7,
          maxTokens: 2048,
        });

        let accumulated = '';
        let hasYieldedTokens = false;

        for await (const chunk of stream) {
          if (chunk.content) {
            hasYieldedTokens = true;
            accumulated += chunk.content;
          }
          yield chunk;

          if (chunk.isFinished) {
            await this.chatRepository.createMessage({
              conversationId,
              role: 'assistant',
              content: accumulated,
              provider: provider.providerName,
              model: provider.defaultModel,
              tokenCount: chunk.tokenCount,
            });
            const conv = await this.chatRepository.findConversationById(conversationId);
            if (conv && (!conv.title || conv.title.trim() === '')) {
              const newTitle = conv.deriveTitle();
              if (newTitle && newTitle !== 'New Conversation') {
                await this.chatRepository.updateConversation(conversationId, { title: newTitle });
              }
            }
            yield { content: '', isFinished: true, tokenCount: chunk.tokenCount, providerName: provider.providerName };
          }
        }
        return; // thành công → thoát

      } catch (error) {
        lastError = error as Error;
        if (this.isFallbackEligible(error)) {
          this.logger.warn(`${provider.providerName} failed: ${(error as Error).message}. Trying next...`);
          continue;
        }
        throw error; // lỗi không thể fallback → ném ngay
      }
    }

    throw new AllProvidersExhaustedException();
  }

  private buildSystemPromptByMode(mode: string): string {
    const date = new Date().toISOString().split('T')[0];
    const presets: Record<string, string> = {
      coding:  `You are a senior software engineer. Provide concise, production-ready code. Prefer TypeScript. Current date: ${date}.`,
      docs:    `You are a technical writer. Summarize clearly, highlight key points. Respond in the user's language. Current date: ${date}.`,
      general: `You are a helpful, concise, and accurate AI assistant. Respond in the user's language. Current date: ${date}.`,
    };
    return presets[mode] ?? presets['general'];
  }

  private isFallbackEligible(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    const msg = error.message.toLowerCase();
    return (
      msg.includes('rate limit') || msg.includes('429') ||
      msg.includes('econnrefused')  || msg.includes('enotfound') ||
      msg.includes('timeout')       || msg.includes('etimedout') ||
      msg.includes('503')           || msg.includes('service unavailable') ||
      msg.includes('overloaded')    || msg.includes('capacity')
    );
  }
}