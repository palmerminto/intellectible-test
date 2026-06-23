import { beforeEach, describe, expect, it, vi } from 'vitest';

const { listDocumentsMock, resolveDemoDocumentsMock } = vi.hoisted(() => ({
  listDocumentsMock: vi.fn(),
  resolveDemoDocumentsMock: vi.fn(),
}));

vi.mock('@/lib/rag/documents', () => ({
  listDocuments: listDocumentsMock,
}));

vi.mock('@/lib/demo-documents', () => ({
  resolveDemoDocuments: resolveDemoDocumentsMock,
}));

import { GET } from '@/app/api/documents/route';

describe('GET /api/documents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns persisted documents when demo mode is not active', async () => {
    listDocumentsMock.mockResolvedValue([
      {
        id: 'doc-1',
        filename: 'proposal.pdf',
        status: 'ready',
        sizeBytes: 1024,
        pageCount: 3,
        errorMessage: null,
        createdAt: '2026-06-22T12:00:00.000Z',
      },
    ]);

    const response = await GET(new Request('http://localhost/api/documents'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      documents: [
        {
          id: 'doc-1',
          filename: 'proposal.pdf',
          status: 'ready',
          sizeBytes: 1024,
          pageCount: 3,
          errorMessage: null,
          createdAt: '2026-06-22T12:00:00.000Z',
        },
      ],
    });
    expect(listDocumentsMock).toHaveBeenCalledOnce();
    expect(resolveDemoDocumentsMock).not.toHaveBeenCalled();
  });

  it('returns demo documents when demoDocs is set', async () => {
    resolveDemoDocumentsMock.mockReturnValue([
      {
        id: 'demo-1',
        filename: 'demo.pdf',
        status: 'processing',
        sizeBytes: null,
        pageCount: null,
        errorMessage: null,
        createdAt: '2026-06-22T12:00:00.000Z',
      },
    ]);

    const response = await GET(new Request('http://localhost/api/documents?demoDocs=processing'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      documents: [
        {
          id: 'demo-1',
          filename: 'demo.pdf',
          status: 'processing',
          sizeBytes: null,
          pageCount: null,
          errorMessage: null,
          createdAt: '2026-06-22T12:00:00.000Z',
        },
      ],
    });
    expect(resolveDemoDocumentsMock).toHaveBeenCalledWith('processing');
    expect(listDocumentsMock).not.toHaveBeenCalled();
  });

  it('returns 500 when persisted documents cannot be loaded', async () => {
    listDocumentsMock.mockRejectedValue(new Error('Database unavailable'));

    const response = await GET(new Request('http://localhost/api/documents'));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Database unavailable' });
  });
});
