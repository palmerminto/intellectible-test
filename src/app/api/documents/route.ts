import { NextResponse } from 'next/server';
import { resolveDemoDocuments } from '@/lib/demo-documents';
import type { DocumentsResponse } from '@/types/document';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const demoDocs = searchParams.get('demoDocs')?.trim().toLowerCase();

  const documents = demoDocs ? resolveDemoDocuments(demoDocs) : [];
  const body: DocumentsResponse = { documents };
  return NextResponse.json(body);
}
