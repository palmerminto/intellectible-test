'use client';

import { useEffect, useRef } from 'react';
import { Badge, Paper, Stack, Text } from '@mantine/core';
import type { SearchResult } from '@/types/search';
import { useResultNavigation } from '@/hooks/useResultNavigation';
import { showAddedToDraftToast } from '@/lib/notifications';

interface SearchResultsProps {
  results: SearchResult[];
  enabled?: boolean;
  onAddToDraft?: (result: SearchResult) => void;
}

export function SearchResults({ results, enabled = true, onAddToDraft }: SearchResultsProps) {
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

  const handleSelect = (result: SearchResult) => {
    onAddToDraft?.(result);
    showAddedToDraftToast(result.filename, result.page);
  };

  const { selectedIndex } = useResultNavigation({
    results,
    enabled,
    onSelect: handleSelect,
  });

  useEffect(() => {
    itemRefs.current[selectedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (results.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        Search results will appear here. Use j/k to move and Enter to add to draft.
      </Text>
    );
  }

  return (
    <Stack gap="sm">
      {results.map((result, index) => {
        const selected = index === selectedIndex;

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
            style={{
              borderColor: selected ? 'var(--mantine-color-blue-5)' : undefined,
              background: selected ? 'var(--mantine-color-blue-light)' : undefined,
            }}
          >
            <Text size="sm">{result.highlightedSnippet || result.snippet}</Text>
            <Badge size="sm" variant="light" mt="sm">
              {result.filename} · p.{result.page}
            </Badge>
          </Paper>
        );
      })}
    </Stack>
  );
}
