'use client';

import { Group, Text } from '@mantine/core';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import { IconFileTypePdf, IconUpload, IconX } from '@tabler/icons-react';
import { showErrorToast } from '@/lib/notifications';

interface DocumentDropzoneProps {
  onUploaded?: () => void;
}

export function DocumentDropzone({ onUploaded }: DocumentDropzoneProps) {
  const handleDrop = async (files: File[]) => {
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string };
          showErrorToast(payload.error ?? 'Upload is not implemented yet');
          continue;
        }

        onUploaded?.();
      } catch {
        showErrorToast('Upload failed');
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
            Drop PDFs here
          </Text>
          <Text size="sm" c="dimmed" inline mt={4}>
            or click to browse. Upload wiring comes next.
          </Text>
        </div>
      </Group>
    </Dropzone>
  );
}
