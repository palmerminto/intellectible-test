'use client';

import { Badge, Paper, Stack, Text } from '@mantine/core';
import type { Document } from '@/types/document';

interface DocumentLibraryProps {
  documents: Document[];
}

export function DocumentLibrary({ documents }: DocumentLibraryProps) {
  if (documents.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        No documents yet.
      </Text>
    );
  }

  return (
    <Stack gap="xs">
      {documents.map((document) => (
        <Paper key={document.id} withBorder p="sm" radius="md">
          <Text size="sm" fw={500}>
            {document.filename}
          </Text>
          <Badge size="sm" variant="light" mt={6}>
            {document.status}
          </Badge>
        </Paper>
      ))}
    </Stack>
  );
}
