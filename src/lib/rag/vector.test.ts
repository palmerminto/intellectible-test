import { describe, expect, it } from 'vitest';
import { formatEmbeddingForPgVector } from '@/lib/rag/vector';

describe('formatEmbeddingForPgVector', () => {
  it('formats numeric arrays as pgvector literals', () => {
    expect(formatEmbeddingForPgVector([0.1, 0.2, 0.3])).toBe('[0.1,0.2,0.3]');
  });

  it('handles empty arrays', () => {
    expect(formatEmbeddingForPgVector([])).toBe('[]');
  });
});
