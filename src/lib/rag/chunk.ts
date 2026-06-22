import type { ParsedPdfPage, TextChunk } from '@/lib/rag/types';

// Character counts approximate the planned 500-800 token target without a tokenizer.
const TARGET_CHUNK_SIZE = 2500;
const OVERLAP_SIZE = 300;
const MIN_FLUSH_SIZE = TARGET_CHUNK_SIZE - 500;
const MAX_CHUNK_SIZE = TARGET_CHUNK_SIZE + 500;

/**
 * Split parsed PDF pages into retrieval-sized chunks.
 *
 * Chunks are sized by character count, keep their source page number for
 * citations, and include a small overlap when a page produces multiple chunks.
 *
 * @param pages - Page-aware text extracted from a PDF.
 * @returns Ordered chunks ready for embedding and indexing.
 */
export function chunkPdfPages(pages: ParsedPdfPage[]): TextChunk[] {
  const chunks: TextChunk[] = [];
  let chunkIndex = 0;

  for (const page of pages) {
    const paragraphs = page.text
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
      .filter(Boolean);

    let current = '';

    for (const paragraph of paragraphs) {
      for (const segment of expandParagraph(paragraph)) {
        current = joinText(current, segment);

        while (current.length >= MAX_CHUNK_SIZE) {
          ({ remainder: current, chunkIndex } = flushChunk(
            chunks,
            current,
            page.page,
            chunkIndex,
            TARGET_CHUNK_SIZE,
          ));
        }
      }
    }

    while (current.length >= MIN_FLUSH_SIZE) {
      ({ remainder: current, chunkIndex } = flushChunk(
        chunks,
        current,
        page.page,
        chunkIndex,
        TARGET_CHUNK_SIZE,
      ));
    }

    if (current.trim().length > 0) {
      chunkIndex = pushChunk(chunks, current.trim(), page.page, chunkIndex);
    }
  }

  return chunks.filter((chunk) => chunk.content.length > 0);
}

/**
 * Break an oversized paragraph into chunk-sized segments.
 *
 * @param paragraph - Single paragraph of page text.
 * @returns One or more segments that fit within the chunk size limits.
 */
function expandParagraph(paragraph: string): string[] {
  if (paragraph.length <= MAX_CHUNK_SIZE) {
    return [paragraph];
  }

  return splitLongText(paragraph, TARGET_CHUNK_SIZE);
}

/**
 * Append new text to the current chunk buffer with paragraph spacing.
 *
 * @param current - Text accumulated for the next chunk.
 * @param next - Additional paragraph or segment to append.
 * @returns Combined buffer text.
 */
function joinText(current: string, next: string): string {
  if (!current) {
    return next;
  }

  return `${current}\n\n${next}`;
}

/**
 * Push a completed chunk and advance the document-wide chunk counter.
 *
 * @param chunks - Accumulator for completed chunks.
 * @param content - Final chunk text.
 * @param page - Source page number for the chunk.
 * @param chunkIndex - Current chunk index within the document.
 * @returns Next available chunk index.
 */
function pushChunk(
  chunks: TextChunk[],
  content: string,
  page: number,
  chunkIndex: number,
): number {
  chunks.push({ content, page, chunkIndex });
  return chunkIndex + 1;
}

/**
 * Finalise the current buffer into a chunk and keep overlap for the next one.
 *
 * @param chunks - Accumulator for completed chunks.
 * @param current - Text currently being assembled.
 * @param page - Source page number for the chunk.
 * @param chunkIndex - Current chunk index within the document.
 * @param contentLength - Maximum characters to include in this chunk.
 * @returns Remaining overlap text and the next chunk index.
 */
function flushChunk(
  chunks: TextChunk[],
  current: string,
  page: number,
  chunkIndex: number,
  contentLength: number,
): { remainder: string; chunkIndex: number } {
  const content =
    current.length > contentLength ? current.slice(0, contentLength).trim() : current.trim();

  const nextIndex = pushChunk(chunks, content, page, chunkIndex);

  return {
    remainder: takeOverlapTail(content, OVERLAP_SIZE),
    chunkIndex: nextIndex,
  };
}

/**
 * Split very long text on word boundaries where possible.
 *
 * @param text - Input text longer than the target chunk size.
 * @param size - Target maximum segment length in characters.
 * @returns Ordered text segments.
 */
function splitLongText(text: string, size: number): string[] {
  const pieces: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + size, text.length);

    if (end < text.length) {
      const lastSpace = text.lastIndexOf(' ', end);
      if (lastSpace > start + size * 0.6) {
        end = lastSpace;
      }
    }

    pieces.push(text.slice(start, end).trim());
    start = end;
  }

  return pieces.filter(Boolean);
}

/**
 * Take the trailing characters from a chunk to seed the next chunk.
 *
 * Overlap improves retrieval when an answer spans a chunk boundary.
 *
 * @param text - Text from the chunk just finalised.
 * @param overlap - Number of trailing characters to preserve.
 * @returns Overlap text for the next chunk buffer.
 */
function takeOverlapTail(text: string, overlap: number): string {
  if (text.length <= overlap) {
    return text;
  }

  return text.slice(-overlap).trimStart();
}
