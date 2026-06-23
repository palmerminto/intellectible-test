import type { AddDraftItemResponse, CreateDraftResponse, DraftItem, DraftsResponse } from '@/types/draft';

export async function fetchDrafts(): Promise<DraftsResponse> {
  const response = await fetch('/api/drafts');
  if (!response.ok) {
    throw new Error('Failed to load drafts');
  }

  return response.json() as Promise<DraftsResponse>;
}

export async function createDraftApi(title: string): Promise<CreateDraftResponse> {
  const response = await fetch('/api/drafts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    throw new Error('Failed to create draft');
  }

  return response.json() as Promise<CreateDraftResponse>;
}

export async function addDraftItemApi(
  draftId: string,
  item: Pick<DraftItem, 'resultId' | 'contentSnapshot' | 'sourceFilename' | 'page' | 'position'>,
): Promise<AddDraftItemResponse> {
  const response = await fetch(`/api/drafts/${draftId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resultId: item.resultId,
      contentSnapshot: item.contentSnapshot,
      sourceFilename: item.sourceFilename,
      page: item.page,
      position: item.position,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to save draft item');
  }

  return response.json() as Promise<AddDraftItemResponse>;
}

export async function removeDraftItemApi(draftId: string, itemId: string): Promise<void> {
  const response = await fetch(`/api/drafts/${draftId}/items/${itemId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to remove draft item');
  }
}
