'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getSearchDisabledMessage,
  hasProcessingDocuments,
  hasReadyDocuments,
} from '@/lib/document-state-utils';
import { showErrorToast } from '@/lib/notifications';
import type { Document } from '@/types/document';

const POLL_INTERVAL_MS = 2500;

function normalizeDocument(doc: Document): Document {
  return {
    ...doc,
    pageCount: doc.pageCount ?? null,
    errorMessage: doc.errorMessage ?? null,
  };
}

export function useDocuments(documentsApiPath: string, options?: { isDemoMode?: boolean }) {
  const isDemoMode = options?.isDemoMode ?? false;
  const [documents, setDocuments] = useState<Document[]>([]);
  const [removingDocumentIds, setRemovingDocumentIds] = useState<string[]>([]);
  const pendingUploadIds = useRef(new Set<string>());

  const mergeDocuments = useCallback((incoming: Document[]) => {
    setDocuments((current) => {
      const optimistic = current.filter(
        (doc) => doc.status === 'uploading' && pendingUploadIds.current.has(doc.id),
      );

      return [...optimistic, ...incoming];
    });
  }, []);

  const readDocuments = useCallback(async (): Promise<Document[] | null> => {
    try {
      const response = await fetch(documentsApiPath);
      if (!response.ok) {
        return null;
      }

      const payload = (await response.json()) as { documents: Document[] };
      return payload.documents.map(normalizeDocument);
    } catch {
      return null;
    }
  }, [documentsApiPath]);

  const loadDocuments = useCallback(async () => {
    const documentsFromApi = await readDocuments();
    if (documentsFromApi) {
      mergeDocuments(documentsFromApi);
    }
  }, [mergeDocuments, readDocuments]);

  useEffect(() => {
    let cancelled = false;

    async function fetchInitialDocuments() {
      const documentsFromApi = await readDocuments();
      if (!cancelled && documentsFromApi) {
        mergeDocuments(documentsFromApi);
      }
    }

    void fetchInitialDocuments();

    return () => {
      cancelled = true;
    };
  }, [mergeDocuments, readDocuments]);

  useEffect(() => {
    if (!hasProcessingDocuments(documents)) {
      return;
    }

    const interval = window.setInterval(() => {
      void loadDocuments();
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [documents, loadDocuments]);

  const handleUploadStart = useCallback((filename: string) => {
    const optimisticId = `optimistic-${crypto.randomUUID()}`;
    pendingUploadIds.current.add(optimisticId);

    const optimistic: Document = {
      id: optimisticId,
      filename,
      status: 'uploading',
      sizeBytes: null,
      pageCount: null,
      errorMessage: null,
      createdAt: new Date().toISOString(),
    };

    setDocuments((current) => [optimistic, ...current]);
    return optimisticId;
  }, []);

  const handleUploadComplete = useCallback(
    (optimisticId: string) => {
      pendingUploadIds.current.delete(optimisticId);
      setDocuments((current) => current.filter((doc) => doc.id !== optimisticId));
      void loadDocuments();
    },
    [loadDocuments],
  );

  const handleUploadFailed = useCallback((optimisticId: string, errorMessage: string) => {
    pendingUploadIds.current.delete(optimisticId);

    setDocuments((current) =>
      current.map((doc) =>
        doc.id === optimisticId
          ? { ...doc, status: 'failed', errorMessage }
          : doc,
      ),
    );
  }, []);

  const handleRemoveDocument = useCallback(
    async (documentId: string) => {
      if (removingDocumentIds.includes(documentId)) {
        return;
      }

      const isOptimistic = documentId.startsWith('optimistic-');

      if (isOptimistic) {
        pendingUploadIds.current.delete(documentId);
        setDocuments((current) => current.filter((doc) => doc.id !== documentId));
        return;
      }

      if (isDemoMode) {
        setDocuments((current) => current.filter((doc) => doc.id !== documentId));
        return;
      }

      setRemovingDocumentIds((current) => [...current, documentId]);

      try {
        const response = await fetch(`/api/documents/${documentId}`, { method: 'DELETE' });

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string };
          showErrorToast(payload.error ?? 'Failed to delete document');
          return;
        }

        setDocuments((current) => current.filter((doc) => doc.id !== documentId));
      } catch {
        showErrorToast('Failed to delete document');
      } finally {
        setRemovingDocumentIds((current) => current.filter((id) => id !== documentId));
      }
    },
    [isDemoMode, removingDocumentIds],
  );

  return {
    documents,
    removingDocumentIds,
    handleUploadStart,
    handleUploadComplete,
    handleUploadFailed,
    handleRemoveDocument,
    searchEnabled: hasReadyDocuments(documents),
    searchDisabledMessage: getSearchDisabledMessage(documents),
  };
}
