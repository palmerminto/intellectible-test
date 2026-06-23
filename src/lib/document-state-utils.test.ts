import { describe, expect, it } from 'vitest';
import {
  formatDocumentSize,
  getDocumentStatusMeta,
  getSearchDisabledMessage,
  hasProcessingDocuments,
  hasReadyDocuments,
} from '@/lib/document-state-utils';
import type { Document } from '@/types/document';

function makeDocument(overrides: Partial<Document> = {}): Document {
  return {
    id: 'doc-1',
    filename: 'example.pdf',
    status: 'ready',
    sizeBytes: 1024,
    pageCount: 10,
    errorMessage: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('document-state-utils', () => {
  it('detects processing and ready documents', () => {
    expect(hasProcessingDocuments([makeDocument({ status: 'processing' })])).toBe(true);
    expect(hasReadyDocuments([makeDocument({ status: 'ready' })])).toBe(true);
    expect(hasReadyDocuments([makeDocument({ status: 'failed' })])).toBe(false);
  });

  it('returns search-disabled messages for each library state', () => {
    expect(getSearchDisabledMessage([])).toBe('Upload a PDF to start indexing.');
    expect(getSearchDisabledMessage([makeDocument({ status: 'processing' })])).toBe(
      'Search will unlock when indexing finishes.',
    );
    expect(getSearchDisabledMessage([makeDocument({ status: 'failed' })])).toBe(
      'Upload a document or remove failed uploads before searching.',
    );
    expect(getSearchDisabledMessage([makeDocument({ status: 'ready' })])).toBeNull();
  });

  it('returns consistent status metadata', () => {
    const uploadingMeta = getDocumentStatusMeta('uploading');
    expect(uploadingMeta.label).toBe('Uploading');
    expect(uploadingMeta.color).toBe('gray');
    expect(uploadingMeta.isInProgress).toBe(true);
    expect(uploadingMeta.helperText).toContain('Uploading');

    const processingMeta = getDocumentStatusMeta('processing');
    expect(processingMeta.helperText).toContain('index');

    const readyMeta = getDocumentStatusMeta('ready');
    expect(readyMeta.isInProgress).toBe(false);
    expect(readyMeta.helperText).toBeNull();
  });

  it('formats document sizes', () => {
    expect(formatDocumentSize(null)).toBeNull();
    expect(formatDocumentSize(512)).toBe('512 B');
    expect(formatDocumentSize(2048)).toBe('2.0 KB');
    expect(formatDocumentSize(2 * 1024 * 1024)).toBe('2.0 MB');
  });
});
