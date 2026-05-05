import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import type {
  IDocumentRepository,
  CreateDocumentDto,
  CreateChunkDto,
  DocumentInfo,
} from '../../domain/interfaces/document-repository.interface';

@Injectable()
export class PrismaDocumentRepository implements IDocumentRepository {
  constructor(private prisma: PrismaService) {}

  async createDocument(data: CreateDocumentDto): Promise<string> {
    const doc = await this.prisma.document.create({
      data: {
        conversationId: data.conversationId,
        fileName: data.fileName,
        fileType: data.fileType,
      },
    });
    return doc.id;
  }

  async createChunks(chunks: CreateChunkDto[]): Promise<void> {
    for (const chunk of chunks) {
      const vectorStr = `[${chunk.embedding.join(',')}]`;
      await this.prisma.$executeRaw`
        INSERT INTO document_chunks (id, document_id, content, chunk_index, embedding)
        VALUES (
          gen_random_uuid(),
          ${chunk.documentId}::uuid,
          ${chunk.content},
          ${chunk.chunkIndex},
          ${vectorStr}::vector
        )
      `;
    }
  }

  async searchSimilarChunks(
    conversationId: string,
    embedding: number[],
    topK: number,
  ): Promise<{ content: string; chunkIndex: number }[]> {
    const vectorStr = `[${embedding.join(',')}]`;
    const results = await this.prisma.$queryRaw<
      { content: string; chunk_index: number }[]
    >`
      SELECT dc.content, dc.chunk_index
      FROM document_chunks dc
      JOIN documents d ON d.id = dc.document_id
      WHERE d.conversation_id = ${conversationId}::uuid
        AND dc.embedding IS NOT NULL
      ORDER BY dc.embedding <=> ${vectorStr}::vector
      LIMIT ${topK}
    `;
    return results.map((r) => ({
      content: r.content,
      chunkIndex: r.chunk_index,
    }));
  }

  async deleteDocument(documentId: string): Promise<void> {
    await this.prisma.document.delete({
      where: { id: documentId },
    });
  }

  async getDocumentsByConversation(
    conversationId: string,
  ): Promise<DocumentInfo[]> {
    return this.prisma.document.findMany({
      where: { conversationId },
      select: {
        id: true,
        fileName: true,
        fileType: true,
        createdAt: true,
      },
    });
  }
}