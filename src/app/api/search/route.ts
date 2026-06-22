import { NextResponse } from 'next/server';
import { buildDemoSearchResults } from '@/lib/demo-data';
import type { SearchResult } from '@/types/search';
import type { SearchResponse } from '@/types/search';

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() ?? '';
  const demoSearch = searchParams.get('demoSearch')?.trim().toLowerCase();

  if (!query) {
    return NextResponse.json({ error: 'Query parameter q is required' }, { status: 400 });
  }

  if (demoSearch === 'error') {
    return NextResponse.json({ error: 'Simulated search failure' }, { status: 500 });
  }

  if (demoSearch === 'searching') {
    await wait(2500);
    return NextResponse.json({ results: buildDemoSearchResults(query) } satisfies SearchResponse);
  }

  if (demoSearch === 'results') {
    await wait(700);
    return NextResponse.json({ results: buildDemoSearchResults(query) } satisfies SearchResponse);
  }

  if (demoSearch === 'empty') {
    await wait(700);
    return NextResponse.json({ results: [] satisfies SearchResult[] } satisfies SearchResponse);
  }

  const body: SearchResponse = { results: [] };
  return NextResponse.json(body);
}
