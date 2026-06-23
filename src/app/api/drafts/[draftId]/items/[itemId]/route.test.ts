import { beforeEach, describe, expect, it, vi } from 'vitest';

const { removeDraftItemMock } = vi.hoisted(() => ({
  removeDraftItemMock: vi.fn(),
}));

vi.mock('@/lib/drafts', () => ({
  removeDraftItem: removeDraftItemMock,
  DraftNotFoundError: class DraftNotFoundError extends Error {
    constructor() {
      super('Draft not found');
      this.name = 'DraftNotFoundError';
    }
  },
  DraftItemNotFoundError: class DraftItemNotFoundError extends Error {
    constructor() {
      super('Draft item not found');
      this.name = 'DraftItemNotFoundError';
    }
  },
}));

import { DELETE } from '@/app/api/drafts/[draftId]/items/[itemId]/route';

describe('DELETE /api/drafts/[draftId]/items/[itemId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('removes a draft item', async () => {
    removeDraftItemMock.mockResolvedValue(undefined);

    const response = await DELETE(
      new Request('http://localhost/api/drafts/draft-1/items/item-1', { method: 'DELETE' }),
      { params: Promise.resolve({ draftId: 'draft-1', itemId: 'item-1' }) },
    );

    expect(response.status).toBe(204);
    expect(removeDraftItemMock).toHaveBeenCalledWith('draft-1', 'item-1');
  });

  it('returns 404 when the draft item does not exist', async () => {
    const { DraftItemNotFoundError } = await import('@/lib/drafts');
    removeDraftItemMock.mockRejectedValue(new DraftItemNotFoundError());

    const response = await DELETE(
      new Request('http://localhost/api/drafts/draft-1/items/missing-item', { method: 'DELETE' }),
      { params: Promise.resolve({ draftId: 'draft-1', itemId: 'missing-item' }) },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'Draft item not found' });
  });
});
