import { beforeEach, describe, expect, it, vi } from 'vitest';

const { listDraftsMock, createDraftMock } = vi.hoisted(() => ({
  listDraftsMock: vi.fn(),
  createDraftMock: vi.fn(),
}));

vi.mock('@/lib/drafts', () => ({
  listDrafts: listDraftsMock,
  createDraft: createDraftMock,
}));

import { GET, POST } from '@/app/api/drafts/route';

describe('GET /api/drafts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns persisted drafts', async () => {
    listDraftsMock.mockResolvedValue([
      {
        id: 'draft-1',
        title: 'Collected evidence',
        items: [],
        createdAt: '2026-06-22T12:00:00.000Z',
        updatedAt: '2026-06-22T12:30:00.000Z',
      },
    ]);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      drafts: [
        {
          id: 'draft-1',
          title: 'Collected evidence',
          items: [],
          createdAt: '2026-06-22T12:00:00.000Z',
          updatedAt: '2026-06-22T12:30:00.000Z',
        },
      ],
    });
    expect(listDraftsMock).toHaveBeenCalledOnce();
  });

  it('returns 500 when drafts cannot be loaded', async () => {
    listDraftsMock.mockRejectedValue(new Error('Database unavailable'));

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Database unavailable' });
  });
});

describe('POST /api/drafts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a draft with the supplied title', async () => {
    createDraftMock.mockResolvedValue({
      id: 'draft-2',
      title: 'RFP notes',
      items: [],
      createdAt: '2026-06-22T13:00:00.000Z',
      updatedAt: '2026-06-22T13:00:00.000Z',
    });

    const response = await POST(
      new Request('http://localhost/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'RFP notes' }),
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      draft: {
        id: 'draft-2',
        title: 'RFP notes',
        items: [],
        createdAt: '2026-06-22T13:00:00.000Z',
        updatedAt: '2026-06-22T13:00:00.000Z',
      },
    });
    expect(createDraftMock).toHaveBeenCalledWith('RFP notes');
  });

  it('returns 500 when draft creation fails', async () => {
    createDraftMock.mockRejectedValue(new Error('Insert failed'));

    const response = await POST(
      new Request('http://localhost/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Broken draft' }),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Insert failed' });
  });
});
