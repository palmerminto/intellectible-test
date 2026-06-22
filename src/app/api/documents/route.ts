import { NextResponse } from 'next/server';
import type { DocumentsResponse } from '@/types/document';

export async function GET() {
  const body: DocumentsResponse = { documents: [] };
  return NextResponse.json(body);
}
