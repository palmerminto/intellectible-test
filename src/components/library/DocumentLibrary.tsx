'use client';

import { ActionIcon, Badge, Group, Loader, Paper, Stack, Text } from '@mantine/core';
import { IconFileTypePdf, IconX } from '@tabler/icons-react';
import {
  formatDocumentSize,
  getDocumentStatusMeta,
} from '@/lib/document-state-utils';
import type { Document } from '@/types/document';

interface DocumentLibraryProps {
  documents: Document[];
  removingDocumentIds?: readonly string[];
  onRemoveDocument?: (documentId: string) => void;
}

function canRemoveDocument(status: Document['status']): boolean {
  return status !== 'uploading';
}

export function DocumentLibrary({
  documents,
  removingDocumentIds = [],
  onRemoveDocument,
}: DocumentLibraryProps) {
  if (documents.length === 0) {
    return (
      <Paper withBorder p="md" radius="md">
        <Stack gap={6} align="center">
          <IconFileTypePdf size={28} stroke={1.5} color="var(--mantine-color-dimmed)" />
          <Text size="sm" ta="center">
            No documents yet
          </Text>
          <Text size="xs" c="dimmed" ta="center">
            Drop a PDF above to start indexing. Status updates appear here while pages are parsed
            and made searchable.
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack gap="xs">
      {documents.map((document) => {
        const statusMeta = getDocumentStatusMeta(document.status);
        const sizeLabel = formatDocumentSize(document.sizeBytes);

        return (
          <Paper key={document.id} withBorder p="sm" radius="md">
            <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
              <Text size="sm" fw={500} lineClamp={2} flex={1}>
                {document.filename}
              </Text>
              {canRemoveDocument(document.status) ? (
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  aria-label="Remove document"
                  title="Remove document"
                  loading={removingDocumentIds.includes(document.id)}
                  disabled={removingDocumentIds.includes(document.id)}
                  onClick={() => onRemoveDocument?.(document.id)}
                >
                  <IconX size={14} />
                </ActionIcon>
              ) : null}
            </Group>
            <Group gap="xs" mt={6} wrap="wrap">
              <Badge size="sm" variant="light" color={statusMeta.color}>
                {statusMeta.label}
              </Badge>
              {statusMeta.isInProgress ? (
                <Loader size={14} type="dots" />
              ) : null}
              {document.status === 'ready' && document.pageCount != null ? (
                <Text size="xs" c="dimmed">
                  {document.pageCount} page{document.pageCount === 1 ? '' : 's'}
                </Text>
              ) : null}
              {document.status === 'ready' && sizeLabel ? (
                <Text size="xs" c="dimmed">
                  {sizeLabel}
                </Text>
              ) : null}
            </Group>
            {statusMeta.helperText ? (
              <Text size="xs" c="dimmed" mt={6}>
                {statusMeta.helperText}
              </Text>
            ) : null}
            {document.status === 'failed' && document.errorMessage ? (
              <Text size="xs" c="red" mt={6}>
                {document.errorMessage}
              </Text>
            ) : null}
          </Paper>
        );
      })}
    </Stack>
  );
}
