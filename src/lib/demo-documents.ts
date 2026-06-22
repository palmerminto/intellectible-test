import type { Document } from '@/types/document';
import { buildDemoDocuments } from '@/lib/demo-data';

const PROCESSING_READY_MS = 5000;

let processingDemoStartedAt: number | null = null;

/**
 * Demo-only state for processing -> ready transition across poll requests.
 * Resets when leaving processing mode.
 */
export function resolveDemoDocuments(mode: string): Document[] {
  if (mode !== 'processing') {
    processingDemoStartedAt = null;
    return buildDemoDocuments(mode);
  }

  if (processingDemoStartedAt === null) {
    processingDemoStartedAt = Date.now();
  }

  const [processingDoc] = buildDemoDocuments('processing');
  const elapsed = Date.now() - processingDemoStartedAt;

  if (elapsed >= PROCESSING_READY_MS) {
    return [
      {
        ...processingDoc,
        status: 'ready',
        pageCount: 12,
        errorMessage: null,
      },
    ];
  }

  return [processingDoc];
}
