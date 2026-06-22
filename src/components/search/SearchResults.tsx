'use client';

import { useEffect, useRef } from 'react';
import { Badge, Button, Group, Loader, Paper, Stack, Text } from '@mantine/core';
import { IconCheck, IconPlus } from '@tabler/icons-react';
import type { SearchResult } from '@/types/search';
import { useResultNavigation } from '@/hooks/useResultNavigation';
import { scoreToRelevanceLabel } from '@/lib/relevance';
import { showAddedToEvidenceToast } from '@/lib/notifications';

export type SearchResultsState = 'idle' | 'searching' | 'results' | 'no-results';

interface SearchResultsProps {
  results: SearchResult[];
  state?: SearchResultsState;
  enabled?: boolean;
  addedResultIds?: Set<string>;
  onAddToEvidence?: (result: SearchResult) => void;
}

export function SearchResults({
  results,
  state = 'idle',
  enabled = true,
  addedResultIds = new Set(),
  onAddToEvidence,
}: SearchResultsProps) {
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

  const addToEvidence = (result: SearchResult) => {
    if (addedResultIds.has(result.id)) {
      return;
    }

    onAddToEvidence?.(result);
    showAddedToEvidenceToast(result.filename, result.page);
  };

  const { selectedIndex, setSelectedIndex } = useResultNavigation({
    results,
    enabled: enabled && state === 'results',
    onSelect: addToEvidence,
  });

  useEffect(() => {
    itemRefs.current[selectedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (state === 'searching') {
    return (
      <Group gap="sm">
        <Loader size="sm" />
        <Text size="sm" c="dimmed">
          Searching across your documents...
        </Text>
      </Group>
    );
  }

  if (state === 'no-results') {
    return (
      <Text size="sm" c="dimmed">
        No matches. Try broader terms or upload more documents.
      </Text>
    );
  }

  if (state === 'idle' || results.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        Results appear here after you search. j/k to move - Enter to add to evidence.
      </Text>
    );
  }

  return (
    <Stack gap="sm">
      <Group justify="space-between" align="center">
        <Text size="sm" fw={500}>
          {results.length === 1 ? '1 result' : `${results.length} results`}
        </Text>
        <Text size="xs" c="dimmed">
          j/k to move - Enter to add to evidence
        </Text>
      </Group>

      {results.map((result, index) => {
        const selected = index === selectedIndex;
        const added = addedResultIds.has(result.id);
        const relevanceLabel = scoreToRelevanceLabel(result.score);

        return (
          <Paper
            key={result.id}
            ref={(node) => {
              itemRefs.current[index] = node;
            }}
            withBorder
            p="md"
            radius="md"
            aria-selected={selected}
            onClick={() => setSelectedIndex(index)}
            style={{
              cursor: 'pointer',
              borderColor: selected ? 'var(--mantine-color-blue-5)' : undefined,
              background: selected ? 'var(--mantine-color-blue-light)' : undefined,
            }}
          >
            <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
              <Stack gap="xs" flex={1} style={{ minWidth: 0 }}>
                <Text size="sm">{result.highlightedSnippet || result.snippet}</Text>
                <Group gap="xs" wrap="wrap">
                  <Badge size="sm" variant="light">
                    {result.filename} · p.{result.page}
                  </Badge>
                  <Badge size="sm" variant="outline" color="gray">
                    {relevanceLabel}
                  </Badge>
                  {added ? (
                    <Badge size="sm" variant="light" color="green">
                      In evidence
                    </Badge>
                  ) : null}
                </Group>
              </Stack>
              {added ? (
                <Button
                  size="xs"
                  variant="light"
                  color="green"
                  leftSection={<IconCheck size={14} />}
                  disabled
                  style={{ flexShrink: 0 }}
                >
                  Added
                </Button>
              ) : (
                <Button
                  size="xs"
                  variant={selected ? 'filled' : 'light'}
                  leftSection={<IconPlus size={14} />}
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedIndex(index);
                    addToEvidence(result);
                  }}
                  style={{ flexShrink: 0 }}
                >
                  Add to evidence
                </Button>
              )}
            </Group>
          </Paper>
        );
      })}
    </Stack>
  );
}
