import { DocumentNotFoundError } from '@/lib/rag/document-errors';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatEmbeddingForPgVector } from '@/lib/rag/vector';
import type { EmbeddedChunk } from '@/lib/rag/types';
import type { Document, DocumentStatus } from '@/types/document';

export { DocumentNotFoundError } from '@/lib/rag/document-errors';

/** Row shape returned when listing documents from Supabase. */
export interface StoredDocumentRow {
  id: string;
  filename: string;
  status: string;
  size_bytes: number | null;
  page_count: number | null;
  error_message: string | null;
  created_at: string;
}

const DOCUMENT_STATUSES = new Set<DocumentStatus>(['uploaded', 'processing', 'ready', 'failed']);

/**
 * Map a persisted document row to the API response shape.
 */
export function mapStoredDocumentToApi(row: StoredDocumentRow): Document {
  const status = DOCUMENT_STATUSES.has(row.status as DocumentStatus)
    ? (row.status as DocumentStatus)
    : 'processing';

  return {
    id: row.id,
    filename: row.filename,
    status,
    sizeBytes: row.size_bytes,
    pageCount: row.page_count,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  };
}

/**
 * List persisted documents, newest first.
 */
export async function listDocuments(): Promise<Document[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('documents')
    .select('id, filename, status, size_bytes, page_count, error_message, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapStoredDocumentToApi(row as StoredDocumentRow));
}

/**
 * Delete a document, its indexed chunks, and the stored PDF.
 *
 * Chunk rows are removed via `on delete cascade`. Storage cleanup is best-effort
 * after the database row is deleted.
 */
export async function deleteDocument(documentId: string): Promise<void> {
  const supabase = createAdminClient();

  const { data, error: fetchError } = await supabase
    .from('documents')
    .select('storage_path')
    .eq('id', documentId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (!data) {
    throw new DocumentNotFoundError();
  }

  const { error: deleteError } = await supabase.from('documents').delete().eq('id', documentId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const { error: storageError } = await supabase.storage.from('pdfs').remove([data.storage_path]);

  if (storageError) {
    console.error('Failed to delete PDF from storage', storageError);
  }
}

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
  id: string;
  filename: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<{ id: string }> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('documents')
    .insert({
      id: input.id,
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
 * Callers should mark the parent document `failed` if insertion throws.
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

  for (let index = 0; index < rows.length; index += CHUNK_INSERT_BATCH_SIZE) {
    const batch = rows.slice(index, index + CHUNK_INSERT_BATCH_SIZE);
    const { error: insertError } = await supabase.from('chunks').insert(batch);

    if (insertError) {
      throw new Error(insertError.message);
    }
  }
}
