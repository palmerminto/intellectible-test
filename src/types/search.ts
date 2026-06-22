export interface SearchResult {
  id: string;
  snippet: string;
  highlightedSnippet: string;
  documentId: string;
  filename: string;
  page: number;
  score: number;
}

export interface SearchResponse {
  results: SearchResult[];
}
