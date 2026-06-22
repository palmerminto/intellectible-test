import { beforeEach, describe, expect, it, vi } from 'vitest';

const { extractTextMock, getDocumentProxyMock } = vi.hoisted(() => ({
  extractTextMock: vi.fn(),
  getDocumentProxyMock: vi.fn(),
}));

vi.mock('unpdf', () => ({
  extractText: extractTextMock,
  getDocumentProxy: getDocumentProxyMock,
}));

import { parsePdfPages } from '@/lib/rag/pdf';

describe('parsePdfPages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getDocumentProxyMock.mockResolvedValue({});
  });

  it('extracts readable text from a PDF buffer', async () => {
    extractTextMock.mockResolvedValue({
      text: ['Dummy PDF file'],
    });

    const pages = await parsePdfPages(Buffer.from('fake-pdf'));

    expect(pages).toHaveLength(1);
    expect(pages[0].page).toBe(1);
    expect(pages[0].text).toBe('Dummy PDF file');
  });

  it('throws when no readable text is found', async () => {
    extractTextMock.mockResolvedValue({
      text: ['', '   '],
    });

    await expect(parsePdfPages(Buffer.from('fake-pdf'))).rejects.toThrow(
      'No readable text found in PDF',
    );
  });
});
