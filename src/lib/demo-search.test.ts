import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { buildDemoSearchResultsMock } = vi.hoisted(() => ({
  buildDemoSearchResultsMock: vi.fn(),
}));

vi.mock('@/lib/demo-data', () => ({
  buildDemoSearchResults: buildDemoSearchResultsMock,
}));

import { resolveDemoSearch } from '@/lib/demo-search';

describe('resolveDemoSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    buildDemoSearchResultsMock.mockReturnValue([
      {
        id: 'demo-result-1',
        snippet: 'Demo snippet',
        highlightedSnippet: 'Demo snippet',
        documentId: 'demo-doc-1',
        filename: 'demo.pdf',
        page: 1,
        score: 0.8,
      },
    ]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns inactive when demo mode is not set', async () => {
    await expect(resolveDemoSearch('', 'cloud migration')).resolves.toEqual({ kind: 'inactive' });
    expect(buildDemoSearchResultsMock).not.toHaveBeenCalled();
  });

  it('returns a simulated error for demoSearch=error', async () => {
    await expect(resolveDemoSearch('error', 'cloud migration')).resolves.toEqual({
      kind: 'error',
      message: 'Simulated search failure',
    });
  });

  it('returns demo results for demoSearch=results', async () => {
    vi.useFakeTimers();
    const outcomePromise = resolveDemoSearch('results', 'cloud migration');

    await vi.advanceTimersByTimeAsync(700);
    const outcome = await outcomePromise;

    expect(outcome).toEqual({
      kind: 'results',
      results: [
        {
          id: 'demo-result-1',
          snippet: 'Demo snippet',
          highlightedSnippet: 'Demo snippet',
          documentId: 'demo-doc-1',
          filename: 'demo.pdf',
          page: 1,
          score: 0.8,
        },
      ],
    });
    expect(buildDemoSearchResultsMock).toHaveBeenCalledWith('cloud migration');
  });

  it('returns delayed demo results for demoSearch=searching', async () => {
    vi.useFakeTimers();
    const outcomePromise = resolveDemoSearch('searching', 'cloud migration');

    await vi.advanceTimersByTimeAsync(2500);
    const outcome = await outcomePromise;

    expect(outcome).toEqual({
      kind: 'results',
      results: [
        {
          id: 'demo-result-1',
          snippet: 'Demo snippet',
          highlightedSnippet: 'Demo snippet',
          documentId: 'demo-doc-1',
          filename: 'demo.pdf',
          page: 1,
          score: 0.8,
        },
      ],
    });
  });

  it('returns an empty result set for demoSearch=empty', async () => {
    vi.useFakeTimers();
    const outcomePromise = resolveDemoSearch('empty', 'cloud migration');

    await vi.advanceTimersByTimeAsync(700);
    await expect(outcomePromise).resolves.toEqual({
      kind: 'results',
      results: [],
    });
    expect(buildDemoSearchResultsMock).not.toHaveBeenCalled();
  });
});
