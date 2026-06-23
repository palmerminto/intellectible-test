import {
  mapStoredDraftItemToApi,
  mapStoredDraftToApi,
  type StoredDraftItemRow,
  type StoredDraftRow,
  isUuid,
} from '@/lib/draft-utils';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Draft, DraftItem } from '@/types/draft';

export class DraftNotFoundError extends Error {
  constructor() {
    super('Draft not found');
    this.name = 'DraftNotFoundError';
  }
}

export class DraftItemNotFoundError extends Error {
  constructor() {
    super('Draft item not found');
    this.name = 'DraftItemNotFoundError';
  }
}

const DRAFT_SELECT = `
  id,
  title,
  created_at,
  updated_at,
  draft_items (
    id,
    chunk_id,
    content_snapshot,
    source_filename,
    page,
    position,
    created_at
  )
`;

/**
 * List persisted drafts with ordered evidence items, newest first.
 */
export async function listDrafts(): Promise<Draft[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('drafts')
    .select(DRAFT_SELECT)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapStoredDraftToApi(row as StoredDraftRow));
}

/**
 * Create a new draft collection.
 *
 * @param title - Optional draft title; defaults to `Untitled draft`.
 */
export async function createDraft(title?: string): Promise<Draft> {
  const supabase = createAdminClient();
  const trimmedTitle = title?.trim() || 'Untitled draft';

  const { data, error } = await supabase
    .from('drafts')
    .insert({ title: trimmedTitle })
    .select(DRAFT_SELECT)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create draft');
  }

  return mapStoredDraftToApi(data as StoredDraftRow);
}

/**
 * Add a cited search result to a draft collection.
 */
export async function addDraftItem(
  draftId: string,
  input: {
    resultId?: string;
    contentSnapshot: string;
    sourceFilename: string;
    page: number;
    position: number;
  },
): Promise<DraftItem> {
  const supabase = createAdminClient();

  const { data: draft, error: draftError } = await supabase
    .from('drafts')
    .select('id')
    .eq('id', draftId)
    .maybeSingle();

  if (draftError) {
    throw new Error(draftError.message);
  }

  if (!draft) {
    throw new DraftNotFoundError();
  }

  const chunkId = input.resultId && isUuid(input.resultId) ? input.resultId : null;

  if (chunkId) {
    const { data: existing, error: existingError } = await supabase
      .from('draft_items')
      .select('id, chunk_id, content_snapshot, source_filename, page, position, created_at')
      .eq('draft_id', draftId)
      .eq('chunk_id', chunkId)
      .maybeSingle();

    if (existingError) {
      throw new Error(existingError.message);
    }

    if (existing) {
      return mapStoredDraftItemToApi(existing as StoredDraftItemRow);
    }
  }

  const { data, error } = await supabase
    .from('draft_items')
    .insert({
      draft_id: draftId,
      chunk_id: chunkId,
      content_snapshot: input.contentSnapshot,
      source_filename: input.sourceFilename,
      page: input.page,
      position: input.position,
    })
    .select('id, chunk_id, content_snapshot, source_filename, page, position, created_at')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to add draft item');
  }

  const { error: updateError } = await supabase
    .from('drafts')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', draftId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return mapStoredDraftItemToApi(data as StoredDraftItemRow);
}

/**
 * Remove a cited passage from a draft collection.
 */
export async function removeDraftItem(draftId: string, itemId: string): Promise<void> {
  const supabase = createAdminClient();

  const { data: draft, error: draftError } = await supabase
    .from('drafts')
    .select('id')
    .eq('id', draftId)
    .maybeSingle();

  if (draftError) {
    throw new Error(draftError.message);
  }

  if (!draft) {
    throw new DraftNotFoundError();
  }

  const { data: item, error: itemError } = await supabase
    .from('draft_items')
    .select('id')
    .eq('id', itemId)
    .eq('draft_id', draftId)
    .maybeSingle();

  if (itemError) {
    throw new Error(itemError.message);
  }

  if (!item) {
    throw new DraftItemNotFoundError();
  }

  const { error: deleteError } = await supabase.from('draft_items').delete().eq('id', itemId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const { error: updateError } = await supabase
    .from('drafts')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', draftId);

  if (updateError) {
    throw new Error(updateError.message);
  }
}
