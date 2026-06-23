import type { Draft, DraftItem, EvidencePersistenceStatus } from '@/types/draft';
import type { SearchResult } from '@/types/search';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Row shape returned when listing draft items from Supabase. */
export interface StoredDraftItemRow {
  id: string;
  chunk_id: string | null;
  content_snapshot: string;
  source_filename: string;
  page: number;
  position: number;
  created_at: string;
}

/** Row shape returned when listing drafts from Supabase. */
export interface StoredDraftRow {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  draft_items?: StoredDraftItemRow[] | null;
}

/**
 * Check whether a value is a valid UUID string.
 *
 * @param value - Candidate chunk/result identifier.
 * @returns True when the value can be stored in `draft_items.chunk_id`.
 */
export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/**
 * Map a persisted draft item row to the API response shape.
 */
export function mapStoredDraftItemToApi(row: StoredDraftItemRow): DraftItem {
  return {
    id: row.id,
    resultId: row.chunk_id ?? undefined,
    contentSnapshot: row.content_snapshot,
    sourceFilename: row.source_filename,
    page: row.page,
    position: row.position,
    createdAt: row.created_at,
  };
}

/**
 * Map a persisted draft row to the API response shape.
 */
export function mapStoredDraftToApi(row: StoredDraftRow): Draft {
  const items = (row.draft_items ?? [])
    .map((item) => mapStoredDraftItemToApi(item))
    .sort((left, right) => left.position - right.position);

  return {
    id: row.id,
    title: row.title,
    items,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface AddDraftItemPayload {
  resultId?: string;
  contentSnapshot: string;
  sourceFilename: string;
  page: number;
  position: number;
}

/**
 * Validate and normalise an add-draft-item request body.
 */
export function parseAddDraftItemPayload(payload: {
  resultId?: string;
  contentSnapshot?: string;
  sourceFilename?: string;
  page?: number;
  position?: number;
}): { ok: true; data: AddDraftItemPayload } | { ok: false; error: string } {
  if (!payload.contentSnapshot?.trim()) {
    return { ok: false, error: 'contentSnapshot is required' };
  }

  if (!payload.sourceFilename?.trim()) {
    return { ok: false, error: 'sourceFilename is required' };
  }

  if (typeof payload.page !== 'number' || !Number.isFinite(payload.page) || payload.page < 1) {
    return { ok: false, error: 'page must be a positive number' };
  }

  if (typeof payload.position !== 'number' || !Number.isFinite(payload.position) || payload.position < 0) {
    return { ok: false, error: 'position must be a non-negative number' };
  }

  return {
    ok: true,
    data: {
      resultId: payload.resultId,
      contentSnapshot: payload.contentSnapshot.trim(),
      sourceFilename: payload.sourceFilename.trim(),
      page: payload.page,
      position: payload.position,
    },
  };
}

/**
 * Build a draft item from a search result for optimistic UI updates.
 */
export function draftItemFromSearchResult(
  result: SearchResult,
  position: number,
  id: string,
  createdAt: string,
): DraftItem {
  return {
    id,
    resultId: result.id,
    contentSnapshot: result.snippet,
    sourceFilename: result.filename,
    page: result.page,
    position,
    createdAt,
  };
}

/**
 * User-facing copy for evidence persistence status.
 */
export function evidencePersistenceStatusCopy(status: EvidencePersistenceStatus): string | null {
  switch (status) {
    case 'loading':
      return 'Loading saved evidence…';
    case 'saving':
      return 'Saving evidence…';
    case 'saved':
      return 'Saved';
    case 'loadError':
      return 'Could not load saved evidence';
    case 'saveError':
      return 'Evidence kept locally; save failed';
    default:
      return null;
  }
}
