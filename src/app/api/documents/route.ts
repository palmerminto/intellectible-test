import { NextResponse } from 'next/server';
import { resolveDemoDocuments } from '@/lib/demo-documents';
import { listDocuments } from '@/lib/rag/documents';
import type { DocumentsResponse } from '@/types/document';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const demoDocs = searchParams.get('demoDocs')?.trim().toLowerCase();

  if (demoDocs) {
    const body: DocumentsResponse = { documents: resolveDemoDocuments(demoDocs) };
    return NextResponse.json(body);
  }

  try {
    const body: DocumentsResponse = { documents: await listDocuments() };
    return NextResponse.json(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load documents';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
