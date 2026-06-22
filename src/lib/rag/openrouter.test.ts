import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/env', () => ({
  env: {
    OPENROUTER_API_KEY: 'test-key',
    OPENROUTER_BASE_URL: 'https://openrouter.test/api/v1',
  },
}));

import { embedTexts } from '@/lib/rag/openrouter';

describe('embedTexts', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns embeddings in input order', async () => {
    const embeddingA = Array.from({ length: 1536 }, (_, index) => index * 0.001);
    const embeddingB = Array.from({ length: 1536 }, (_, index) => index * 0.002);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            { index: 0, embedding: embeddingA },
            { index: 1, embedding: embeddingB },
          ],
        }),
      }),
    );

    const embeddings = await embedTexts(['first chunk', 'second chunk']);

    expect(embeddings).toHaveLength(2);
    expect(embeddings[0]).toEqual(embeddingA);
    expect(embeddings[1]).toEqual(embeddingB);
  });

  it('throws when the API returns the wrong number of embeddings', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [{ index: 0, embedding: Array.from({ length: 1536 }, () => 0.1) }],
        }),
      }),
    );

    await expect(embedTexts(['first chunk', 'second chunk'])).rejects.toThrow(
      'OpenRouter returned 1 embeddings for 2 input texts',
    );
  });

  it('throws when an embedding has the wrong dimension count', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [{ index: 0, embedding: [0.1, 0.2, 0.3] }],
        }),
      }),
    );

    await expect(embedTexts(['bad dimensions'])).rejects.toThrow('expected 1536');
  });
});
