'use client';

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
import { useSearch } from '@/hooks/useSearch';

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
          <Stack gap={4}>
            <Group align="flex-end">
              <TextInput
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
