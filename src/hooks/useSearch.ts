'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SearchResultsState } from '@/components/search/SearchResults';
import type { SearchResult } from '@/types/search';
import { showErrorToast } from '@/lib/notifications';
import { DEMO_SEARCH_QUERY } from '@/lib/demo-data';

interface UseSearchOptions {
  searchApiBasePath: string;
  documentsReady: boolean;
  demoSearchMode: string;
}

export function useSearch({
  searchApiBasePath,
  documentsReady,
  demoSearchMode,
}: UseSearchOptions) {
  const demoSearchRan = useRef(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchEnabled = documentsReady || Boolean(demoSearchMode);

  const runSearch = useCallback(
    async (searchQuery: string) => {
      const trimmed = searchQuery.trim();
      if (!trimmed || (!documentsReady && !demoSearchMode)) {
        return;
      }

      setIsSearching(true);
      setHasSearched(true);

      try {
        const response = await fetch(`${searchApiBasePath}q=${encodeURIComponent(trimmed)}`);
        if (!response.ok) {
          showErrorToast('Search failed');
          return;
        }

        const payload = (await response.json()) as { results: SearchResult[] };
        setResults(payload.results);
      } catch {
        showErrorToast('Search failed');
      } finally {
        setIsSearching(false);
      }
    },
    [demoSearchMode, documentsReady, searchApiBasePath],
  );

  const handleSearch = useCallback(() => {
    void runSearch(query);
  }, [query, runSearch]);

  useEffect(() => {
    if (!demoSearchMode || demoSearchRan.current) {
      return;
    }

    demoSearchRan.current = true;
    setQuery(DEMO_SEARCH_QUERY);
    void runSearch(DEMO_SEARCH_QUERY);
  }, [demoSearchMode, runSearch]);

  const resultsState: SearchResultsState = useMemo(() => {
    if (isSearching) {
      return 'searching';
    }

    if (hasSearched && results.length === 0) {
      return 'no-results';
    }

    if (results.length > 0) {
      return 'results';
    }

    return 'idle';
  }, [hasSearched, isSearching, results.length]);

  return {
    query,
    setQuery,
    results,
    isSearching,
    searchEnabled,
    handleSearch,
    resultsState,
  };
}
