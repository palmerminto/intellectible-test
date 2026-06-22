/** Text extracted from a single PDF page. */
export interface ParsedPdfPage {
  /** 1-based page number from the source PDF. */
  page: number;
  /** Normalised page text content. */
  text: string;
}

/** A retrieval chunk with citation metadata but no embedding yet. */
export interface TextChunk {
  content: string;
  /** Source page number preserved for citations. */
  page: number;
  /** Stable order of this chunk within the parent document. */
  chunkIndex: number;
}

/** A chunk ready for vector indexing. */
export interface EmbeddedChunk extends TextChunk {
  embedding: number[];
}

/** Normalised search hit before UI formatting. */
export interface SearchCandidate {
  chunkId: string;
  documentId: string;
  filename: string;
  content: string;
  page: number;
  score: number;
}
