export type DocumentStatus = 'uploaded' | 'processing' | 'ready' | 'failed';

export interface Document {
  id: string;
  filename: string;
  status: DocumentStatus;
  sizeBytes: number | null;
  createdAt: string;
}

export interface DocumentsResponse {
  documents: Document[];
}

export interface UploadDocumentResponse {
  documentId: string;
  filename: string;
}
