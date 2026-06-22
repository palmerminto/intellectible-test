import { NextResponse } from 'next/server';
import type { Document } from '@/types/document';
import type { DocumentsResponse } from '@/types/document';

function buildDemoDocuments(mode: string): Document[] {
  const now = new Date().toISOString();

  const readyDoc: Document = {
    id: 'demo-ready-1',
    filename: 'city-council-rfp.pdf',
    status: 'ready',
    sizeBytes: 3_240_111,
    pageCount: 48,
    errorMessage: null,
    createdAt: now,
  };

  const processingDoc: Document = {
    id: 'demo-processing-1',
    filename: 'amendment-02.pdf',
    status: 'processing',
    sizeBytes: 624_112,
    pageCount: null,
    errorMessage: null,
    createdAt: now,
  };

  const failedDoc: Document = {
    id: 'demo-failed-1',
    filename: 'scanned-annex.pdf',
    status: 'failed',
    sizeBytes: 1_830_450,
    pageCount: null,
    errorMessage: 'Could not extract text from PDF',
    createdAt: now,
  };

  switch (mode) {
    case 'ready':
      return [readyDoc];
    case 'processing':
      return [processingDoc];
    case 'failed':
      return [failedDoc];
    case 'mixed':
      return [processingDoc, readyDoc, failedDoc];
    default:
      return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const demoDocs = searchParams.get('demoDocs')?.trim().toLowerCase();

  const documents = demoDocs ? buildDemoDocuments(demoDocs) : [];
  const body: DocumentsResponse = { documents };
  return NextResponse.json(body);
}
