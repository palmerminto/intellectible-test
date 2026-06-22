'use client';

import { Paper, Stack, Text, Title } from '@mantine/core';
import type { DraftItem } from '@/types/draft';

interface DraftPanelProps {
  items: DraftItem[];
}

export function DraftPanel({ items }: DraftPanelProps) {
  return (
    <Stack gap="md" h="100%">
      <Title order={4}>Draft</Title>
      <Text size="sm" c="dimmed">
        Collected passages with citations will show here.
      </Text>

      {items.length === 0 ? (
        <Paper withBorder p="md" radius="md">
          <Text size="sm" c="dimmed">
            Nothing in the draft yet. Select a search result and press Enter.
          </Text>
        </Paper>
      ) : (
        <Stack gap="sm">
          {items.map((item) => (
            <Paper key={item.id} withBorder p="md" radius="md">
              <Text size="sm">{item.contentSnapshot}</Text>
              <Text size="xs" c="dimmed" mt={6}>
                {item.sourceFilename} · p.{item.page}
              </Text>
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
