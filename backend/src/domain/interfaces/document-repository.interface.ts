export interface CreateDocumentDto {
  conversationId: string;
  fileName: string;
  fileType: string;
}

export interface CreateChunkDto {
  documentId: string;
  content: string;
  chunkIndex: number;
  embedding: number[];
}

export interface DocumentInfo {
  id: string;
  fileName: string;
  fileType: string;
  createdAt: Date;
}

export interface IDocumentRepository {
  createDocument(data: CreateDocumentDto): Promise<string>;
  createChunks(chunks: CreateChunkDto[]): Promise<void>;
  searchSimilarChunks(
    conversationId: string,
    embedding: number[],
    topK: number
  ): Promise<{ content: string; chunkIndex: number }[]>;
  deleteDocument(documentId: string): Promise<void>;
  getDocumentsByConversation(conversationId: string): Promise<DocumentInfo[]>;
}