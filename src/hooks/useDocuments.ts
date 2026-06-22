'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Document } from '@/types/document';

const POLL_INTERVAL_MS = 2500;

function normalizeDocument(doc: Document): Document {
  return {
    ...doc,
    pageCount: doc.pageCount ?? null,
    errorMessage: doc.errorMessage ?? null,
  };
}

function hasProcessingDocuments(documents: Document[]): boolean {
  return documents.some(
    (doc) =>
      doc.status === 'uploading' ||
      doc.status === 'uploaded' ||
      doc.status === 'processing',
  );
}

export function hasReadyDocuments(documents: Document[]): boolean {
  return documents.some((doc) => doc.status === 'ready');
}

export function useDocuments(documentsApiPath: string) {
  const [documents, setDocuments] = useState<Document[]>([]);
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

  const handleDismissFailed = useCallback((documentId: string) => {
    pendingUploadIds.current.delete(documentId);
    setDocuments((current) => current.filter((doc) => doc.id !== documentId));
  }, []);

  return {
    documents,
    handleUploadStart,
    handleUploadComplete,
    handleUploadFailed,
    handleDismissFailed,
    searchEnabled: hasReadyDocuments(documents),
  };
}
