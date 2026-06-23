import { describe, expect, it } from 'vitest';
import { hasPdfHeader, isAcceptedPdfUpload } from '@/lib/upload/upload-utils';

describe('hasPdfHeader', () => {
  it('returns true for buffers that start with %PDF', () => {
    expect(hasPdfHeader(new TextEncoder().encode('%PDF-1.4'))).toBe(true);
  });

  it('returns false for non-PDF buffers', () => {
    expect(hasPdfHeader(new TextEncoder().encode('not a pdf'))).toBe(false);
  });
});

describe('isAcceptedPdfUpload', () => {
  it('accepts standard application/pdf uploads with a PDF header', () => {
    const file = new File(['%PDF sample'], 'proposal.pdf', { type: 'application/pdf' });

    expect(isAcceptedPdfUpload(file, new TextEncoder().encode('%PDF sample'))).toBe(true);
  });

  it('accepts octet-stream uploads when the filename and header look like PDF', () => {
    const file = new File(['%PDF sample'], 'proposal.pdf', { type: 'application/octet-stream' });

    expect(isAcceptedPdfUpload(file, new TextEncoder().encode('%PDF sample'))).toBe(true);
  });

  it('rejects non-PDF files even when the filename ends with .pdf', () => {
    const file = new File(['plain text'], 'proposal.pdf', { type: 'text/plain' });

    expect(isAcceptedPdfUpload(file, new TextEncoder().encode('plain text'))).toBe(false);
  });
});
