'use client';

import { useCallback, useEffect, useRef } from 'react';
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
import { SearchResults } from '@/components/search/SearchResults';
import { DraftPanel } from '@/components/draft/DraftPanel';
import { useDemoParams } from '@/hooks/useDemoParams';
import { useDocuments } from '@/hooks/useDocuments';
import { useEvidenceCollection } from '@/hooks/useEvidenceCollection';
import { useResultNavigation } from '@/hooks/useResultNavigation';
import { useSearch } from '@/hooks/useSearch';
import { handleResultNavigationKeyDown } from '@/lib/result-navigation-keys';
import { isFocusSearchShortcut } from '@/lib/focus-search-shortcut';
import { focusAndSelectInput } from '@/lib/scroll-into-view-with-offset';
import { showAddedToEvidenceToast } from '@/lib/notifications';
import type { SearchResult } from '@/types/search';

export function WorkspacePage() {
  const {
    demoDocsMode,
    demoSearchMode,
    demoEvidenceMode,
    isDemoActive,
    documentsApiPath,
    searchApiBasePath,
  } = useDemoParams();

  const {
    documents,
    handleUploadStart,
    handleUploadComplete,
    handleUploadFailed,
    removingDocumentIds,
    handleRemoveDocument,
    searchEnabled: documentsReady,
    searchDisabledMessage,
  } = useDocuments(documentsApiPath, { isDemoMode: Boolean(demoDocsMode) });

  const { draftItems, addedResultIds, highlightedItemId, handleAddToEvidence } =
    useEvidenceCollection(demoEvidenceMode);

  const {
    query,
    setQuery,
    results,
    isSearching,
    searchEnabled,
    handleSearch,
    resultsState,
  } = useSearch({
    searchApiBasePath,
    documentsReady,
    demoSearchMode,
  });

  const handleAddSearchResultToEvidence = useCallback(
    (result: SearchResult) => {
      if (addedResultIds.has(result.id)) {
        return;
      }

      handleAddToEvidence(result);
      showAddedToEvidenceToast(result.filename, result.page);
    },
    [addedResultIds, handleAddToEvidence],
  );

  const { selectedIndex, setSelectedIndex, moveSelection } = useResultNavigation({
    results,
    enabled: resultsState === 'results',
    onSelect: handleAddSearchResultToEvidence,
  });

  const searchSectionRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const hasAutoFocusedSearch = useRef(false);

  const focusSearchInput = useCallback(() => {
    if (!searchEnabled) {
      return;
    }

    const input = searchInputRef.current;
    if (!input) {
      return;
    }

    focusAndSelectInput(input, searchSectionRef.current ?? input);
  }, [searchEnabled]);

  useEffect(() => {
    if (!searchEnabled || hasAutoFocusedSearch.current) {
      return;
    }

    searchInputRef.current?.focus();
    hasAutoFocusedSearch.current = true;
  }, [searchEnabled]);

  useEffect(() => {
    if (!searchEnabled) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isFocusSearchShortcut(event)) {
        return;
      }

      event.preventDefault();
      focusSearchInput();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [searchEnabled, focusSearchInput]);

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
              onUploadComplete={handleUploadComplete}
              onUploadFailed={handleUploadFailed}
            />
          </Box>
          <ScrollArea flex={1}>
            <DocumentLibrary
              documents={documents}
              removingDocumentIds={removingDocumentIds}
              onRemoveDocument={handleRemoveDocument}
            />
          </ScrollArea>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Stack gap="md" maw={900}>
          {isDemoActive && (
            <Text size="xs" c="dimmed">
              Demo mode active
              {demoDocsMode ? ` · demoDocs=${demoDocsMode}` : ''}
              {demoSearchMode ? ` · demoSearch=${demoSearchMode}` : ''}
              {demoEvidenceMode ? ` · demoEvidence=${demoEvidenceMode}` : ''}
            </Text>
          )}
          <Box
            ref={searchSectionRef}
            style={{
              position: 'sticky',
              top: 'var(--app-shell-header-offset, 4rem)',
              zIndex: 100,
              backgroundColor: 'var(--mantine-color-body)',
              paddingBottom: 'var(--mantine-spacing-sm)',
            }}
          >
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
                    if (isFocusSearchShortcut(event)) {
                      event.preventDefault();
                      focusSearchInput();
                      return;
                    }

                    if (
                      resultsState === 'results' &&
                      results.length > 0 &&
                      handleResultNavigationKeyDown(event, moveSelection)
                    ) {
                      return;
                    }

                    if (event.key === 'Enter' && !event.ctrlKey && !event.metaKey) {
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
              {!searchEnabled && searchDisabledMessage ? (
                <Text size="xs" c="dimmed">
                  {searchDisabledMessage}
                </Text>
              ) : null}
            </Stack>
          </Box>

          <SearchResults
            key={results.map((result) => result.id).join('-') || resultsState}
            results={results}
            state={resultsState}
            selectedIndex={selectedIndex}
            onSelectedIndexChange={setSelectedIndex}
            addedResultIds={addedResultIds}
            onAddToEvidence={handleAddSearchResultToEvidence}
          />
        </Stack>
      </AppShell.Main>

      <AppShell.Aside p="md">
        <DraftPanel items={draftItems} highlightedItemId={highlightedItemId} />
      </AppShell.Aside>
    </AppShell>
  );
}
