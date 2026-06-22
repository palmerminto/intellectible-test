import { createAdminClient } from '@/lib/supabase/admin';
import { embedTexts } from '@/lib/rag/openrouter';
import {
  extractSearchTerms,
  mergeWithRrf,
  toSearchResult,
} from '@/lib/rag/search-utils';
import type { SearchCandidate } from '@/lib/rag/types';
import { formatEmbeddingForPgVector } from '@/lib/rag/vector';
import type { SearchResult } from '@/types/search';

const DEFAULT_LIMIT = 10;

interface MatchChunkRow {
  chunk_id: string;
  document_id: string;
  filename: string;
  content: string;
  page: number;
  score: number;
}

function toCandidate(row: MatchChunkRow): SearchCandidate {
  return {
    chunkId: row.chunk_id,
    documentId: row.document_id,
    filename: row.filename,
    content: row.content,
    page: row.page,
    score: row.score,
  };
}

async function matchChunksVector(queryEmbedding: number[], matchCount: number) {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc('match_chunks_vector', {
    query_embedding: formatEmbeddingForPgVector(queryEmbedding),
    match_count: matchCount,
  });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as MatchChunkRow[]).map(toCandidate);
}

async function matchChunksKeyword(queryText: string, matchCount: number): Promise<SearchCandidate[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc('match_chunks_keyword', {
    query_text: queryText,
    match_count: matchCount,
  });

  if (error) {
    return [];
  }

  return ((data ?? []) as MatchChunkRow[]).map(toCandidate);
}

/**
 * Search indexed documents with hybrid vector + keyword retrieval.
 *
 * The query is embedded once, both retrieval paths fetch a wider candidate
 * pool, results are merged with reciprocal rank fusion, and the top matches
 * are formatted for the search API.
 *
 * @param query - User search query.
 * @param limit - Maximum number of results to return.
 * @returns Cited search results ready for the UI.
 */
export async function searchDocuments(query: string, limit = DEFAULT_LIMIT): Promise<SearchResult[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    throw new Error('Search query is required');
  }

  const candidateCount = Math.max(limit * 4, limit);
  const [queryEmbedding] = await embedTexts([trimmedQuery]);

  const keywordPromise =
    extractSearchTerms(trimmedQuery).length > 0
      ? matchChunksKeyword(trimmedQuery, candidateCount)
      : Promise.resolve([]);

  const [vectorResults, keywordResults] = await Promise.all([
    matchChunksVector(queryEmbedding, candidateCount),
    keywordPromise,
  ]);

  const merged = mergeWithRrf(vectorResults, keywordResults);
  return merged.slice(0, limit).map((candidate) => toSearchResult(candidate, trimmedQuery));
}
