import { describe, expect, it } from 'vitest';
import { buildPdfStoragePath } from '@/lib/rag/documents';

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
