'use client';

import { ActionIcon, Badge, Group, Loader, Paper, Stack, Text } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import type { Document } from '@/types/document';
import { documentStatusColor, documentStatusLabel } from '@/components/library/document-status';

interface DocumentLibraryProps {
  documents: Document[];
  onDismissFailed?: (documentId: string) => void;
}

function isInProgress(status: Document['status']): boolean {
  return status === 'uploading' || status === 'uploaded' || status === 'processing';
}

export function DocumentLibrary({ documents, onDismissFailed }: DocumentLibraryProps) {
  if (documents.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        Uploaded documents will appear here with indexing status.
      </Text>
    );
  }

  return (
    <Stack gap="xs">
      {documents.map((document) => (
        <Paper key={document.id} withBorder p="sm" radius="md">
          <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
            <Text size="sm" fw={500} lineClamp={2} flex={1}>
              {document.filename}
            </Text>
            {document.status === 'failed' ? (
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                aria-label="Remove"
                title="Remove"
                onClick={() => onDismissFailed?.(document.id)}
              >
                <IconX size={14} />
              </ActionIcon>
            ) : null}
          </Group>
          <Group gap="xs" mt={6} wrap="wrap">
            <Badge size="sm" variant="light" color={documentStatusColor(document.status)}>
              {documentStatusLabel(document.status)}
            </Badge>
            {isInProgress(document.status) ? (
              <Loader size={14} type="dots" />
            ) : null}
            {document.status === 'ready' && document.pageCount != null ? (
              <Text size="xs" c="dimmed">
                {document.pageCount} page{document.pageCount === 1 ? '' : 's'}
              </Text>
            ) : null}
          </Group>
          {document.status === 'failed' && document.errorMessage ? (
            <Text size="xs" c="red" mt={6}>
              {document.errorMessage}
            </Text>
          ) : null}
        </Paper>
      ))}
    </Stack>
  );
}
