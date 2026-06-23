'use client';

import { useEffect, useRef } from 'react';
import { Badge, Button, Group, Loader, Paper, Stack, Text } from '@mantine/core';
import { IconCheck, IconPlus, IconSearch } from '@tabler/icons-react';
import type { SearchResult } from '@/types/search';

function scoreToRelevanceLabel(score: number): string {
  if (score >= 0.75) {
    return 'Strong match';
  }

  return 'Related passage';
}

export type SearchResultsState = 'idle' | 'searching' | 'results' | 'no-results';

const EMPTY_RESULT_IDS = new Set<string>();

interface SearchResultsProps {
  results: SearchResult[];
  state?: SearchResultsState;
  selectedIndex: number;
  onSelectedIndexChange: (index: number) => void;
  addedResultIds?: Set<string>;
  onAddToEvidence?: (result: SearchResult) => void;
}

export function SearchResults({
  results,
  state = 'idle',
  selectedIndex,
  onSelectedIndexChange,
  addedResultIds = EMPTY_RESULT_IDS,
  onAddToEvidence,
}: SearchResultsProps) {
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

  const addToEvidence = (result: SearchResult) => {
    onAddToEvidence?.(result);
  };

  useEffect(() => {
    itemRefs.current[selectedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (state === 'searching') {
    return (
      <Paper withBorder p="md" radius="md">
        <Group gap="sm">
          <Loader size="sm" />
          <Stack gap={2}>
            <Text size="sm" fw={500}>
              Searching across your documents
            </Text>
            <Text size="xs" c="dimmed">
              Matching keywords and semantic meaning in indexed passages.
            </Text>
          </Stack>
        </Group>
      </Paper>
    );
  }

  if (state === 'no-results') {
    return (
      <Paper withBorder p="md" radius="md">
        <Stack gap={6}>
          <Text size="sm" fw={500}>
            No matches found
          </Text>
          <Text size="sm" c="dimmed">
            Try broader terms, synonyms, or upload more documents to expand the search index.
          </Text>
        </Stack>
      </Paper>
    );
  }

  if (state === 'idle' || results.length === 0) {
    return (
      <Paper withBorder p="md" radius="md">
        <Stack gap={6} align="center">
          <IconSearch size={28} stroke={1.5} color="var(--mantine-color-dimmed)" />
          <Text size="sm" ta="center">
            Search results appear here
          </Text>
          <Text size="xs" c="dimmed" ta="center">
            Run a search to see cited passages. Use ⌘/Ctrl+j/k to move between results and Enter
            to add to evidence.
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack gap="sm">
      <Group justify="space-between" align="center">
        <Text size="sm" fw={500}>
          {results.length === 1 ? '1 result' : `${results.length} results`}
        </Text>
        <Text size="xs" c="dimmed">
          ⌘/Ctrl+j/k to move · Enter to add to evidence
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
            onClick={() => onSelectedIndexChange(index)}
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
                    onSelectedIndexChange(index);
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
