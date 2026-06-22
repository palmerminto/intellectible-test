export type DocumentStatus = 'uploaded' | 'processing' | 'ready' | 'failed';

/** Client-only status shown while upload request is in flight. */
export type DocumentDisplayStatus = DocumentStatus | 'uploading';

export interface Document {
  id: string;
  filename: string;
  status: DocumentDisplayStatus;
  sizeBytes: number | null;
  pageCount: number | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface DocumentsResponse {
  documents: Document[];
}

export interface UploadDocumentResponse {
  documentId: string;
  filename: string;
}
