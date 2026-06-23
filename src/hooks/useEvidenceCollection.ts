'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { addDraftItemApi, createDraftApi, fetchDrafts, removeDraftItemApi } from '@/lib/draft-client';
import { draftItemFromSearchResult } from '@/lib/draft-utils';
import { buildDemoEvidenceItems } from '@/lib/demo-data';
import type { DraftItem, EvidencePersistenceStatus } from '@/types/draft';
import type { SearchResult } from '@/types/search';

const HIGHLIGHT_DURATION_MS = 2000;
const ACTIVE_DRAFT_STORAGE_KEY = 'intellectible:activeDraftId';

export function useEvidenceCollection(demoEvidenceMode: string) {
  const isDemoMode = demoEvidenceMode === 'sample';

  const [draftItems, setDraftItems] = useState<DraftItem[]>(() =>
    isDemoMode ? buildDemoEvidenceItems() : [],
  );
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const [removingItemIds, setRemovingItemIds] = useState<string[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [persistenceStatus, setPersistenceStatus] = useState<EvidencePersistenceStatus>(
    isDemoMode ? 'idle' : 'loading',
  );

  const activeDraftIdRef = useRef<string | null>(null);
  const persistedItemIdsRef = useRef<Set<string>>(new Set());
  const createDraftPromiseRef = useRef<Promise<string> | null>(null);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const pendingSavesRef = useRef(0);
  const saveBatchFailedRef = useRef(false);

  useEffect(() => {
    activeDraftIdRef.current = activeDraftId;
  }, [activeDraftId]);

  useEffect(() => {
    if (isDemoMode) {
      return;
    }

    let cancelled = false;

    async function hydrateDraft() {
      try {
        const data = await fetchDrafts();
        if (cancelled) {
          return;
        }

        const storedDraftId = window.localStorage.getItem(ACTIVE_DRAFT_STORAGE_KEY);
        const preferredDraft = storedDraftId
          ? data.drafts.find((draft) => draft.id === storedDraftId)
          : undefined;
        const activeDraft = preferredDraft ?? data.drafts[0];

        if (activeDraft) {
          setDraftItems(activeDraft.items);
          setActiveDraftId(activeDraft.id);
          window.localStorage.setItem(ACTIVE_DRAFT_STORAGE_KEY, activeDraft.id);
          persistedItemIdsRef.current = new Set(activeDraft.items.map((item) => item.id));
        }

        setPersistenceStatus('idle');
      } catch {
        if (!cancelled) {
          setPersistenceStatus('loadError');
        }
      }
    }

    void hydrateDraft();

    return () => {
      cancelled = true;
    };
  }, [isDemoMode]);

  const ensureActiveDraft = useCallback(async (): Promise<string> => {
    if (activeDraftIdRef.current) {
      return activeDraftIdRef.current;
    }

    if (!createDraftPromiseRef.current) {
      createDraftPromiseRef.current = (async () => {
        const data = await createDraftApi('Collected evidence');
        setActiveDraftId(data.draft.id);
        window.localStorage.setItem(ACTIVE_DRAFT_STORAGE_KEY, data.draft.id);
        activeDraftIdRef.current = data.draft.id;
        return data.draft.id;
      })().finally(() => {
        createDraftPromiseRef.current = null;
      });
    }

    return createDraftPromiseRef.current;
  }, []);

  const persistDraftItem = useCallback(
    async (item: DraftItem) => {
      const draftId = await ensureActiveDraft();
      const data = await addDraftItemApi(draftId, item);

      setDraftItems((current) => {
        const stillPresent = current.some((existing) => existing.id === item.id);
        if (!stillPresent) {
          void removeDraftItemApi(draftId, data.item.id);
          return current;
        }

        persistedItemIdsRef.current.add(data.item.id);
        return current.map((existing) => (existing.id === item.id ? data.item : existing));
      });
    },
    [ensureActiveDraft],
  );

  const removePersistedItem = useCallback(async (itemId: string) => {
    const draftId = activeDraftIdRef.current;
    if (!draftId) {
      return;
    }

    await removeDraftItemApi(draftId, itemId);
  }, []);

  const enqueuePersist = useCallback(
    (item: DraftItem) => {
      pendingSavesRef.current += 1;
      setPersistenceStatus('saving');

      saveQueueRef.current = saveQueueRef.current
        .then(() => persistDraftItem(item))
        .catch(() => {
          saveBatchFailedRef.current = true;
        })
        .finally(() => {
          pendingSavesRef.current -= 1;

          if (pendingSavesRef.current === 0) {
            setPersistenceStatus(saveBatchFailedRef.current ? 'saveError' : 'saved');
            saveBatchFailedRef.current = false;
          }
        });
    },
    [persistDraftItem],
  );

  const enqueueRemove = useCallback(
    (itemId: string) => {
      setRemovingItemIds((current) => [...current, itemId]);

      saveQueueRef.current = saveQueueRef.current
        .then(() => removePersistedItem(itemId))
        .catch(() => {
          setPersistenceStatus('saveError');
        })
        .finally(() => {
          setRemovingItemIds((current) => current.filter((id) => id !== itemId));
        });
    },
    [removePersistedItem],
  );

  const addedResultIds = useMemo(
    () =>
      new Set(
        draftItems
          .map((item) => item.resultId)
          .filter((resultId): resultId is string => Boolean(resultId)),
      ),
    [draftItems],
  );

  const handleAddToEvidence = useCallback(
    (result: SearchResult) => {
      const itemId = crypto.randomUUID();
      let added = false;
      let addedItem: DraftItem | null = null;

      setDraftItems((current) => {
        if (current.some((item) => item.resultId === result.id)) {
          return current;
        }

        added = true;
        addedItem = draftItemFromSearchResult(
          result,
          current.length,
          itemId,
          new Date().toISOString(),
        );

        return [...current, addedItem];
      });

      if (!added || !addedItem) {
        return;
      }

      setHighlightedItemId(itemId);

      window.setTimeout(() => {
        setHighlightedItemId((current) => (current === itemId ? null : current));
      }, HIGHLIGHT_DURATION_MS);

      if (!isDemoMode) {
        enqueuePersist(addedItem);
      }
    },
    [isDemoMode, enqueuePersist],
  );

  const handleRemoveFromEvidence = useCallback(
    (itemId: string) => {
      setDraftItems((current) => current.filter((item) => item.id !== itemId));

      if (highlightedItemId === itemId) {
        setHighlightedItemId(null);
      }

      if (!isDemoMode && persistedItemIdsRef.current.has(itemId)) {
        persistedItemIdsRef.current.delete(itemId);
        enqueueRemove(itemId);
      }
    },
    [highlightedItemId, isDemoMode, enqueueRemove],
  );

  return {
    draftItems,
    addedResultIds,
    highlightedItemId,
    removingItemIds,
    persistenceStatus,
    handleAddToEvidence,
    handleRemoveFromEvidence,
  };
}
