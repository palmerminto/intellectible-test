import { describe, expect, it } from 'vitest';
import { parsePdfPages } from '@/lib/rag/pdf';

const DUMMY_PDF_URL =
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

describe('parsePdfPages integration', () => {
  it('extracts readable text from a real PDF buffer', async () => {
    const response = await fetch(DUMMY_PDF_URL);
    const buffer = Buffer.from(await response.arrayBuffer());

    const pages = await parsePdfPages(buffer);

    expect(pages).toHaveLength(1);
    expect(pages[0].page).toBe(1);
    expect(pages[0].text).toContain('Dummy PDF file');
  });
});
