'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
import { AppSpotlight } from '@/components/spotlight/AppSpotlight';
import { DocumentDropzone } from '@/components/upload/DocumentDropzone';
import { DocumentLibrary } from '@/components/library/DocumentLibrary';
import { SearchResults } from '@/components/search/SearchResults';
import { DraftPanel } from '@/components/draft/DraftPanel';
import type { Document } from '@/types/document';
import type { DraftItem } from '@/types/draft';
import type { SearchResult } from '@/types/search';
import { showErrorToast } from '@/lib/notifications';

export function WorkspacePage() {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchDocuments() {
      try {
        const response = await fetch('/api/documents');
        if (!response.ok || cancelled) {
          return;
        }

        const payload = (await response.json()) as { documents: Document[] };
        if (!cancelled) {
          setDocuments(payload.documents);
        }
      } catch {
        // Skeleton: ignore fetch errors when API is unavailable.
      }
    }

    void fetchDocuments();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadDocuments = useCallback(async () => {
    try {
      const response = await fetch('/api/documents');
      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { documents: Document[] };
      setDocuments(payload.documents);
    } catch {
      // Skeleton: ignore fetch errors when API is unavailable.
    }
  }, []);

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
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
  };

  const handleAddToDraft = (result: SearchResult) => {
    const item: DraftItem = {
      id: crypto.randomUUID(),
      contentSnapshot: result.snippet,
      sourceFilename: result.filename,
      page: result.page,
      position: draftItems.length,
      createdAt: new Date().toISOString(),
    };

    setDraftItems((current) => [...current, item]);
  };

  const focusSearch = () => {
    searchInputRef.current?.focus();
  };

  const openUpload = () => {
    uploadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <>
      <AppSpotlight onFocusSearch={focusSearch} onOpenUpload={openUpload} />
      <AppShell
        header={{ height: 64 }}
        navbar={{ width: 320, breakpoint: 'sm' }}
        aside={{ width: 360, breakpoint: 'md' }}
        padding="md"
      >
        <AppShell.Header px="md">
          <Group h="100%" justify="space-between">
            <Title order={3}>Document Search</Title>
            <Text size="sm" c="dimmed">
              Cmd+K for commands
            </Text>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar p="md">
          <Stack gap="md" h="100%">
            <Title order={5}>Library</Title>
            <Box ref={uploadRef}>
              <DocumentDropzone onUploaded={loadDocuments} />
            </Box>
            <ScrollArea flex={1}>
              <DocumentLibrary documents={documents} />
            </ScrollArea>
          </Stack>
        </AppShell.Navbar>

        <AppShell.Main>
          <Stack gap="md" maw={900}>
            <Group align="flex-end">
              <TextInput
                ref={searchInputRef}
                flex={1}
                label="Search documents"
                placeholder="Ask across your PDFs…"
                leftSection={<IconSearch size={16} />}
                value={query}
                onChange={(event) => setQuery(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void handleSearch();
                  }
                }}
              />
              <Button onClick={() => void handleSearch()} loading={isSearching}>
                Search
              </Button>
            </Group>

            <SearchResults
              key={results.map((result) => result.id).join('-') || 'empty'}
              results={results}
              onAddToDraft={handleAddToDraft}
            />
          </Stack>
        </AppShell.Main>

        <AppShell.Aside p="md">
          <DraftPanel items={draftItems} />
        </AppShell.Aside>
      </AppShell>
    </>
  );
}
