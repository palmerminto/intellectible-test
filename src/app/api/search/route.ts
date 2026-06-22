import { NextResponse } from 'next/server';
import type { SearchResponse } from '@/types/search';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() ?? '';

  if (!query) {
    return NextResponse.json({ error: 'Query parameter q is required' }, { status: 400 });
  }

  const body: SearchResponse = { results: [] };
  return NextResponse.json(body);
}
