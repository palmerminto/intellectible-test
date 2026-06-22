import { extractText, getDocumentProxy } from 'unpdf';
import type { ParsedPdfPage } from '@/lib/rag/types';

/**
 * Extract readable text from a PDF buffer, one entry per page.
 *
 * Empty pages are omitted. Throws when no text can be extracted, for example
 * on scanned PDFs without OCR.
 *
 * @param buffer - Raw PDF file bytes from upload or storage.
 * @returns Non-empty pages with 1-based page numbers.
 */
export async function parsePdfPages(buffer: Buffer): Promise<ParsedPdfPage[]> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text: pageTexts } = await extractText(pdf, { mergePages: false });

  const pages: ParsedPdfPage[] = pageTexts
    .map((text, index) => ({
      page: index + 1,
      text: text.trim(),
    }))
    .filter((page) => page.text.length > 0);

  if (pages.length === 0) {
    throw new Error('No readable text found in PDF');
  }

  return pages;
}
