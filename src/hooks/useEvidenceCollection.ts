'use client';

import { useCallback, useMemo, useState } from 'react';
import type { DraftItem } from '@/types/draft';
import type { SearchResult } from '@/types/search';
import { buildDemoEvidenceItems } from '@/lib/demo-data';

const HIGHLIGHT_DURATION_MS = 2000;

export function useEvidenceCollection(demoEvidenceMode: string) {
  const [draftItems, setDraftItems] = useState<DraftItem[]>(() =>
    demoEvidenceMode === 'sample' ? buildDemoEvidenceItems() : [],
  );
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);

  const addedResultIds = useMemo(
    () =>
      new Set(
        draftItems
          .map((item) => item.resultId)
          .filter((resultId): resultId is string => Boolean(resultId)),
      ),
    [draftItems],
  );

  const handleAddToEvidence = useCallback((result: SearchResult) => {
    const itemId = crypto.randomUUID();
    let added = false;

    setDraftItems((current) => {
      if (current.some((item) => item.resultId === result.id)) {
        return current;
      }

      added = true;

      const item: DraftItem = {
        id: itemId,
        resultId: result.id,
        contentSnapshot: result.snippet,
        sourceFilename: result.filename,
        page: result.page,
        position: current.length,
        createdAt: new Date().toISOString(),
      };

      return [...current, item];
    });

    if (!added) {
      return;
    }

    setHighlightedItemId(itemId);

    window.setTimeout(() => {
      setHighlightedItemId((current) => (current === itemId ? null : current));
    }, HIGHLIGHT_DURATION_MS);
  }, []);

  return {
    draftItems,
    addedResultIds,
    highlightedItemId,
    handleAddToEvidence,
  };
}
