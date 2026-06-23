import { NextResponse } from 'next/server';
import { resolveDemoSearch } from '@/lib/demo-search';
import { searchDocuments } from '@/lib/rag/search';
import type { SearchResponse } from '@/types/search';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() ?? '';
  const demoSearch = searchParams.get('demoSearch')?.trim() ?? '';

  if (!query) {
    return NextResponse.json({ error: 'Query parameter q is required' }, { status: 400 });
  }

  const demoOutcome = await resolveDemoSearch(demoSearch, query);

  if (demoOutcome.kind === 'error') {
    return NextResponse.json({ error: demoOutcome.message }, { status: 500 });
  }

  if (demoOutcome.kind === 'results') {
    return NextResponse.json({ results: demoOutcome.results } satisfies SearchResponse);
  }

  try {
    const results = await searchDocuments(query);
    return NextResponse.json({ results } satisfies SearchResponse);
  } catch (error) {
    console.error('Search request failed', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
