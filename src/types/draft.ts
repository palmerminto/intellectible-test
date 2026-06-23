export interface DraftItem {
  id: string;
  resultId?: string;
  contentSnapshot: string;
  sourceFilename: string;
  page: number;
  position: number;
  createdAt: string;
}

export interface Draft {
  id: string;
  title: string;
  items: DraftItem[];
  createdAt: string;
  updatedAt: string;
}

export interface DraftsResponse {
  drafts: Draft[];
}

export interface CreateDraftResponse {
  draft: Draft;
}

export interface AddDraftItemResponse {
  item: DraftItem;
}

export type EvidencePersistenceStatus =
  | 'idle'
  | 'loading'
  | 'saving'
  | 'saved'
  | 'loadError'
  | 'saveError';
