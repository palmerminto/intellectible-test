'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

export function useDemoParams() {
  const searchParams = useSearchParams();

  const demoDocsMode = searchParams.get('demoDocs')?.trim() ?? '';
  const demoSearchMode = searchParams.get('demoSearch')?.trim() ?? '';
  const demoEvidenceMode = searchParams.get('demoEvidence')?.trim() ?? '';

  const documentsApiPath = useMemo(() => {
    const params = new URLSearchParams();
    if (demoDocsMode) {
      params.set('demoDocs', demoDocsMode);
    }

    const queryString = params.toString();
    return queryString ? `/api/documents?${queryString}` : '/api/documents';
  }, [demoDocsMode]);

  const searchApiBasePath = useMemo(() => {
    const params = new URLSearchParams();
    if (demoSearchMode) {
      params.set('demoSearch', demoSearchMode);
    }

    const queryString = params.toString();
    return queryString ? `/api/search?${queryString}&` : '/api/search?';
  }, [demoSearchMode]);

  const isDemoActive = Boolean(demoDocsMode || demoSearchMode || demoEvidenceMode);

  return {
    demoDocsMode,
    demoSearchMode,
    demoEvidenceMode,
    isDemoActive,
    documentsApiPath,
    searchApiBasePath,
  };
}
