import { buildDemoSearchResults } from '@/lib/demo-data';
import type { SearchResult } from '@/types/search';

const DEMO_SEARCH_DELAYS_MS = {
  searching: 2500,
  results: 700,
  empty: 700,
} as const;

export type DemoSearchOutcome =
  | { kind: 'inactive' }
  | { kind: 'error'; message: string }
  | { kind: 'results'; results: SearchResult[] };

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Resolve opt-in demo search behaviour from the `demoSearch` query param.
 *
 * Returns `inactive` when no demo mode is active so the route can fall through
 * to real hybrid search.
 */
export async function resolveDemoSearch(mode: string, query: string): Promise<DemoSearchOutcome> {
  const normalised = mode.trim().toLowerCase();

  if (!normalised) {
    return { kind: 'inactive' };
  }

  if (normalised === 'error') {
    return { kind: 'error', message: 'Simulated search failure' };
  }

  if (normalised === 'searching' || normalised === 'results') {
    await wait(DEMO_SEARCH_DELAYS_MS[normalised]);
    return { kind: 'results', results: buildDemoSearchResults(query) };
  }

  if (normalised === 'empty') {
    await wait(DEMO_SEARCH_DELAYS_MS.empty);
    return { kind: 'results', results: [] };
  }

  return { kind: 'inactive' };
}
