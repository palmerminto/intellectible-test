'use client';

import { Group, Text } from '@mantine/core';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import { IconFileTypePdf, IconUpload, IconX } from '@tabler/icons-react';
import { showErrorToast } from '@/lib/notifications';

interface DocumentDropzoneProps {
  onUploadStart?: (filename: string) => string;
  onUploadFailed?: (optimisticId: string, errorMessage: string) => void;
  onUploaded?: () => void;
}

export function DocumentDropzone({
  onUploadStart,
  onUploadFailed,
  onUploaded,
}: DocumentDropzoneProps) {
  const uploadFailedMessage = 'Upload failed';

  const handleDrop = async (files: File[]) => {
    for (const file of files) {
      const optimisticId = onUploadStart?.(file.name);
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string };
          const message = payload.error ?? uploadFailedMessage;
          showErrorToast(message);
          if (optimisticId) {
            onUploadFailed?.(optimisticId, message);
          }
          continue;
        }

        onUploaded?.();
      } catch {
        showErrorToast(uploadFailedMessage);
        if (optimisticId) {
          onUploadFailed?.(optimisticId, uploadFailedMessage);
        }
      }
    }
  };

  return (
    <Dropzone
      onDrop={handleDrop}
      maxSize={25 * 1024 * 1024}
      accept={[MIME_TYPES.pdf]}
      multiple
    >
      <Group justify="center" gap="md" mih={140} style={{ pointerEvents: 'none' }}>
        <Dropzone.Accept>
          <IconUpload size={40} stroke={1.5} />
        </Dropzone.Accept>
        <Dropzone.Reject>
          <IconX size={40} stroke={1.5} />
        </Dropzone.Reject>
        <Dropzone.Idle>
          <IconFileTypePdf size={40} stroke={1.5} />
        </Dropzone.Idle>

        <div>
          <Text size="lg" inline>
            Drop RFPs, amendments, or proposals
          </Text>
          <Text size="sm" c="dimmed" mt={4}>
            PDFs up to 25 MB. They will be parsed and made searchable.
          </Text>
        </div>
      </Group>
    </Dropzone>
  );
}
