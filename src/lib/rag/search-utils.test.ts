import { describe, expect, it } from 'vitest';
import {
  buildSnippet,
  extractSearchTerms,
  highlightSnippet,
  mergeWithRrf,
  toSearchResult,
} from '@/lib/rag/search-utils';
import type { SearchCandidate } from '@/lib/rag/types';

function makeCandidate(id: string, score = 0): SearchCandidate {
  return {
    chunkId: id,
    documentId: `doc-${id}`,
    filename: 'example.pdf',
    content: `Content for ${id}`,
    page: 1,
    score,
  };
}

describe('extractSearchTerms', () => {
  it('returns lowercase terms longer than two characters', () => {
    expect(extractSearchTerms('Cloud Migration RFP')).toEqual(['cloud', 'migration', 'rfp']);
  });

  it('ignores very short tokens', () => {
    expect(extractSearchTerms('a an the scope')).toEqual(['the', 'scope']);
  });
});

describe('mergeWithRrf', () => {
  it('boosts chunks that appear in both result lists', () => {
    const vectorResults = [makeCandidate('a'), makeCandidate('b')];
    const keywordResults = [makeCandidate('b'), makeCandidate('c')];

    const merged = mergeWithRrf(vectorResults, keywordResults);

    expect(merged[0].chunkId).toBe('b');
    expect(merged[0].score).toBeGreaterThan(merged[1].score);
  });
});

describe('buildSnippet', () => {
  it('truncates long content at a word boundary', () => {
    const content = `${'scope '.repeat(120)}final`;
    const snippet = buildSnippet(content, 40);

    expect(snippet.endsWith('…')).toBe(true);
    expect(snippet.length).toBeLessThanOrEqual(41);
  });
});

describe('highlightSnippet', () => {
  it('wraps matched query terms in plain-text markers', () => {
    expect(highlightSnippet('Scope includes cloud migration.', 'cloud migration')).toBe(
      'Scope includes [cloud] [migration].',
    );
  });
});

describe('toSearchResult', () => {
  it('maps internal candidates to the API response shape', () => {
    const result = toSearchResult(makeCandidate('chunk-1', 0.42), 'scope');

    expect(result).toMatchObject({
      id: 'chunk-1',
      documentId: 'doc-chunk-1',
      filename: 'example.pdf',
      page: 1,
      score: 0.42,
    });
    expect(result.snippet).toContain('Content for chunk-1');
    expect(result.highlightedSnippet).toBeTruthy();
  });
});
