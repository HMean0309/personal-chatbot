import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import type { IAIProvider, AICompletionRequest, AIStreamChunk } from '../../../domain/interfaces/ai-provider.interface';
import type { AIProvider } from '../../../domain/entities/message.entity';

@Injectable()
export class GroqAdapter implements IAIProvider {
  private readonly logger = new Logger(GroqAdapter.name);
  private readonly client: Groq;

  readonly providerName: AIProvider = 'groq';
  readonly providerType: 'cloud' | 'local' = 'cloud';
  readonly defaultModel: string;

  constructor(private readonly config: ConfigService) {
    this.client = new Groq({
      apiKey: this.config.getOrThrow<string>('GROQ_API_KEY'),
    });
    this.defaultModel = this.config.get<string>(
      'GROQ_DEFAULT_MODEL',
      'llama-3.3-70b-versatile',
    );
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }

  async *streamCompletion(
    request: AICompletionRequest,
  ): AsyncGenerator<AIStreamChunk, void, unknown> {
    this.logger.debug(`Calling Groq: ${request.model}`);

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