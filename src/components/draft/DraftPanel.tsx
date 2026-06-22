'use client';

import { useEffect, useRef } from 'react';
import { Badge, Paper, ScrollArea, Stack, Text, Title } from '@mantine/core';
import type { DraftItem } from '@/types/draft';

interface DraftPanelProps {
  items: DraftItem[];
  highlightedItemId?: string | null;
}

export function DraftPanel({ items, highlightedItemId }: DraftPanelProps) {
  const itemRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  useEffect(() => {
    if (!highlightedItemId) {
      return;
    }

    itemRefs.current.get(highlightedItemId)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [highlightedItemId, items.length]);

  return (
    <Stack gap="md" h="100%">
      <Stack gap={4}>
        <Title order={4}>Collected evidence</Title>
        {items.length > 0 ? (
          <Badge size="sm" variant="light" color="green" w="fit-content">
            {items.length} passage{items.length === 1 ? '' : 's'} collected
          </Badge>
        ) : null}
        <Text size="sm" c="dimmed">
          Cited passages ready to reuse in your response.
        </Text>
      </Stack>

      {items.length === 0 ? (
        <Paper withBorder p="md" radius="md">
          <Text size="sm" c="dimmed">
            Nothing collected yet. Select a result and press Enter, or click Add to evidence.
          </Text>
        </Paper>
      ) : (
        <ScrollArea flex={1} type="auto">
          <Stack gap="sm" pb="md">
            {items.map((item) => {
              const highlighted = item.id === highlightedItemId;

              return (
                <Paper
                  key={item.id}
                  ref={(node) => {
                    itemRefs.current.set(item.id, node);
                  }}
                  withBorder
                  p="md"
                  radius="md"
                  style={{
                    borderColor: highlighted ? 'var(--mantine-color-green-5)' : undefined,
                    background: highlighted ? 'var(--mantine-color-green-light)' : undefined,
                    transition: 'background 0.3s ease, border-color 0.3s ease',
                  }}
                >
                  <Text size="sm">{item.contentSnapshot}</Text>
                  <Text size="xs" c="dimmed" mt={6}>
                    {item.sourceFilename} · p.{item.page}
                  </Text>
                </Paper>
              );
            })}
          </Stack>
        </ScrollArea>
      )}
    </Stack>
  );
}
