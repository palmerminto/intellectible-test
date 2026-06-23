import { beforeEach, describe, expect, it, vi } from 'vitest';

const { maybeSingleMock, insertMock, updateMock } = vi.hoisted(() => ({
  maybeSingleMock: vi.fn(),
  insertMock: vi.fn(),
  updateMock: vi.fn(),
}));

const fromMock = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: fromMock,
  }),
}));

import { addDraftItem } from '@/lib/drafts';

function mockDraftLookup(exists: boolean) {
  fromMock.mockImplementationOnce((table: string) => {
    if (table !== 'drafts') {
      throw new Error(`Unexpected table: ${table}`);
    }

    return {
      select: () => ({
        eq: () => ({
          maybeSingle: maybeSingleMock,
        }),
      }),
    };
  });

  maybeSingleMock.mockResolvedValueOnce({
    data: exists ? { id: 'draft-1' } : null,
    error: null,
  });
}

function mockExistingItemLookup(item: Record<string, unknown> | null) {
  fromMock.mockImplementationOnce((table: string) => {
    if (table !== 'draft_items') {
      throw new Error(`Unexpected table: ${table}`);
    }

    return {
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: maybeSingleMock,
          }),
        }),
      }),
    };
  });

  maybeSingleMock.mockResolvedValueOnce({
    data: item,
    error: null,
  });
}

describe('addDraftItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns an existing item when the chunk is already in the draft', async () => {
    mockDraftLookup(true);
    mockExistingItemLookup({
      id: 'item-existing',
      chunk_id: '550e8400-e29b-41d4-a716-446655440000',
      content_snapshot: 'Existing passage',
      source_filename: 'proposal.pdf',
      page: 2,
      position: 0,
      created_at: '2026-06-22T12:00:00.000Z',
    });

    const item = await addDraftItem('draft-1', {
      resultId: '550e8400-e29b-41d4-a716-446655440000',
      contentSnapshot: 'New passage',
      sourceFilename: 'proposal.pdf',
      page: 2,
      position: 1,
    });

    expect(item).toEqual({
      id: 'item-existing',
      resultId: '550e8400-e29b-41d4-a716-446655440000',
      contentSnapshot: 'Existing passage',
      sourceFilename: 'proposal.pdf',
      page: 2,
      position: 0,
      createdAt: '2026-06-22T12:00:00.000Z',
    });
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('stores null chunk_id for non-UUID result ids', async () => {
    mockDraftLookup(true);

    fromMock.mockImplementationOnce((table: string) => {
      if (table !== 'draft_items') {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        insert: insertMock,
      };
    });

    insertMock.mockReturnValue({
      select: () => ({
        single: () =>
          Promise.resolve({
            data: {
              id: 'item-1',
              chunk_id: null,
              content_snapshot: 'Demo passage',
              source_filename: 'demo.pdf',
              page: 1,
              position: 0,
              created_at: '2026-06-22T12:00:00.000Z',
            },
            error: null,
          }),
      }),
    });

    fromMock.mockImplementationOnce((table: string) => {
      if (table !== 'drafts') {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        update: updateMock,
      };
    });

    updateMock.mockReturnValue({
      eq: () => Promise.resolve({ error: null }),
    });

    const item = await addDraftItem('draft-1', {
      resultId: 'demo-result-1',
      contentSnapshot: 'Demo passage',
      sourceFilename: 'demo.pdf',
      page: 1,
      position: 0,
    });

    expect(insertMock).toHaveBeenCalledWith({
      draft_id: 'draft-1',
      chunk_id: null,
      content_snapshot: 'Demo passage',
      source_filename: 'demo.pdf',
      page: 1,
      position: 0,
    });
    expect(item.resultId).toBeUndefined();
  });
});

describe('removeDraftItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes a persisted draft item and updates the draft timestamp', async () => {
    const deleteEqMock = vi.fn().mockResolvedValue({ error: null });

    fromMock
      .mockImplementationOnce((table: string) => {
        if (table !== 'drafts') {
          throw new Error(`Unexpected table: ${table}`);
        }

        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { id: 'draft-1' }, error: null }),
            }),
          }),
        };
      })
      .mockImplementationOnce((table: string) => {
        if (table !== 'draft_items') {
          throw new Error(`Unexpected table: ${table}`);
        }

        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({ data: { id: 'item-1' }, error: null }),
              }),
            }),
          }),
        };
      })
      .mockImplementationOnce((table: string) => {
        if (table !== 'draft_items') {
          throw new Error(`Unexpected table: ${table}`);
        }

        return {
          delete: () => ({
            eq: deleteEqMock,
          }),
        };
      })
      .mockImplementationOnce((table: string) => {
        if (table !== 'drafts') {
          throw new Error(`Unexpected table: ${table}`);
        }

        return {
          update: updateMock,
        };
      });

    updateMock.mockReturnValue({
      eq: () => Promise.resolve({ error: null }),
    });

    const { removeDraftItem } = await import('@/lib/drafts');
    await removeDraftItem('draft-1', 'item-1');

    expect(deleteEqMock).toHaveBeenCalledWith('id', 'item-1');
    expect(updateMock).toHaveBeenCalled();
  });
});
