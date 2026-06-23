import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  buildPdfStoragePathMock,
  createProcessingDocumentMock,
  markDocumentFailedMock,
  markDocumentReadyMock,
  replaceDocumentChunksMock,
  parsePdfPagesMock,
  chunkPdfPagesMock,
  embedChunksMock,
  uploadMock,
} = vi.hoisted(() => ({
  buildPdfStoragePathMock: vi.fn(),
  createProcessingDocumentMock: vi.fn(),
  markDocumentFailedMock: vi.fn(),
  markDocumentReadyMock: vi.fn(),
  replaceDocumentChunksMock: vi.fn(),
  parsePdfPagesMock: vi.fn(),
  chunkPdfPagesMock: vi.fn(),
  embedChunksMock: vi.fn(),
  uploadMock: vi.fn(),
}));

vi.mock('@/lib/rag/documents', () => ({
  buildPdfStoragePath: buildPdfStoragePathMock,
  createProcessingDocument: createProcessingDocumentMock,
  markDocumentFailed: markDocumentFailedMock,
  markDocumentReady: markDocumentReadyMock,
  replaceDocumentChunks: replaceDocumentChunksMock,
}));

vi.mock('@/lib/rag/pdf', () => ({
  parsePdfPages: parsePdfPagesMock,
}));

vi.mock('@/lib/rag/chunk', () => ({
  chunkPdfPages: chunkPdfPagesMock,
}));

vi.mock('@/lib/rag/openrouter', () => ({
  embedChunks: embedChunksMock,
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    storage: {
      from: vi.fn(() => ({
        upload: uploadMock,
      })),
    },
  }),
}));

import { POST } from '@/app/api/documents/upload/route';
import { MAX_PDF_SIZE_BYTES } from '@/lib/upload/upload-utils';

const DOCUMENT_ID = '00000000-0000-4000-8000-000000000001';

function makeUploadRequest(file?: File): Request {
  const formData = new FormData();
  if (file) {
    formData.append('file', file);
  }

  return new Request('http://localhost/api/documents/upload', {
    method: 'POST',
    body: formData,
  });
}

describe('POST /api/documents/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(DOCUMENT_ID);

    buildPdfStoragePathMock.mockReturnValue(`${DOCUMENT_ID}/proposal.pdf`);
    createProcessingDocumentMock.mockResolvedValue({ id: DOCUMENT_ID });
    uploadMock.mockResolvedValue({ error: null });
    parsePdfPagesMock.mockResolvedValue([{ page: 1, text: 'Parsed PDF text' }]);
    chunkPdfPagesMock.mockReturnValue([
      { content: 'Parsed PDF text', page: 1, chunkIndex: 0 },
    ]);
    embedChunksMock.mockResolvedValue([
      {
        content: 'Parsed PDF text',
        page: 1,
        chunkIndex: 0,
        embedding: [0.1, 0.2, 0.3],
      },
    ]);
    replaceDocumentChunksMock.mockResolvedValue(undefined);
    markDocumentReadyMock.mockResolvedValue(undefined);
    markDocumentFailedMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 400 when no file is provided', async () => {
    const response = await POST(makeUploadRequest());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'No file provided' });
    expect(createProcessingDocumentMock).not.toHaveBeenCalled();
  });

  it('returns 400 when the file is not a PDF', async () => {
    const file = new File(['not a pdf'], 'notes.txt', { type: 'text/plain' });

    const response = await POST(makeUploadRequest(file));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Only PDF files are supported' });
    expect(createProcessingDocumentMock).not.toHaveBeenCalled();
  });

  it('returns 400 when the PDF is larger than 25 MB', async () => {
    const file = new File([new Uint8Array(MAX_PDF_SIZE_BYTES + 1)], 'large.pdf', {
      type: 'application/pdf',
    });

    const response = await POST(makeUploadRequest(file));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'PDF must be 25 MB or smaller' });
    expect(createProcessingDocumentMock).not.toHaveBeenCalled();
  });

  it('accepts octet-stream uploads when the file looks like a PDF', async () => {
    const file = new File(['%PDF sample'], 'proposal.pdf', { type: 'application/octet-stream' });

    const response = await POST(makeUploadRequest(file));

    expect(response.status).toBe(201);
    expect(createProcessingDocumentMock).toHaveBeenCalled();
  });

  it('returns 500 when document creation fails', async () => {
    const file = new File(['%PDF sample'], 'proposal.pdf', { type: 'application/pdf' });
    createProcessingDocumentMock.mockRejectedValue(new Error('Database unavailable'));

    const response = await POST(makeUploadRequest(file));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'Failed to start document ingestion: Database unavailable',
    });
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it('marks the document as failed when storage upload fails', async () => {
    const file = new File(['%PDF sample'], 'proposal.pdf', { type: 'application/pdf' });
    uploadMock.mockResolvedValue({ error: { message: 'Bucket unavailable' } });

    const response = await POST(makeUploadRequest(file));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'Storage upload failed: Bucket unavailable',
    });
    expect(markDocumentFailedMock).toHaveBeenCalledWith(
      DOCUMENT_ID,
      'Storage upload failed: Bucket unavailable',
    );
  });

  it('marks the document as failed when chunking produces no searchable text', async () => {
    const file = new File(['%PDF sample'], 'proposal.pdf', { type: 'application/pdf' });
    chunkPdfPagesMock.mockReturnValue([]);

    const response = await POST(makeUploadRequest(file));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'No searchable text chunks found',
    });
    expect(markDocumentFailedMock).toHaveBeenCalledWith(
      DOCUMENT_ID,
      'No searchable text chunks found',
    );
  });

  it('stores, indexes, and marks a PDF as ready', async () => {
    const file = new File(['%PDF sample'], 'proposal.pdf', { type: 'application/pdf' });

    const response = await POST(makeUploadRequest(file));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      documentId: DOCUMENT_ID,
      filename: 'proposal.pdf',
    });
    expect(createProcessingDocumentMock).toHaveBeenCalledWith({
      id: DOCUMENT_ID,
      filename: 'proposal.pdf',
      storagePath: `${DOCUMENT_ID}/proposal.pdf`,
      mimeType: 'application/pdf',
      sizeBytes: file.size,
    });
    expect(uploadMock).toHaveBeenCalledWith(
      `${DOCUMENT_ID}/proposal.pdf`,
      expect.any(Buffer),
      {
        contentType: 'application/pdf',
        upsert: false,
      },
    );
    expect(parsePdfPagesMock).toHaveBeenCalledWith(expect.any(Buffer));
    expect(replaceDocumentChunksMock).toHaveBeenCalledWith(DOCUMENT_ID, [
      {
        content: 'Parsed PDF text',
        page: 1,
        chunkIndex: 0,
        embedding: [0.1, 0.2, 0.3],
      },
    ]);
    expect(markDocumentReadyMock).toHaveBeenCalledWith(DOCUMENT_ID, 1);
    expect(markDocumentFailedMock).not.toHaveBeenCalled();
  });

  it('marks the document as failed when ingestion fails', async () => {
    const file = new File(['%PDF sample'], 'proposal.pdf', { type: 'application/pdf' });
    parsePdfPagesMock.mockRejectedValue(new Error('No readable text found in PDF'));

    const response = await POST(makeUploadRequest(file));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'No readable text found in PDF',
    });
    expect(markDocumentFailedMock).toHaveBeenCalledWith(
      DOCUMENT_ID,
      'No readable text found in PDF',
    );
    expect(markDocumentReadyMock).not.toHaveBeenCalled();
  });
});
