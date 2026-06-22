import type { DocumentDisplayStatus } from '@/types/document';

export function documentStatusLabel(status: DocumentDisplayStatus): string {
  switch (status) {
    case 'uploading':
      return 'Uploading';
    case 'uploaded':
      return 'Queued';
    case 'processing':
      return 'Processing';
    case 'ready':
      return 'Ready';
    case 'failed':
      return 'Failed';
    default:
      return 'Queued';
  }
}

export function documentStatusColor(
  status: DocumentDisplayStatus,
): 'gray' | 'blue' | 'green' | 'red' {
  switch (status) {
    case 'uploading':
    case 'uploaded':
      return 'gray';
    case 'processing':
      return 'blue';
    case 'ready':
      return 'green';
    case 'failed':
      return 'red';
    default:
      return 'gray';
  }
}
