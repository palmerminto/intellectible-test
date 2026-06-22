import type { DraftItem } from '@/types/draft';
import type { SearchResult } from '@/types/search';

export const DEMO_SEARCH_QUERY = 'mobilisation requirements';

export function buildDemoSearchResults(query: string): SearchResult[] {
  return [
    {
      id: 'demo-result-1',
      snippet:
        'The bidder must submit a mobilisation plan within 10 working days of contract award.',
      highlightedSnippet: `The bidder must submit a mobilisation plan within 10 working days of contract award. (query: ${query})`,
      documentId: 'demo-ready-1',
      filename: 'city-council-rfp.pdf',
      page: 12,
      score: 0.86,
    },
    {
      id: 'demo-result-2',
      snippet:
        'All safeguarding incidents must be reported to the authority within 24 hours.',
      highlightedSnippet:
        'All safeguarding incidents must be reported to the authority within 24 hours.',
      documentId: 'demo-ready-1',
      filename: 'city-council-rfp.pdf',
      page: 27,
      score: 0.71,
    },
    {
      id: 'demo-result-3',
      snippet:
        'Suppliers are expected to evidence prior delivery across at least two local government contracts.',
      highlightedSnippet:
        'Suppliers are expected to evidence prior delivery across at least two local government contracts.',
      documentId: 'demo-ready-1',
      filename: 'city-council-rfp.pdf',
      page: 6,
      score: 0.63,
    },
  ];
}

export function buildDemoEvidenceItems(): DraftItem[] {
  const now = new Date().toISOString();

  return [
    {
      id: 'demo-evidence-1',
      resultId: 'demo-result-1',
      contentSnapshot:
        'The bidder must submit a mobilisation plan within 10 working days of contract award.',
      sourceFilename: 'city-council-rfp.pdf',
      page: 12,
      position: 0,
      createdAt: now,
    },
    {
      id: 'demo-evidence-2',
      resultId: 'demo-result-2',
      contentSnapshot:
        'All safeguarding incidents must be reported to the authority within 24 hours.',
      sourceFilename: 'city-council-rfp.pdf',
      page: 27,
      position: 1,
      createdAt: now,
    },
  ];
}
