'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AppShell,
  Box,
  Button,
  Group,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { DocumentDropzone } from '@/components/upload/DocumentDropzone';
import { DocumentLibrary } from '@/components/library/DocumentLibrary';
import { SearchResults, type SearchResultsState } from '@/components/search/SearchResults';
import { DraftPanel } from '@/components/draft/DraftPanel';
import type { Document } from '@/types/document';
import type { DraftItem } from '@/types/draft';
import type { SearchResult } from '@/types/search';
import { showErrorToast } from '@/lib/notifications';
import { buildDemoEvidenceItems, DEMO_SEARCH_QUERY } from '@/lib/demo-data';

const POLL_INTERVAL_MS = 2500;
const HIGHLIGHT_DURATION_MS = 2000;

function normalizeDocument(doc: Document): Document {
  return {
    ...doc,
    pageCount: doc.pageCount ?? null,
    errorMessage: doc.errorMessage ?? null,
  };
}

function hasProcessingDocuments(documents: Document[]): boolean {
  return documents.some(
    (doc) =>
      doc.status === 'uploading' ||
      doc.status === 'uploaded' ||
      doc.status === 'processing',
  );
}

function hasReadyDocuments(documents: Document[]): boolean {
  return documents.some((doc) => doc.status === 'ready');
}

export function WorkspacePage() {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const demoDocsMode = searchParams.get('demoDocs')?.trim() ?? '';
  const demoSearchMode = searchParams.get('demoSearch')?.trim() ?? '';
  const demoEvidenceMode = searchParams.get('demoEvidence')?.trim() ?? '';
  const demoSearchRan = useRef(false);

  const [query, setQuery] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [draftItems, setDraftItems] = useState<DraftItem[]>(() =>
    demoEvidenceMode === 'sample' ? buildDemoEvidenceItems() : [],
  );
  const [addedResultIds, setAddedResultIds] = useState<Set<string>>(() =>
    demoEvidenceMode === 'sample' ? new Set(['demo-result-1', 'demo-result-2']) : new Set(),
  );
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);

  const documentsApiPath = useMemo(() => {
    const params = new URLSearchParams();
    if (demoDocsMode) {
      params.set('demoDocs', demoDocsMode);
    }

    const queryString = params.toString();
    return queryString ? `/api/documents?${queryString}` : '/api/documents';
  }, [demoDocsMode]);

  const searchApiBasePath = useMemo(() => {
    const params = new URLSearchParams();
    if (demoSearchMode) {
      params.set('demoSearch', demoSearchMode);
    }

    const queryString = params.toString();
    return queryString ? `/api/search?${queryString}&` : '/api/search?';
  }, [demoSearchMode]);

  const mergeDocuments = useCallback((incoming: Document[]) => {
    setDocuments((current) => {
      const optimistic = current.filter(
        (doc) =>
          doc.status === 'uploading' &&
          !incoming.some((serverDoc) => serverDoc.filename === doc.filename),
      );

      return [...optimistic, ...incoming];
    });
  }, []);

  const loadDocuments = useCallback(async () => {
    try {
      const response = await fetch(documentsApiPath);
      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { documents: Document[] };
      mergeDocuments(payload.documents.map(normalizeDocument));
    } catch {
      // Ignore fetch errors when API is unavailable.
    }
  }, [documentsApiPath, mergeDocuments]);

  useEffect(() => {
    let cancelled = false;

    async function fetchInitialDocuments() {
      try {
        const response = await fetch(documentsApiPath);
        if (!response.ok || cancelled) {
          return;
        }

        const payload = (await response.json()) as { documents: Document[] };
        if (!cancelled) {
          mergeDocuments(payload.documents.map(normalizeDocument));
        }
      } catch {
        // Ignore fetch errors when API is unavailable.
      }
    }

    void fetchInitialDocuments();

    return () => {
      cancelled = true;
    };
  }, [documentsApiPath, mergeDocuments]);

  useEffect(() => {
    if (!hasProcessingDocuments(documents)) {
      return;
    }

    const interval = window.setInterval(() => {
      void loadDocuments();
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [documents, loadDocuments]);

  const handleUploadStart = useCallback((filename: string) => {
    const optimistic: Document = {
      id: `optimistic-${crypto.randomUUID()}`,
      filename,
      status: 'uploading',
      sizeBytes: null,
      pageCount: null,
      errorMessage: null,
      createdAt: new Date().toISOString(),
    };

    setDocuments((current) => [optimistic, ...current]);
    return optimistic.id;
  }, []);

  const handleUploadFailed = useCallback((optimisticId: string, errorMessage: string) => {
    setDocuments((current) =>
      current.map((doc) =>
        doc.id === optimisticId
          ? { ...doc, status: 'failed', errorMessage }
          : doc,
      ),
    );
  }, []);

  const handleDismissFailed = useCallback((documentId: string) => {
    setDocuments((current) => current.filter((doc) => doc.id !== documentId));
  }, []);

  const runSearch = useCallback(
    async (searchQuery: string) => {
      const trimmed = searchQuery.trim();
      if (!trimmed || (!hasReadyDocuments(documents) && !demoSearchMode)) {
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
    [demoSearchMode, documents, searchApiBasePath],
  );

  const handleSearch = () => {
    void runSearch(query);
  };

  useEffect(() => {
    if (!demoSearchMode || demoSearchRan.current) {
      return;
    }

    demoSearchRan.current = true;
    setQuery(DEMO_SEARCH_QUERY);
    void runSearch(DEMO_SEARCH_QUERY);
  }, [demoSearchMode, runSearch]);

  const handleAddToEvidence = useCallback((result: SearchResult) => {
    if (addedResultIds.has(result.id)) {
      return;
    }

    const itemId = crypto.randomUUID();

    setDraftItems((current) => {
      const item: DraftItem = {
        id: itemId,
        resultId: result.id,
        contentSnapshot: result.snippet,
        sourceFilename: result.filename,
        page: result.page,
        position: current.length,
        createdAt: new Date().toISOString(),
      };

      return [...current, item];
    });

    setAddedResultIds((current) => new Set(current).add(result.id));
    setHighlightedItemId(itemId);

    window.setTimeout(() => {
      setHighlightedItemId((current) => (current === itemId ? null : current));
    }, HIGHLIGHT_DURATION_MS);
  }, [addedResultIds]);

  const searchEnabled = hasReadyDocuments(documents) || Boolean(demoSearchMode);

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

  return (
    <AppShell
        header={{ height: 64 }}
        navbar={{ width: 320, breakpoint: 'sm' }}
        aside={{ width: 360, breakpoint: 'md' }}
        padding="md"
      >
        <AppShell.Header px="md">
          <Group h="100%" align="center">
            <Title order={3}>Document Search</Title>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar p="md">
          <Stack gap="md" h="100%">
            <Title order={5}>Library</Title>
            <Box>
              <DocumentDropzone
                onUploadStart={handleUploadStart}
                onUploadFailed={handleUploadFailed}
                onUploaded={loadDocuments}
              />
            </Box>
            <ScrollArea flex={1}>
              <DocumentLibrary
                documents={documents}
                onDismissFailed={handleDismissFailed}
              />
            </ScrollArea>
          </Stack>
        </AppShell.Navbar>

        <AppShell.Main>
          <Stack gap="md" maw={900}>
            {(demoDocsMode || demoSearchMode || demoEvidenceMode) && (
              <Text size="xs" c="dimmed">
                Demo mode active
                {demoDocsMode ? ` · demoDocs=${demoDocsMode}` : ''}
                {demoSearchMode ? ` · demoSearch=${demoSearchMode}` : ''}
                {demoEvidenceMode ? ` · demoEvidence=${demoEvidenceMode}` : ''}
              </Text>
            )}
            <Stack gap={4}>
              <Group align="flex-end">
                <TextInput
                  ref={searchInputRef}
                  flex={1}
                  label="Search documents"
                  placeholder="Search requirements, risks, deadlines, or compliance terms"
                  leftSection={<IconSearch size={16} />}
                  value={query}
                  disabled={!searchEnabled}
                  onChange={(event) => setQuery(event.currentTarget.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
                <Button
                  onClick={handleSearch}
                  loading={isSearching}
                  disabled={!searchEnabled || !query.trim()}
                >
                  Search
                </Button>
              </Group>
              {!searchEnabled ? (
                <Text size="xs" c="dimmed">
                  Upload a document and wait for indexing to finish before searching.
                </Text>
              ) : null}
            </Stack>

            <SearchResults
              key={results.map((result) => result.id).join('-') || resultsState}
              results={results}
              state={resultsState}
              addedResultIds={addedResultIds}
              onAddToEvidence={handleAddToEvidence}
            />
          </Stack>
        </AppShell.Main>

        <AppShell.Aside p="md">
          <DraftPanel items={draftItems} highlightedItemId={highlightedItemId} />
        </AppShell.Aside>
      </AppShell>
  );
}
