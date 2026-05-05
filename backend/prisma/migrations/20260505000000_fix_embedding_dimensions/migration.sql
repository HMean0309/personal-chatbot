-- Fix embedding vector dimensions: 768 -> 192
-- The nomic-embed-text-v1.5 model in LMStudio returns 192-dimensional embeddings by default

-- Drop the existing index first
DROP INDEX IF EXISTS document_chunks_embedding_idx;

-- Alter the column type
ALTER TABLE "document_chunks" ALTER COLUMN "embedding" TYPE vector(192);

-- Recreate the IVFFlat index with the new dimension
CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
