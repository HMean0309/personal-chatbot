import { Inject, Injectable } from '@nestjs/common';
import { DOCUMENT_REPOSITORY, EMBEDDING_PROVIDER } from '../../constants/injection-tokens';
import type { IDocumentRepository } from '../../../domain/interfaces/document-repository.interface';
import type { IEmbeddingProvider } from '../../../domain/interfaces/embedding-provider.interface';

@Injectable()
export class UploadDocumentUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private docRepo: IDocumentRepository,
    @Inject(EMBEDDING_PROVIDER) private embedder: IEmbeddingProvider,
  ) {}

  private chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    let i = 0;
    while (i < words.length) {
      chunks.push(words.slice(i, i + chunkSize).join(' '));
      i += chunkSize - overlap;
    }
    return chunks;
  }

  async execute(input: {
    conversationId: string;
    fileName: string;
    fileType: string;
    content: string;
  }): Promise<{ documentId: string; chunkCount: number }> {
    const documentId = await this.docRepo.createDocument({
      conversationId: input.conversationId,
      fileName: input.fileName,
      fileType: input.fileType,
    });

    const chunks = this.chunkText(input.content);
    const embeddings = await this.embedder.embedBatch(chunks);

    await this.docRepo.createChunks(
      chunks.map((content, i) => ({
        documentId,
        content,
        chunkIndex: i,
        embedding: embeddings[i],
      })),
    );

    return { documentId, chunkCount: chunks.length };
  }
}