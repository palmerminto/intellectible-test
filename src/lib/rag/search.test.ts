import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock, embedTextsMock } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
  embedTextsMock: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    rpc: rpcMock,
  }),
}));

vi.mock('@/lib/rag/openrouter', () => ({
  embedTexts: embedTextsMock,
}));

import { searchDocuments } from '@/lib/rag/search';

describe('searchDocuments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    embedTextsMock.mockResolvedValue([Array.from({ length: 1536 }, () => 0.1)]);
  });

  it('throws when the query is empty', async () => {
    await expect(searchDocuments('   ')).rejects.toThrow('Search query is required');
  });

  it('merges vector and keyword matches into API results', async () => {
    rpcMock.mockImplementation((name: string) => {
      if (name === 'match_chunks_vector') {
        return {
          data: [
            {
              chunk_id: 'chunk-a',
              document_id: 'doc-1',
              filename: 'proposal.pdf',
              content: 'Scope includes cloud migration.',
              page: 2,
              score: 0.9,
            },
          ],
          error: null,
        };
      }

      if (name === 'match_chunks_keyword') {
        return {
          data: [
            {
              chunk_id: 'chunk-b',
              document_id: 'doc-1',
              filename: 'proposal.pdf',
              content: 'Migration timeline and milestones.',
              page: 4,
              score: 0.7,
            },
          ],
          error: null,
        };
      }

      return { data: [], error: null };
    });

    const results = await searchDocuments('cloud migration', 2);

    expect(embedTextsMock).toHaveBeenCalledWith(['cloud migration']);
    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({
      id: 'chunk-a',
      filename: 'proposal.pdf',
      page: 2,
    });
    expect(results[1].id).toBe('chunk-b');
  });

  it('skips keyword search when the query has no usable terms', async () => {
    rpcMock.mockImplementation((name: string) => {
      if (name === 'match_chunks_vector') {
        return {
          data: [
            {
              chunk_id: 'chunk-a',
              document_id: 'doc-1',
              filename: 'proposal.pdf',
              content: 'Scope includes cloud migration.',
              page: 1,
              score: 0.8,
            },
          ],
          error: null,
        };
      }

      return { data: [], error: null };
    });

    const results = await searchDocuments('a an', 1);

    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(rpcMock).toHaveBeenCalledWith('match_chunks_vector', expect.any(Object));
    expect(results).toHaveLength(1);
  });
});
