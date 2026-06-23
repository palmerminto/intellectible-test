import { beforeEach, describe, expect, it, vi } from 'vitest';

const { deleteDocumentMock } = vi.hoisted(() => ({
  deleteDocumentMock: vi.fn(),
}));

import { DocumentNotFoundError } from '@/lib/rag/document-errors';

vi.mock('@/lib/rag/documents', () => ({
  deleteDocument: deleteDocumentMock,
}));

import { DELETE } from '@/app/api/documents/[id]/route';

describe('DELETE /api/documents/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes the document and returns 204', async () => {
    deleteDocumentMock.mockResolvedValue(undefined);

    const response = await DELETE(new Request('http://localhost/api/documents/doc-1'), {
      params: Promise.resolve({ id: 'doc-1' }),
    });

    expect(response.status).toBe(204);
    expect(deleteDocumentMock).toHaveBeenCalledWith('doc-1');
  });

  it('returns 404 when the document does not exist', async () => {
    deleteDocumentMock.mockRejectedValue(new DocumentNotFoundError());

    const response = await DELETE(new Request('http://localhost/api/documents/missing'), {
      params: Promise.resolve({ id: 'missing' }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'Document not found' });
  });
});
