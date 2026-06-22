import type { SearchCandidate } from '@/lib/rag/types';
import type { SearchResult } from '@/types/search';

const RRF_K = 60;

/**
 * Extract keyword-search terms from a user query.
 *
 * Very short tokens are ignored because they add noise to full-text search.
 *
 * @param query - Raw search query from the UI.
 * @returns Lowercase terms suitable for highlighting and keyword search.
 */
export function extractSearchTerms(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 2);
}

/**
 * Merge vector and keyword result lists with reciprocal rank fusion.
 *
 * @param vectorResults - Semantic matches ordered by vector similarity.
 * @param keywordResults - Keyword matches ordered by full-text rank.
 * @returns Combined candidates sorted by fused score.
 */
export function mergeWithRrf(
  vectorResults: SearchCandidate[],
  keywordResults: SearchCandidate[],
): SearchCandidate[] {
  const merged = new Map<string, SearchCandidate & { rrfScore: number }>();

  vectorResults.forEach((result, rank) => {
    merged.set(result.chunkId, {
      ...result,
      rrfScore: 1 / (RRF_K + rank + 1),
    });
  });

  keywordResults.forEach((result, rank) => {
    const existing = merged.get(result.chunkId);
    const contribution = 1 / (RRF_K + rank + 1);

    if (existing) {
      existing.rrfScore += contribution;
      return;
    }

    merged.set(result.chunkId, {
      ...result,
      rrfScore: contribution,
    });
  });

  return [...merged.values()]
    .sort((left, right) => right.rrfScore - left.rrfScore)
    .map(({ rrfScore, ...result }) => ({
      ...result,
      score: rrfScore,
    }));
}

/**
 * Build a concise plain-text snippet for a result card.
 *
 * @param content - Full chunk content from the database.
 * @param maxLength - Maximum snippet length in characters.
 * @returns Truncated snippet ending at a word boundary where possible.
 */
export function buildSnippet(content: string, maxLength = 450): string {
  const normalised = content.replace(/\s+/g, ' ').trim();
  if (normalised.length <= maxLength) {
    return normalised;
  }

  const truncated = normalised.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  const safeCut = lastSpace > maxLength * 0.6 ? truncated.slice(0, lastSpace) : truncated;
  return `${safeCut.trim()}…`;
}

/**
 * Wrap matched query terms in plain-text markers for display.
 *
 * @param snippet - Base snippet text.
 * @param query - Original user query.
 * @returns Snippet with matched terms wrapped in `[term]`.
 */
export function highlightSnippet(snippet: string, query: string): string {
  const terms = extractSearchTerms(query);

  if (terms.length === 0) {
    return snippet;
  }

  let highlighted = snippet;
  for (const term of terms) {
    const pattern = new RegExp(`(${escapeRegExp(term)})`, 'ig');
    highlighted = highlighted.replace(pattern, '[$1]');
  }

  return highlighted;
}

/**
 * Convert an internal search candidate into the API response shape.
 *
 * @param candidate - Merged hybrid-search result.
 * @param query - Original user query used for highlighting.
 * @returns Result object consumed by the search route and UI.
 */
export function toSearchResult(candidate: SearchCandidate, query: string): SearchResult {
  const snippet = buildSnippet(candidate.content);

  return {
    id: candidate.chunkId,
    snippet,
    highlightedSnippet: highlightSnippet(snippet, query),
    documentId: candidate.documentId,
    filename: candidate.filename,
    page: candidate.page,
    score: candidate.score,
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
