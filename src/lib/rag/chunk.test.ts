import { describe, expect, it } from 'vitest';
import { chunkPdfPages } from '@/lib/rag/chunk';
import type { ParsedPdfPage } from '@/lib/rag/types';

function makePage(page: number, text: string): ParsedPdfPage {
  return { page, text };
}

describe('chunkPdfPages', () => {
  it('returns a single chunk for short page text', () => {
    const chunks = chunkPdfPages([makePage(1, 'Scope includes cloud migration and support.')]);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toMatchObject({
      page: 1,
      chunkIndex: 0,
      content: 'Scope includes cloud migration and support.',
    });
  });

  it('preserves page numbers and global chunk indices across pages', () => {
    const chunks = chunkPdfPages([
      makePage(1, 'Page one content.'),
      makePage(3, 'Page three content.'),
    ]);

    expect(chunks).toHaveLength(2);
    expect(chunks[0].page).toBe(1);
    expect(chunks[0].chunkIndex).toBe(0);
    expect(chunks[1].page).toBe(3);
    expect(chunks[1].chunkIndex).toBe(1);
  });

  it('splits very long text into multiple chunks', () => {
    const longParagraph = `${'word '.repeat(900)}end`;
    const chunks = chunkPdfPages([makePage(2, longParagraph)]);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.page === 2)).toBe(true);
    expect(chunks.map((chunk) => chunk.chunkIndex)).toEqual([0, 1, 2].slice(0, chunks.length));
  });

  it('ignores empty chunks', () => {
    const chunks = chunkPdfPages([makePage(1, '   \n\n   Actual content here.')]);

    expect(chunks).toHaveLength(1);
    expect(chunks[0].content).toBe('Actual content here.');
  });
});
