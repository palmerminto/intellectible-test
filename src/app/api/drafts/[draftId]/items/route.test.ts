import { beforeEach, describe, expect, it, vi } from 'vitest';

const { addDraftItemMock } = vi.hoisted(() => ({
  addDraftItemMock: vi.fn(),
}));

vi.mock('@/lib/drafts', () => ({
  addDraftItem: addDraftItemMock,
  DraftNotFoundError: class DraftNotFoundError extends Error {
    constructor() {
      super('Draft not found');
      this.name = 'DraftNotFoundError';
    }
  },
}));

import { POST } from '@/app/api/drafts/[draftId]/items/route';

describe('POST /api/drafts/[draftId]/items', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when required fields are missing', async () => {
    const response = await POST(
      new Request('http://localhost/api/drafts/draft-1/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ draftId: 'draft-1' }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'contentSnapshot is required' });
    expect(addDraftItemMock).not.toHaveBeenCalled();
  });

  it('adds a draft item with a UUID chunk id', async () => {
    addDraftItemMock.mockResolvedValue({
      id: 'item-1',
      resultId: '550e8400-e29b-41d4-a716-446655440000',
      contentSnapshot: 'Scope includes cloud migration.',
      sourceFilename: 'proposal.pdf',
      page: 2,
      position: 0,
      createdAt: '2026-06-22T12:00:00.000Z',
    });

    const response = await POST(
      new Request('http://localhost/api/drafts/draft-1/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resultId: '550e8400-e29b-41d4-a716-446655440000',
          contentSnapshot: 'Scope includes cloud migration.',
          sourceFilename: 'proposal.pdf',
          page: 2,
          position: 0,
        }),
      }),
      { params: Promise.resolve({ draftId: 'draft-1' }) },
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      item: {
        id: 'item-1',
        resultId: '550e8400-e29b-41d4-a716-446655440000',
        contentSnapshot: 'Scope includes cloud migration.',
        sourceFilename: 'proposal.pdf',
        page: 2,
        position: 0,
        createdAt: '2026-06-22T12:00:00.000Z',
      },
    });
    expect(addDraftItemMock).toHaveBeenCalledWith('draft-1', {
      resultId: '550e8400-e29b-41d4-a716-446655440000',
      contentSnapshot: 'Scope includes cloud migration.',
      sourceFilename: 'proposal.pdf',
      page: 2,
      position: 0,
    });
  });

  it('adds a draft item without a UUID result id', async () => {
    addDraftItemMock.mockResolvedValue({
      id: 'item-2',
      contentSnapshot: 'Demo passage',
      sourceFilename: 'demo.pdf',
      page: 1,
      position: 1,
      createdAt: '2026-06-22T12:10:00.000Z',
    });

    const response = await POST(
      new Request('http://localhost/api/drafts/draft-1/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resultId: 'demo-result-1',
          contentSnapshot: 'Demo passage',
          sourceFilename: 'demo.pdf',
          page: 1,
          position: 1,
        }),
      }),
      { params: Promise.resolve({ draftId: 'draft-1' }) },
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      item: {
        id: 'item-2',
        contentSnapshot: 'Demo passage',
        sourceFilename: 'demo.pdf',
        page: 1,
        position: 1,
        createdAt: '2026-06-22T12:10:00.000Z',
      },
    });
    expect(addDraftItemMock).toHaveBeenCalledWith('draft-1', {
      resultId: 'demo-result-1',
      contentSnapshot: 'Demo passage',
      sourceFilename: 'demo.pdf',
      page: 1,
      position: 1,
    });
  });

  it('returns 404 when the draft does not exist', async () => {
    const { DraftNotFoundError } = await import('@/lib/drafts');
    addDraftItemMock.mockRejectedValue(new DraftNotFoundError());

    const response = await POST(
      new Request('http://localhost/api/drafts/missing-draft/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentSnapshot: 'Passage',
          sourceFilename: 'proposal.pdf',
          page: 1,
          position: 0,
        }),
      }),
      { params: Promise.resolve({ draftId: 'missing-draft' }) },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'Draft not found' });
  });
});
