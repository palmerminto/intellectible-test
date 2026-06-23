import { describe, expect, it } from 'vitest';
import { buildPdfStoragePath, mapStoredDocumentToApi } from '@/lib/rag/documents';

describe('buildPdfStoragePath', () => {
  it('builds a deterministic storage path from document id and filename', () => {
    expect(buildPdfStoragePath('doc-123', 'proposal.pdf')).toBe('doc-123/proposal.pdf');
  });

  it('sanitises unsafe filename characters', () => {
    expect(buildPdfStoragePath('doc-123', 'my proposal (final).pdf')).toBe(
      'doc-123/my_proposal_final_.pdf',
    );
  });

  it('falls back to document.pdf when the filename is empty after sanitisation', () => {
    expect(buildPdfStoragePath('doc-123', '***')).toBe('doc-123/document.pdf');
  });
});

describe('mapStoredDocumentToApi', () => {
  it('maps snake_case database fields to the API document shape', () => {
    expect(
      mapStoredDocumentToApi({
        id: 'doc-1',
        filename: 'proposal.pdf',
        status: 'ready',
        size_bytes: 1024,
        page_count: 8,
        error_message: null,
        created_at: '2026-06-22T12:00:00.000Z',
      }),
    ).toEqual({
      id: 'doc-1',
      filename: 'proposal.pdf',
      status: 'ready',
      sizeBytes: 1024,
      pageCount: 8,
      errorMessage: null,
      createdAt: '2026-06-22T12:00:00.000Z',
    });
  });

  it('falls back to processing for unknown persisted statuses', () => {
    expect(
      mapStoredDocumentToApi({
        id: 'doc-2',
        filename: 'notes.pdf',
        status: 'unexpected',
        size_bytes: null,
        page_count: null,
        error_message: null,
        created_at: '2026-06-22T12:00:00.000Z',
      }).status,
    ).toBe('processing');
  });
});
