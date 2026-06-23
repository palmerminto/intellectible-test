'use client';

import { useEffect, useRef } from 'react';
import { ActionIcon, Badge, Group, Paper, ScrollArea, Stack, Text, Title } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { evidencePersistenceStatusCopy } from '@/lib/draft-utils';
import type { DraftItem, EvidencePersistenceStatus } from '@/types/draft';

interface DraftPanelProps {
  items: DraftItem[];
  highlightedItemId?: string | null;
  removingItemIds?: readonly string[];
  persistenceStatus?: EvidencePersistenceStatus;
  onRemoveItem?: (itemId: string) => void;
}

export function DraftPanel({
  items,
  highlightedItemId,
  removingItemIds = [],
  persistenceStatus = 'idle',
  onRemoveItem,
}: DraftPanelProps) {
  const statusCopy = evidencePersistenceStatusCopy(persistenceStatus);
  const isErrorStatus =
    persistenceStatus === 'saveError' || persistenceStatus === 'loadError';
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
        {statusCopy ? (
          <Text
            size="xs"
            c={isErrorStatus ? 'red' : 'dimmed'}
            aria-live="polite"
          >
            {statusCopy}
          </Text>
        ) : null}
      </Stack>

      {items.length === 0 ? (
        <Paper withBorder p="md" radius="md">
          <Stack gap={6}>
            <Text size="sm" fw={500}>
              No evidence collected yet
            </Text>
            <Text size="sm" c="dimmed">
              Search for a passage, then click Add to evidence or press Enter on a selected result.
              Collected passages stay here for review.
            </Text>
          </Stack>
        </Paper>
      ) : (
        <ScrollArea flex={1} type="auto">
          <Stack gap="sm" pb="md">
            {items.map((item) => {
              const highlighted = item.id === highlightedItemId;
              const isRemoving = removingItemIds.includes(item.id);

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
                  <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
                    <Text size="sm" flex={1}>
                      {item.contentSnapshot}
                    </Text>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="sm"
                      aria-label="Remove evidence"
                      title="Remove evidence"
                      loading={isRemoving}
                      disabled={isRemoving}
                      onClick={() => onRemoveItem?.(item.id)}
                    >
                      <IconX size={14} />
                    </ActionIcon>
                  </Group>
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
