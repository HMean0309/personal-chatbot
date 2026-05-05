import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type { IAIProvider, AICompletionRequest, AIStreamChunk } from '../../../domain/interfaces/ai-provider.interface';
import type { AIProvider } from '../../../domain/entities/message.entity';

@Injectable()
export class LMStudioAdapter implements IAIProvider {
  private readonly logger = new Logger(LMStudioAdapter.name);
  private readonly client: OpenAI;
  private readonly baseUrl: string;

  readonly providerName: AIProvider = 'lmstudio';
  readonly providerType: 'cloud' | 'local' = 'local';
  readonly defaultModel: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config.get<string>(
      'LMSTUDIO_BASE_URL',
      'http://localhost:1234/v1',
    );
    this.client = new OpenAI({
      apiKey: 'lm-studio',
      baseURL: this.baseUrl,
    });
    this.defaultModel = this.config.get<string>(
      'LMSTUDIO_DEFAULT_MODEL',
      'local-model',
    );
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        signal: AbortSignal.timeout(2000),
      });
      return res.ok;
    } catch {
      this.logger.warn(`LM Studio not reachable at ${this.baseUrl}`);
      return false;
    }
  }

  async *streamCompletion(
    request: AICompletionRequest,
  ): AsyncGenerator<AIStreamChunk, void, unknown> {
    this.logger.debug(`Calling LM Studio: ${request.model}`);

    const stream = await this.client.chat.completions.create({
      model: request.model,
      messages: request.messages,
      max_tokens: request.maxTokens ?? 2048,
      temperature: request.temperature ?? 0.7,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? '';
      const isFinished = chunk.choices[0]?.finish_reason !== null;

      yield {
        content: delta,
        isFinished,
        tokenCount: isFinished
          ? ((chunk as any).usage?.completion_tokens ?? undefined)
          : undefined,
        providerName: this.providerName,
      };
    }
  }
}