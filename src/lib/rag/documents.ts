import { createAdminClient } from '@/lib/supabase/admin';
import { formatEmbeddingForPgVector } from '@/lib/rag/vector';
import type { EmbeddedChunk } from '@/lib/rag/types';

const CHUNK_INSERT_BATCH_SIZE = 100;

/**
 * Build a deterministic Supabase Storage path for an uploaded PDF.
 *
 * @param documentId - Database ID for the parent document row.
 * @param filename - Original uploaded filename.
 * @returns Safe storage key in the form `{documentId}/{filename}`.
 */
export function buildPdfStoragePath(documentId: string, filename: string): string {
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_+|_+$/g, '') || 'document.pdf';
  return `${documentId}/${safeFilename}`;
}

/**
 * Create a document row while ingestion is in progress.
 *
 * @param input - Upload metadata captured at the start of ingestion.
 * @returns The newly created document ID.
 */
export async function createProcessingDocument(input: {
  filename: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<{ id: string }> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('documents')
    .insert({
      filename: input.filename,
      storage_path: input.storagePath,
      mime_type: input.mimeType,
      size_bytes: input.sizeBytes,
      status: 'processing',
      error_message: null,
      page_count: null,
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create document row');
  }

  return { id: data.id };
}

/**
 * Mark a document as indexed and searchable.
 *
 * @param documentId - Document to update.
 * @param pageCount - Number of parsed PDF pages indexed for the document.
 */
export async function markDocumentReady(documentId: string, pageCount: number): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('documents')
    .update({
      status: 'ready',
      error_message: null,
      page_count: pageCount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', documentId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Mark a document as failed and store a short error message for the UI.
 *
 * @param documentId - Document to update.
 * @param errorMessage - Human-readable ingestion failure reason.
 */
export async function markDocumentFailed(documentId: string, errorMessage: string): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('documents')
    .update({
      status: 'failed',
      error_message: errorMessage.slice(0, 500),
      updated_at: new Date().toISOString(),
    })
    .eq('id', documentId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Replace all indexed chunks for a document.
 *
 * Existing rows are deleted first, then new chunk rows are inserted in batches.
 * If insertion fails, the document is marked `failed` before the error is rethrown.
 *
 * @param documentId - Parent document ID.
 * @param chunks - Embedded chunks to persist.
 */
export async function replaceDocumentChunks(
  documentId: string,
  chunks: EmbeddedChunk[],
): Promise<void> {
  const supabase = createAdminClient();

  const { error: deleteError } = await supabase.from('chunks').delete().eq('document_id', documentId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (chunks.length === 0) {
    return;
  }

  const rows = chunks.map((chunk) => ({
    document_id: documentId,
    content: chunk.content,
    page: chunk.page,
    chunk_index: chunk.chunkIndex,
    embedding: formatEmbeddingForPgVector(chunk.embedding),
  }));

  try {
    for (let index = 0; index < rows.length; index += CHUNK_INSERT_BATCH_SIZE) {
      const batch = rows.slice(index, index + CHUNK_INSERT_BATCH_SIZE);
      const { error: insertError } = await supabase.from('chunks').insert(batch);

      if (insertError) {
        throw new Error(insertError.message);
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to insert document chunks';
    await markDocumentFailed(documentId, `Indexing failed: ${message}`);
    throw error;
  }
}
