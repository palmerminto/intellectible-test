import type { Document, DocumentDisplayStatus } from '@/types/document';

const IN_PROGRESS_STATUSES: ReadonlySet<DocumentDisplayStatus> = new Set([
  'uploading',
  'uploaded',
  'processing',
]);

export interface DocumentStatusMeta {
  label: string;
  color: 'gray' | 'blue' | 'green' | 'red';
  isInProgress: boolean;
  helperText: string | null;
}

export function hasProcessingDocuments(documents: Document[]): boolean {
  return documents.some((doc) => IN_PROGRESS_STATUSES.has(doc.status));
}

export function hasReadyDocuments(documents: Document[]): boolean {
  return documents.some((doc) => doc.status === 'ready');
}

export function getSearchDisabledMessage(documents: Document[]): string | null {
  if (hasReadyDocuments(documents)) {
    return null;
  }

  if (documents.length === 0) {
    return 'Upload a PDF to start indexing.';
  }

  if (hasProcessingDocuments(documents)) {
    return 'Search will unlock when indexing finishes.';
  }

  return 'Upload a document or remove failed uploads before searching.';
}

function documentStatusHelperText(status: DocumentDisplayStatus): string | null {
  switch (status) {
    case 'uploading':
      return 'Uploading file...';
    case 'uploaded':
      return 'Queued for indexing.';
    case 'processing':
      return 'Parsing pages and building the search index.';
    case 'ready':
      return null;
    case 'failed':
      return null;
    default:
      return null;
  }
}

function documentStatusLabel(status: DocumentDisplayStatus): string {
  switch (status) {
    case 'uploading':
      return 'Uploading';
    case 'uploaded':
      return 'Queued';
    case 'processing':
      return 'Processing';
    case 'ready':
      return 'Ready';
    case 'failed':
      return 'Failed';
    default:
      return 'Queued';
  }
}

function documentStatusColor(
  status: DocumentDisplayStatus,
): 'gray' | 'blue' | 'green' | 'red' {
  switch (status) {
    case 'uploading':
    case 'uploaded':
      return 'gray';
    case 'processing':
      return 'blue';
    case 'ready':
      return 'green';
    case 'failed':
      return 'red';
    default:
      return 'gray';
  }
}

export function getDocumentStatusMeta(status: DocumentDisplayStatus): DocumentStatusMeta {
  return {
    label: documentStatusLabel(status),
    color: documentStatusColor(status),
    isInProgress: IN_PROGRESS_STATUSES.has(status),
    helperText: documentStatusHelperText(status),
  };
}

export function formatDocumentSize(sizeBytes: number | null): string | null {
  if (sizeBytes == null || sizeBytes <= 0) {
    return null;
  }

  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}
