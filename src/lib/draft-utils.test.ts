import { describe, expect, it } from 'vitest';
import {
  draftItemFromSearchResult,
  evidencePersistenceStatusCopy,
  isUuid,
  mapStoredDraftItemToApi,
  mapStoredDraftToApi,
  parseAddDraftItemPayload,
} from '@/lib/draft-utils';

describe('draft-utils', () => {
  it('accepts valid UUID strings', () => {
    expect(isUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('rejects non-UUID result ids', () => {
    expect(isUuid('demo-result-1')).toBe(false);
    expect(isUuid('')).toBe(false);
  });

  it('maps stored draft rows to API shape', () => {
    const draft = mapStoredDraftToApi({
      id: 'draft-1',
      title: 'Evidence draft',
      created_at: '2026-06-22T12:00:00.000Z',
      updated_at: '2026-06-22T12:30:00.000Z',
      draft_items: [
        {
          id: 'item-2',
          chunk_id: 'chunk-b',
          content_snapshot: 'Second passage',
          source_filename: 'proposal.pdf',
          page: 3,
          position: 1,
          created_at: '2026-06-22T12:20:00.000Z',
        },
        {
          id: 'item-1',
          chunk_id: 'chunk-a',
          content_snapshot: 'First passage',
          source_filename: 'proposal.pdf',
          page: 2,
          position: 0,
          created_at: '2026-06-22T12:10:00.000Z',
        },
      ],
    });

    expect(draft.items).toEqual([
      {
        id: 'item-1',
        resultId: 'chunk-a',
        contentSnapshot: 'First passage',
        sourceFilename: 'proposal.pdf',
        page: 2,
        position: 0,
        createdAt: '2026-06-22T12:10:00.000Z',
      },
      {
        id: 'item-2',
        resultId: 'chunk-b',
        contentSnapshot: 'Second passage',
        sourceFilename: 'proposal.pdf',
        page: 3,
        position: 1,
        createdAt: '2026-06-22T12:20:00.000Z',
      },
    ]);
  });

  it('omits resultId when chunk_id is null', () => {
    const item = mapStoredDraftItemToApi({
      id: 'item-1',
      chunk_id: null,
      content_snapshot: 'Demo passage',
      source_filename: 'demo.pdf',
      page: 1,
      position: 0,
      created_at: '2026-06-22T12:00:00.000Z',
    });

    expect(item.resultId).toBeUndefined();
  });

  it('validates add-draft-item payloads', () => {
    expect(parseAddDraftItemPayload({})).toEqual({
      ok: false,
      error: 'contentSnapshot is required',
    });

    expect(
      parseAddDraftItemPayload({
        contentSnapshot: 'Passage',
        sourceFilename: 'proposal.pdf',
        page: 2,
        position: 0,
      }),
    ).toEqual({
      ok: true,
      data: {
        contentSnapshot: 'Passage',
        sourceFilename: 'proposal.pdf',
        page: 2,
        position: 0,
      },
    });
  });

  it('builds draft items from search results', () => {
    expect(
      draftItemFromSearchResult(
        {
          id: 'chunk-a',
          snippet: 'Scope includes cloud migration.',
          highlightedSnippet: 'Scope includes [cloud] migration.',
          documentId: 'doc-1',
          filename: 'proposal.pdf',
          page: 2,
          score: 0.42,
        },
        0,
        'item-1',
        '2026-06-22T12:00:00.000Z',
      ),
    ).toEqual({
      id: 'item-1',
      resultId: 'chunk-a',
      contentSnapshot: 'Scope includes cloud migration.',
      sourceFilename: 'proposal.pdf',
      page: 2,
      position: 0,
      createdAt: '2026-06-22T12:00:00.000Z',
    });
  });

  it('returns user-facing persistence status copy', () => {
    expect(evidencePersistenceStatusCopy('loadError')).toBe('Could not load saved evidence');
    expect(evidencePersistenceStatusCopy('saveError')).toBe('Evidence kept locally; save failed');
    expect(evidencePersistenceStatusCopy('idle')).toBeNull();
  });
});
