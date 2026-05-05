import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type { IEmbeddingProvider } from '../../../domain/interfaces/embedding-provider.interface';

@Injectable()
export class LMStudioEmbeddingAdapter implements IEmbeddingProvider {
  private client: OpenAI;
  private model: string;

  constructor(private config: ConfigService) {
    this.client = new OpenAI({
      baseURL: config.get('LMSTUDIO_BASE_URL'),
      apiKey: 'lm-studio',
    });
    this.model =
      config.get('LMSTUDIO_EMBEDDING_MODEL') ?? 'nomic-embed-text-v1.5';
  }

  async embed(text: string): Promise<number[]> {
    const res = await this.client.embeddings.create({
      model: this.model,
      input: text,
    });
    return res.data[0].embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const res = await this.client.embeddings.create({
      model: this.model,
      input: texts,
    });
    return res.data.map((d) => d.embedding);
  }
}