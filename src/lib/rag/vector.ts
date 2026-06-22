/**
 * Format a numeric embedding array for Postgres pgvector columns.
 *
 * Supabase accepts pgvector literals as strings like `[0.1,0.2,...]`.
 *
 * @param embedding - 1536-dimension embedding vector.
 * @returns pgvector-compatible string literal.
 */
export function formatEmbeddingForPgVector(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}
