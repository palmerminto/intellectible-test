import { beforeEach, describe, expect, it, vi } from 'vitest';

const { searchDocumentsMock, resolveDemoSearchMock } = vi.hoisted(() => ({
  searchDocumentsMock: vi.fn(),
  resolveDemoSearchMock: vi.fn(),
}));

vi.mock('@/lib/rag/search', () => ({
  searchDocuments: searchDocumentsMock,
}));

vi.mock('@/lib/demo-search', () => ({
  resolveDemoSearch: resolveDemoSearchMock,
}));

import { GET } from '@/app/api/search/route';

describe('GET /api/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveDemoSearchMock.mockResolvedValue({ kind: 'inactive' });
  });

  it('returns 400 when q is missing', async () => {
    const response = await GET(new Request('http://localhost/api/search'));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Query parameter q is required' });
    expect(searchDocumentsMock).not.toHaveBeenCalled();
  });

  it('returns demo results without calling searchDocuments when demoSearch=results', async () => {
    resolveDemoSearchMock.mockResolvedValue({
      kind: 'results',
      results: [
        {
          id: 'demo-chunk-1',
          snippet: 'Demo snippet',
          highlightedSnippet: '[Demo] snippet',
          documentId: 'demo-doc-1',
          filename: 'demo.pdf',
          page: 1,
          score: 0.8,
        },
      ],
    });

    const response = await GET(
      new Request('http://localhost/api/search?q=cloud+migration&demoSearch=results'),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      results: [
        {
          id: 'demo-chunk-1',
          snippet: 'Demo snippet',
          highlightedSnippet: '[Demo] snippet',
          documentId: 'demo-doc-1',
          filename: 'demo.pdf',
          page: 1,
          score: 0.8,
        },
      ],
    });
    expect(resolveDemoSearchMock).toHaveBeenCalledWith('results', 'cloud migration');
    expect(searchDocumentsMock).not.toHaveBeenCalled();
  });

  it('returns real search results when demo mode is not active', async () => {
    searchDocumentsMock.mockResolvedValue([
      {
        id: 'chunk-a',
        snippet: 'Scope includes cloud migration.',
        highlightedSnippet: 'Scope includes [cloud] [migration].',
        documentId: 'doc-1',
        filename: 'proposal.pdf',
        page: 2,
        score: 0.42,
      },
    ]);

    const response = await GET(new Request('http://localhost/api/search?q=cloud+migration'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      results: [
        {
          id: 'chunk-a',
          snippet: 'Scope includes cloud migration.',
          highlightedSnippet: 'Scope includes [cloud] [migration].',
          documentId: 'doc-1',
          filename: 'proposal.pdf',
          page: 2,
          score: 0.42,
        },
      ],
    });
    expect(resolveDemoSearchMock).toHaveBeenCalledWith('', 'cloud migration');
    expect(searchDocumentsMock).toHaveBeenCalledWith('cloud migration');
  });

  it('returns 500 when real search fails', async () => {
    searchDocumentsMock.mockRejectedValue(new Error('OpenRouter embeddings request failed'));

    const response = await GET(new Request('http://localhost/api/search?q=cloud+migration'));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'Search failed',
    });
  });
});
